const { success, error } = require('../utils/apiResponse')
const { Bill, Patient, Visit, Clinic } = require('../models')
const { Op } = require('sequelize')
const { sendMessage } = require('../services/message.service')
const { writeAudit }  = require('../utils/audit')

// ── POST /api/bills ───────────────────────────────────────────────
const createBill = async (req, res) => {
  const { patientId, visitId, tokenId, items, discountPercent } = req.body
  const clinicId = req.user.clinicId

  if (!patientId)        return error(res, 'Patient ID is required', 400)
  if (!items?.length)    return error(res, 'At least one item is required', 400)

  try {
    // Verify patient belongs to this clinic
    const patient = await Patient.findOne({ where: { id: patientId, clinicId } })
    if (!patient) return error(res, 'Patient not found', 404)

    const processedItems = items.map(item => ({
      name:      item.name,
      quantity:  Number(item.quantity)  || 1,
      unitPrice: Number(item.unitPrice) || 0,
      lineTotal: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    }))

    const subtotal     = processedItems.reduce((sum, i) => sum + i.lineTotal, 0)
    const discountAmt  = Math.round(subtotal * ((Number(discountPercent) || 0) / 100) * 100) / 100
    const taxable      = subtotal - discountAmt
    const tax          = Math.round(taxable * 0.18 * 100) / 100
    const total        = Math.round((taxable + tax) * 100) / 100

    const bill = await Bill.create({
      patientId,
      clinicId,
      visitId:  visitId || null,
      tokenId:  tokenId || null,
      items:    processedItems,
      subtotal,
      discountPercent: Number(discountPercent) || 0,
      discountAmt,
      tax,
      total,
      status: 'unpaid',
    })

    return success(res, { bill }, 201)
  } catch (err) {
    console.error('createBill error:', err.message)
    return error(res, 'Failed to create bill', 500)
  }
}

// ── PATCH /api/bills/:id/payment ──────────────────────────────────
const markPaid = async (req, res) => {
  const { paymentMethod, amount } = req.body  // amount optional — if absent, full payment
  const clinicId = req.user.clinicId

  const validMethods = ['cash', 'upi', 'card', 'online']
  if (!validMethods.includes(paymentMethod)) {
    return error(res, 'Invalid payment method', 400)
  }

  try {
    const bill = await Bill.findOne({ where: { id: req.params.id, clinicId } })
    if (!bill)                  return error(res, 'Bill not found', 404)
    if (bill.status === 'paid') return error(res, 'Bill is already paid', 400)

    const payAmount   = amount ? Math.min(Number(amount), Number(bill.total)) : Number(bill.total)
    const newPaid     = Number(bill.paidAmount) + payAmount
    const isFullyPaid = newPaid >= Number(bill.total)

    await bill.update({
      paidAmount:    newPaid,
      status:        isFullyPaid ? 'paid' : 'partial',
      paymentMethod,
      paidAt:        isFullyPaid ? new Date() : bill.paidAt,
    })

    // Trigger receipt message on full payment
    if (isFullyPaid) {
      try {
        const clinic = await Clinic.findByPk(clinicId, { attributes: ['name', 'address'] })
        
        // Generate PDF
        bill.clinic = clinic
        if (!bill.patient) bill.patient = await Patient.findByPk(bill.patientId)
        
        const { generateBillPDF } = require('../utils/pdfGenerator')
        const pdfBuffer = await generateBillPDF(bill)

        sendMessage({
          patientId: bill.patientId,
          clinicId,
          templateName: 'bill_receipt',
          variables: {
            patient_name:   bill.patient?.name || 'Patient',
            amount:         Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            payment_method: paymentMethod.toUpperCase(),
            payment_date:   new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            clinic_name:    clinic?.name || 'the clinic',
          },
          channels: ['email', 'whatsapp'],
          attachments: [{
            filename: `Receipt_${bill.id.split('-')[0].toUpperCase()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        })
      } catch (msgErr) {
        console.error('Bill receipt message trigger failed:', msgErr.message)
      }
    }

    writeAudit({
      userId:   req.user.id,
      clinicId,
      action:   isFullyPaid ? 'BILL_PAID' : 'BILL_PARTIAL_PAID',
      entity:   'Bill',
      entityId: bill.id,
      meta:     { amount: payAmount, paymentMethod },
    })

    return success(res, { bill, message: isFullyPaid ? 'Payment complete' : 'Partial payment recorded' })
  } catch (err) {
    console.error('markPaid error:', err.message)
    return error(res, 'Failed to record payment', 500)
  }
}

// ── GET /api/bills/:id ────────────────────────────────────────────
const getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      where:   { id: req.params.id, clinicId: req.user.clinicId },
      include: [
        { association: 'patient', attributes: ['id', 'name', 'phone'] },
        { association: 'clinic',  attributes: ['id', 'name', 'address', 'phone'] },
      ],
    })

    if (!bill) return error(res, 'Bill not found', 404)

    return success(res, { bill })
  } catch (err) {
    console.error('getBill error:', err.message)
    return error(res, 'Failed to fetch bill', 500)
  }
}

// ── GET /api/bills  (list for a patient) ──────────────────────────
const getPatientBills = async (req, res) => {
  const { patientId } = req.query
  const clinicId = req.user.clinicId

  try {
    const where = { clinicId }
    if (patientId) where.patientId = patientId

    const bills = await Bill.findAll({
      where,
      include: [{ association: 'patient', attributes: ['id', 'name', 'phone'] }],
      order:   [['createdAt', 'DESC']],
      limit:   50,
    })

    return success(res, { bills })
  } catch (err) {
    console.error('getPatientBills error:', err.message)
    return error(res, 'Failed to fetch bills', 500)
  }
}

// ── POST /api/bills/:id/razorpay-order ────────────────────────────
// Step 1: Create a Razorpay order → frontend uses this to open checkout
const createRazorpayOrder = async (req, res) => {
  try {
    const { createOrder } = require('../services/razorpay.service')

    const bill = await Bill.findOne({
      where:   { id: req.params.id },
      include: [{ association: 'patient', attributes: ['id', 'name', 'phone'] }],
    })

    if (!bill)                  return error(res, 'Bill not found', 404)
    if (bill.status === 'paid') return error(res, 'Bill is already paid', 400)

    const remainingAmount = Number(bill.total) - Number(bill.paidAmount || 0)

    const order = await createOrder({
      amount:  remainingAmount,
      receipt: `b_${bill.id.split('-')[0]}`, // Keep < 40 chars to avoid Razorpay error
      notes: {
        billId:      bill.id,
        patientName: bill.patient?.name ? bill.patient.name.slice(0, 50) : 'Patient',
        clinicId:    bill.clinicId,
      },
    })

    return success(res, {
      orderId:      order.id,
      amount:       order.amount,    // in paise
      currency:     order.currency,
      billId:       bill.id,
      keyId:        process.env.RAZORPAY_KEY_ID,
      patientName:  bill.patient?.name  || 'Patient',
      patientPhone: bill.patient?.phone || '',
    })
  } catch (err) {
    console.error('createRazorpayOrder error:', err?.error || err)
    return error(res, 'Failed to create payment order', 500)
  }
}

// ── POST /api/bills/:id/razorpay-verify ───────────────────────────
// Step 2: Verify payment after Razorpay checkout completes
const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return error(res, 'Missing payment verification data', 400)
  }

  try {
    const { verifySignature } = require('../services/razorpay.service')

    // SECURITY: always verify signature before marking paid
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!isValid) {
      return error(res, 'Payment verification failed — invalid signature', 400)
    }

    const bill = await Bill.findOne({
      where:   { id: req.params.id },
      include: [{ association: 'patient', attributes: ['id', 'name'] }],
    })

    if (!bill) return error(res, 'Bill not found', 404)

    const remainingAmount = Number(bill.total) - Number(bill.paidAmount || 0)
    const newPaid = Number(bill.paidAmount || 0) + remainingAmount

    await bill.update({
      paidAmount:        newPaid,
      status:            'paid',
      paymentMethod:     'online',
      paidAt:            new Date(),
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId:   razorpay_order_id,
    })

    // Trigger receipt message
    const { sendMessage } = require('../services/message.service')
    const clinic = await require('../models').Clinic.findByPk(bill.clinicId, { attributes: ['name', 'address'] })
    
    // Generate PDF
    bill.clinic = clinic
    const { generateBillPDF } = require('../utils/pdfGenerator')
    const pdfBuffer = await generateBillPDF(bill)

    sendMessage({
      patientId:    bill.patientId,
      clinicId:     bill.clinicId,
      templateName: 'bill_receipt',
      variables: {
        patient_name:   bill.patient?.name || 'Patient',
        amount:         Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        payment_method: 'Online (Razorpay)',
        payment_date:   new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }),
        clinic_name:    clinic?.name || 'the clinic',
      },
      channels: ['email'],
      attachments: [{
        filename: `Receipt_${bill.id.split('-')[0].toUpperCase()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    })

    writeAudit({
      userId:   null,  // patient self-paid
      clinicId: bill.clinicId,
      action:   'BILL_PAID_ONLINE',
      entity:   'Bill',
      entityId: bill.id,
      meta:     { amount: bill.total, razorpay_payment_id },
    })

    return success(res, { message: 'Payment verified and recorded', bill })
  } catch (err) {
    console.error('verifyRazorpayPayment error:', err.message)
    return error(res, 'Payment verification failed', 500)
  }
}

module.exports = {
  createBill,
  markPaid,
  getBill,
  getPatientBills,
  createRazorpayOrder,
  verifyRazorpayPayment,
}
