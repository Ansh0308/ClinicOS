import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { billAPI, patientAPI } from '../../services/api'
import ReceptionLayout from '../../layouts/ReceptionLayout'
import ReceiptModal from '../../components/billing/ReceiptModal'
import { Plus, X, ArrowLeft, IndianRupee } from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash',    emoji: '💵' },
  { id: 'upi',  label: 'UPI',     emoji: '📱' },
  { id: 'card', label: 'Card',    emoji: '💳' },
]

const DEFAULT_SERVICES = [
  'Consultation Fee',
  'Follow-up Consultation',
  'Dressing / Wound Care',
  'Injection / IV',
  'ECG',
  'Blood Test',
  'X-Ray',
  'Urine Test',
]

export default function BillingScreen() {
  const { patientId }  = useParams()
  const navigate       = useNavigate()
  const location       = useLocation()

  // Patient can be passed via navigation state (from reception)
  // or fetched from API
  const [patient, setPatient]         = useState(location.state?.patient || null)
  const [loadingPatient, setLoadingPatient] = useState(!location.state?.patient)

  const [items, setItems]             = useState([
    { id: 1, name: 'Consultation Fee', quantity: 1, unitPrice: 300 }
  ])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [creating, setCreating]       = useState(false)
  const [paying, setPaying]           = useState(false)
  const [discount, setDiscount]       = useState(0)
  const [bill, setBill]               = useState(null)      // created bill
  const [paidBill, setPaidBill]       = useState(null)      // after payment
  const [showReceipt, setShowReceipt] = useState(false)
  const [error, setError]             = useState('')

  // Fetch patient if not passed via state
  useEffect(() => {
    if (patient || !patientId) return
    patientAPI.get(patientId)
      .then(res => setPatient(res.data.data.patient))
      .catch(() => setError('Patient not found'))
      .finally(() => setLoadingPatient(false))
  }, [patientId, patient])

  // ── Item helpers ──────────────────────────────────────────────
  const addItem = () => {
    setItems(prev => [...prev, {
      id:        Date.now(),
      name:      '',
      quantity:  1,
      unitPrice: 0,
    }])
  }

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id) => {
    if (items.length === 1) return // keep at least one row
    setItems(prev => prev.filter(item => item.id !== id))
  }

  // ── Totals ────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) =>
    sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0
  )
  const discountAmt = Math.round(subtotal * (Number(discount) / 100) * 100) / 100
  const taxable     = subtotal - discountAmt
  const tax         = Math.round(taxable * 0.18 * 100) / 100
  const total       = Math.round((taxable + tax) * 100) / 100

  // ── Create bill ───────────────────────────────────────────────
  const handleCreateBill = async () => {
    const validItems = items.filter(i => i.name && Number(i.unitPrice) > 0)
    if (!validItems.length) {
      setError('Add at least one item with a name and price')
      return
    }

    setCreating(true)
    setError('')
    try {
      const res = await billAPI.create({
        patientId: patient.id,
        visitId:   location.state?.visitId || null,
        items:     validItems,
        discountPercent: discount,
      })
      setBill(res.data.data.bill)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create bill')
    } finally {
      setCreating(false)
    }
  }

  // ── Mark paid ─────────────────────────────────────────────────
  const handleMarkPaid = async () => {
    if (!bill) return
    setPaying(true)
    setError('')
    try {
      const res = await billAPI.markPaid(bill.id, paymentMethod)
      // Fetch full bill with clinic + patient details for receipt
      const full = await billAPI.get(bill.id)
      setPaidBill(full.data.data.bill)
      setShowReceipt(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment')
    } finally {
      setPaying(false)
    }
  }

  if (loadingPatient) {
    return (
      <ReceptionLayout>
        <div className="flex items-center justify-center py-20">
          <span className="w-6 h-6 border-2 border-crimson-300 border-t-crimson-600 rounded-full animate-spin" />
        </div>
      </ReceptionLayout>
    )
  }

  return (
    <ReceptionLayout>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/reception')}
            className="w-9 h-9 rounded-xl bg-white border border-cream-300 flex items-center justify-center hover:bg-cream-100 transition-all"
          >
            <ArrowLeft size={18} className="text-text-body" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">
              Create Bill
            </h1>
            {patient && (
              <p className="font-body text-sm text-text-muted">
                {patient.name || 'Patient'} · {patient.phone}
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-accent-coral/10 border border-accent-coral/30 rounded-2xl p-3 mb-4 font-body text-sm text-accent-coral">
            {error}
          </div>
        )}

        {/* ── Step 1: Line Items (shown until bill created) ─────── */}
        {!bill && (
          <>
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg text-text-primary">
                  Services & Items
                </h2>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 font-body text-sm font-bold text-crimson-500 hover:text-crimson-700 transition-colors"
                >
                  <Plus size={15} /> Add Item
                </button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                <p className="col-span-5 font-body text-xs text-text-muted">Service / Item</p>
                <p className="col-span-2 font-body text-xs text-text-muted">Qty</p>
                <p className="col-span-3 font-body text-xs text-text-muted">Unit Price (₹)</p>
                <p className="col-span-1 font-body text-xs text-text-muted text-right">Total</p>
                <p className="col-span-1" />
              </div>

              {/* Item rows */}
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    {/* Service name with datalist suggestions */}
                    <div className="col-span-5">
                      <input
                        list="services"
                        value={item.name}
                        onChange={e => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Service name"
                        className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-cream-50 font-body text-sm text-text-primary focus:outline-none focus:border-crimson-400 transition-all"
                      />
                      <datalist id="services">
                        {DEFAULT_SERVICES.map(s => <option key={s} value={s} />)}
                      </datalist>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-cream-50 font-body text-sm text-text-primary focus:outline-none focus:border-crimson-400 transition-all"
                      />
                    </div>

                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-text-muted">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-cream-300 bg-cream-50 font-body text-sm text-text-primary focus:outline-none focus:border-crimson-400 transition-all"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 text-right">
                      <span className="font-body text-sm font-semibold text-text-primary">
                        ₹{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 rounded-lg text-accent-coral hover:bg-accent-coral/10 flex items-center justify-center transition-all"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals summary */}
            <div className="card mb-4">
              <div className="space-y-2">
                <div className="flex justify-between font-body text-sm text-text-body">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between font-body text-sm text-text-body">
                  <span>Discount</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      className="w-16 px-2 py-1 rounded-lg border border-cream-300 text-center font-body text-sm focus:outline-none focus:border-crimson-400"
                    />
                    <span className="text-text-muted">%</span>
                    {discountAmt > 0 && (
                      <span className="text-accent-teal font-semibold">
                        -₹{discountAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between font-body text-sm text-text-muted">
                  <span>GST (18%)</span>
                  <span>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-display font-bold text-xl text-text-primary border-t border-cream-200 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-crimson-600">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateBill}
              disabled={creating || !patient}
              className="btn-primary w-full justify-center py-3.5 text-sm disabled:opacity-50"
            >
              {creating ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><IndianRupee size={16} /> Generate Bill</>
              )}
            </button>
          </>
        )}

        {/* ── Step 2: Payment (shown after bill created) ─────────── */}
        {bill && !paidBill && (
          <>
            {/* Bill summary */}
            <div className="card mb-4 bg-cream-50 border-2 border-cream-300">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted">
                  Bill Generated
                </p>
                <span className="font-body text-xs font-bold text-accent-yellow bg-accent-yellow/10 px-2 py-0.5 rounded-pill">
                  Unpaid
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {bill.items?.map((item, i) => (
                  <div key={i} className="flex justify-between font-body text-sm text-text-body">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-cream-300 pt-2">
                <div className="flex justify-between font-display font-bold text-xl text-crimson-600">
                  <span>Total</span>
                  <span>₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="card mb-4">
              <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Payment Method
              </p>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-3 rounded-2xl border-2 font-body text-sm font-semibold transition-all flex flex-col items-center gap-1
                      ${paymentMethod === m.id
                        ? 'border-crimson-500 bg-crimson-50 text-crimson-700'
                        : 'border-cream-300 bg-white text-text-body hover:border-crimson-200'
                      }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleMarkPaid}
              disabled={paying}
              className="w-full py-3.5 rounded-pill bg-accent-teal text-white font-body font-bold text-sm shadow-btn hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {paying ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <IndianRupee size={16} />
                  Mark as Paid · ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Receipt modal */}
      {showReceipt && paidBill && (
        <ReceiptModal
          bill={paidBill}
          onClose={() => {
            setShowReceipt(false)
            navigate('/reception')
          }}
        />
      )}
    </ReceptionLayout>
  )
}
