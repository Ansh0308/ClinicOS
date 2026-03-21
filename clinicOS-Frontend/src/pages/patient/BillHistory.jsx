import { useState, useEffect } from 'react'
import { patientPortalAPI } from '../../services/api'
import { useRazorpay } from '../../hooks/useRazorpay'
import { Receipt, CheckCircle, IndianRupee, X, AlertCircle } from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'upi',  label: 'UPI',  emoji: '📱', desc: 'Google Pay / PhonePe' },
  { id: 'card', label: 'Card', emoji: '💳', desc: 'Debit / Credit card' },
  { id: 'cash', label: 'Cash', emoji: '💵', desc: 'Pay at counter' },
]

export default function BillHistory() {
  const [bills, setBills]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [payingBill, setPayingBill]       = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [processing, setProcessing]       = useState(false)
  const [paidSuccess, setPaidSuccess]     = useState(null)
  const [errorMsg, setErrorMsg]           = useState('')

  const { openCheckout } = useRazorpay()

  const fetchBills = () => {
    patientPortalAPI.getBills()
      .then(res => setBills(res.data.data.bills))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBills() }, [])

  // ── Online payment via Razorpay ──────────────────────────────────
  const handlePayOnline = async () => {
    if (!payingBill) return
    setProcessing(true)
    setErrorMsg('')
    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await patientPortalAPI.createRazorpayOrder(payingBill.id)
      const order    = orderRes.data.data

      // Step 2: Open Razorpay checkout modal
      openCheckout(
        order,
        // On success — verify with backend
        async (rzpResponse) => {
          try {
            await patientPortalAPI.verifyPayment(payingBill.id, {
              razorpay_payment_id: rzpResponse.razorpay_payment_id,
              razorpay_order_id:   rzpResponse.razorpay_order_id,
              razorpay_signature:  rzpResponse.razorpay_signature,
            })
            setPaidSuccess(payingBill)
            setPayingBill(null)
            fetchBills()
          } catch (verifyErr) {
            setErrorMsg(verifyErr.response?.data?.error || 'Payment verification failed. Contact support.')
          } finally {
            setProcessing(false)
          }
        },
        // On failure / cancel
        (err) => {
          setErrorMsg(err.message || 'Payment was not completed.')
          setProcessing(false)
        }
      )
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Could not initiate payment. Please try again.')
      setProcessing(false)
    }
  }

  // ── Cash payment (mark paid immediately) ────────────────────────
  const handlePayCash = async () => {
    if (!payingBill) return
    setProcessing(true)
    setErrorMsg('')
    try {
      await patientPortalAPI.payBill(payingBill.id, 'cash')
      setPaidSuccess(payingBill)
      setPayingBill(null)
      fetchBills()
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handlePay = () => {
    if (paymentMethod === 'cash') return handlePayCash()
    return handlePayOnline()
  }

  const unpaidBills = bills.filter(b => b.status !== 'paid')
  const paidBills   = bills.filter(b => b.status === 'paid')

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-1/3" />
        {[1, 2, 3].map(i => <div key={i} className="card h-20" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Bills</h1>
        <p className="font-body text-sm text-text-muted">
          {unpaidBills.length > 0 && (
            <span className="text-accent-coral font-semibold">{unpaidBills.length} unpaid · </span>
          )}
          {bills.length} total
        </p>
      </div>

      {/* Payment success banner */}
      {paidSuccess && (
        <div className="bg-accent-teal/10 border border-accent-teal/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-accent-teal" />
            <p className="font-body text-sm font-semibold text-accent-teal">
              Payment of ₹{Number(paidSuccess.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })} successful! Receipt emailed.
            </p>
          </div>
          <button onClick={() => setPaidSuccess(null)}><X size={14} className="text-accent-teal" /></button>
        </div>
      )}

      {bills.length === 0 ? (
        <div className="card text-center py-16">
          <Receipt size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">No bills yet</p>
          <p className="font-body text-sm text-text-muted">Your bills will appear here after a visit</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unpaidBills.length > 0 && (
            <p className="font-body text-xs font-bold uppercase tracking-wider text-accent-coral">Pending Payment</p>
          )}
          {unpaidBills.map(bill => (
            <BillCard key={bill.id} bill={bill} onPay={() => { setPayingBill(bill); setErrorMsg('') }} />
          ))}
          {paidBills.length > 0 && (
            <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mt-4">Paid</p>
          )}
          {paidBills.map(bill => <BillCard key={bill.id} bill={bill} />)}
        </div>
      )}

      {/* ── Payment bottom sheet ─────────────────────────────────── */}
      {payingBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-text-primary">Pay Bill</h3>
              <button onClick={() => { setPayingBill(null); setErrorMsg('') }}>
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            {/* Bill summary */}
            <div className="bg-cream-50 rounded-2xl p-4">
              <p className="font-body text-sm text-text-muted mb-2">{payingBill.clinic?.name}</p>
              {payingBill.items?.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between font-body text-sm text-text-body mb-1">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              {payingBill.items?.length > 3 && (
                <p className="font-body text-xs text-text-muted">+{payingBill.items.length - 3} more items</p>
              )}
              <div className="flex justify-between font-display font-bold text-xl text-crimson-600 border-t border-cream-300 mt-3 pt-3">
                <span>Total</span>
                <span>₹{Number(payingBill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                Choose payment method
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-3 px-2 rounded-2xl border-2 font-body text-sm font-semibold transition-all flex flex-col items-center gap-1
                      ${paymentMethod === m.id
                        ? 'border-crimson-500 bg-crimson-50 text-crimson-700'
                        : 'border-cream-300 bg-white text-text-body hover:border-cream-400'
                      }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span>{m.label}</span>
                    <span className="font-body text-xs text-text-muted font-normal">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="flex items-center gap-2 bg-accent-coral/10 border border-accent-coral/30 rounded-xl p-3">
                <AlertCircle size={15} className="text-accent-coral flex-shrink-0" />
                <p className="font-body text-sm text-accent-coral">{errorMsg}</p>
              </div>
            )}

            {/* Razorpay note for online methods */}
            {paymentMethod !== 'cash' && (
              <p className="font-body text-xs text-text-muted text-center">
                🔒 Secured by Razorpay — you'll be redirected to complete payment
              </p>
            )}

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-4 rounded-pill bg-accent-teal text-white font-body font-bold text-base flex flex-col items-center justify-center gap-1 shadow-btn hover:brightness-105 transition-all disabled:opacity-60"
            >
              {processing ? (
                <>
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xs font-normal">Processing payment...</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <IndianRupee size={18} />
                  {paymentMethod === 'cash' ? 'Mark as Paid (Cash)' : `Pay ₹${Number(payingBill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })} via ${PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}`}
                </span>
              )}
            </button>

            <p className="font-body text-xs text-text-muted text-center">
              A receipt will be emailed to you after payment.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function BillCard({ bill, onPay }) {
  return (
    <div className={`card border-2 ${bill.status !== 'paid' ? 'border-accent-coral/20' : 'border-transparent'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-body font-bold text-sm text-text-primary">{bill.clinic?.name}</p>
          <p className="font-body text-xs text-text-muted mt-0.5">
            {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="mt-2 space-y-0.5">
            {bill.items?.slice(0, 2).map((item, i) => (
              <p key={i} className="font-body text-xs text-text-muted">
                {item.name} × {item.quantity}
                <span className="ml-2">₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </p>
            ))}
            {bill.items?.length > 2 && <p className="font-body text-xs text-text-muted">+{bill.items.length - 2} more</p>}
          </div>
        </div>

        <div className="text-right ml-4 flex flex-col items-end gap-2">
          <p className="font-display font-bold text-lg text-text-primary">
            ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          {bill.status === 'paid' ? (
            <span className="inline-flex items-center gap-1 font-body text-xs font-bold px-2 py-0.5 rounded-pill bg-accent-teal/10 text-accent-teal">
              <CheckCircle size={11} /> Paid · {bill.paymentMethod?.toUpperCase()}
            </span>
          ) : (
            <button
              onClick={onPay}
              className="flex items-center gap-1 font-body text-xs font-bold px-3 py-1.5 rounded-pill bg-accent-coral text-white hover:brightness-105 transition-all"
            >
              <IndianRupee size={11} /> Pay Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
