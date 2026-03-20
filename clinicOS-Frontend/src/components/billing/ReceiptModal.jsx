import { useRef } from 'react'
import { X, Printer, CheckCircle } from 'lucide-react'

export default function ReceiptModal({ bill, onClose }) {

  const handlePrint = () => {
    window.print()
  }

  const formatMethod = (m) => m === 'upi' ? 'UPI' : m === 'card' ? 'Card' : 'Cash'
  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <>
      {/* ── Backdrop ─────────────────────────── */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

        {/* Modal wrapper */}
        <div className="bg-white rounded-3xl shadow-hero w-full max-w-md overflow-hidden">

          {/* Header — hidden on print */}
          <div className="print-hide nav-gradient px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-accent-yellow" />
              <span className="font-display font-bold text-white text-lg">
                Payment Successful
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Receipt content (this part prints) ─────────────── */}
          <div className="print-receipt p-6">

            {/* Clinic header */}
            <div className="text-center mb-5 pb-4 border-b border-dashed border-cream-300">
              <p className="font-display font-bold text-xl text-text-primary">
                {bill.clinic?.name || 'Clinic'}
              </p>
              {bill.clinic?.address && (
                <p className="font-body text-xs text-text-muted mt-0.5">
                  {bill.clinic.address}
                </p>
              )}
              {bill.clinic?.phone && (
                <p className="font-body text-xs text-text-muted">
                  Ph: {bill.clinic.phone}
                </p>
              )}
              <p className="font-body text-xs font-bold text-accent-teal mt-1">
                RECEIPT
              </p>
            </div>

            {/* Patient + date row */}
            <div className="flex justify-between mb-4">
              <div>
                <p className="font-body text-xs text-text-muted">Patient</p>
                <p className="font-body font-bold text-text-primary">
                  {bill.patient?.name || 'Patient'}
                </p>
                <p className="font-body text-xs text-text-muted">
                  {bill.patient?.phone}
                </p>
              </div>
              <div className="text-right">
                <p className="font-body text-xs text-text-muted">Date & Time</p>
                <p className="font-body text-xs text-text-primary">
                  {formatDate(bill.paidAt || bill.createdAt)}
                </p>
                <p className="font-body text-xs font-bold text-accent-teal mt-0.5 capitalize">
                  {formatMethod(bill.paymentMethod)}
                </p>
              </div>
            </div>

            {/* Line items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E0D4B5' }}>
                  <th style={{ textAlign: 'left',  fontSize: '11px', color: '#8A6070', paddingBottom: '6px', fontWeight: 600 }}>Service</th>
                  <th style={{ textAlign: 'center',fontSize: '11px', color: '#8A6070', paddingBottom: '6px', fontWeight: 600 }}>Qty</th>
                  <th style={{ textAlign: 'right', fontSize: '11px', color: '#8A6070', paddingBottom: '6px', fontWeight: 600 }}>Price</th>
                  <th style={{ textAlign: 'right', fontSize: '11px', color: '#8A6070', paddingBottom: '6px', fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items?.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F5EDD8' }}>
                    <td style={{ fontSize: '12px', color: '#5C3040', padding: '5px 0' }}>{item.name}</td>
                    <td style={{ fontSize: '12px', color: '#8A6070', textAlign: 'center', padding: '5px 0' }}>{item.quantity}</td>
                    <td style={{ fontSize: '12px', color: '#5C3040', textAlign: 'right', padding: '5px 0' }}>₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontSize: '12px', color: '#5C3040', textAlign: 'right', padding: '5px 0' }}>₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ borderTop: '1px solid #E0D4B5', paddingTop: '8px' }}>
              {Number(bill.discountAmt) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8A6070', marginBottom: '4px' }}>
                  <span>Subtotal</span>
                  <span>₹{Number(bill.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8A6070', marginBottom: '4px' }}>
                {Number(bill.discountAmt) > 0 ? (
                  <span>Discount ({Number(bill.discountPercent)}%)</span>
                ) : (
                  <span>Subtotal</span>
                )}
                {Number(bill.discountAmt) > 0 ? (
                  <span style={{ color: '#5AB09A' }}>-₹{Number(bill.discountAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                ) : (
                  <span>₹{Number(bill.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8A6070', marginBottom: '8px' }}>
                <span>GST (18%)</span>
                <span>₹{Number(bill.tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#C43055', borderTop: '2px solid #E0D4B5', paddingTop: '8px' }}>
                <span>Total Paid</span>
                <span>₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Payment confirmation */}
            <div style={{ marginTop: '16px', padding: '10px', background: '#E8F8F3', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#5AB09A' }}>
                ✓ Paid via {formatMethod(bill.paymentMethod)}
              </p>
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#8A6070', marginTop: '16px' }}>
              Thank you for visiting {bill.clinic?.name}
            </p>
          </div>

          {/* Action buttons — hidden on print */}
          <div className="print-hide px-6 pb-6 flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-cream-300 bg-cream-50 font-body text-sm font-semibold text-text-body hover:bg-cream-100 transition-all"
            >
              <Printer size={15} />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent-teal text-white font-body text-sm font-bold shadow-btn hover:brightness-105 transition-all"
            >
              <CheckCircle size={15} />
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
