const { success, error } = require('../utils/apiResponse')
const { Bill, Patient, Visit, Clinic } = require('../models')
const { Op } = require('sequelize')
const { sendMessage } = require('../services/message.service')

// ── POST /api/bills ───────────────────────────────────────────────
const createBill = async (req, res) => {
  const { patientId, visitId, items, discountPercent } = req.body
  const clinicId = req.user.clinicId

  if (!patientId)        return error(res, 'Patient ID is required', 400)
  if (!items?.length)    return error(res, 'At least one item is required', 400)

  try {
    // Verify patient belongs to this clinic
    const patient = await Patient.findOne({ where: { id: patientId, clinicId } })
    if (!patient) return error(res, 'Patient not found', 404)

    // Calculate totals
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
  const { paymentMethod } = req.body
  const clinicId = req.user.clinicId

  const validMethods = ['cash', 'upi', 'card']
  if (!validMethods.includes(paymentMethod)) {
    return error(res, 'Payment method must be cash, upi, or card', 400)
  }

  try {
    const bill = await Bill.findOne({ where: { id: req.params.id, clinicId } })
    if (!bill) return error(res, 'Bill not found', 404)
    if (bill.status === 'paid') return error(res, 'Bill is already paid', 400)

    await bill.update({
      status:        'paid',
      paymentMethod,
      paidAt:        new Date(),
    })

    // ── Trigger bill_receipt message ──────────────────────────────────
    try {
      const clinic = await Clinic.findByPk(clinicId, { attributes: ['name'] })

      sendMessage({
        patientId: bill.patientId,
        clinicId,
        templateName: 'bill_receipt',
        variables: {
          patient_name:   bill.patient?.name || 'Patient',
          amount:         Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          payment_method: req.body.paymentMethod?.toUpperCase(),
          payment_date:   new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
          clinic_name:    clinic?.name || 'the clinic',
        },
        channels: ['email'],
      })
    } catch (err) {
      console.error('Bill receipt message trigger failed:', err.message)
    }

    return success(res, { bill, message: 'Payment recorded' })
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

module.exports = { createBill, markPaid, getBill, getPatientBills }
