Let me re-read the documents carefully before answering.Now I have everything I need. Let me address both problems properly.

---

## What the PRD Actually Says

From **F6 User Interaction Flow:**
> *"After consultation, receptionist clicks 'Create Bill' on **patient visit card**"*

From **ST-3 (Queue Console):**
> Staff see served tokens → each served token has a **"Create Bill"** button

So the correct flow is:
```
Doctor completes consultation → token moves to "served"
→ Receptionist sees served token in queue board
→ Clicks "Create Bill" on that served token row
→ Goes to billing screen with patient + visitId pre-filled
→ Creates bill → marks paid → receipt
```

**The bill is NOT auto-generated on consultation complete.** It's a manual staff action triggered from the queue board on a served token. That's what you correctly flagged.

---

## Fix 1 — Add "Create Bill" to Served Token Rows

Open `ReceptionDashboard.jsx`. Find the `TokenRow` component and update it:

```jsx
// Add useNavigate import at top of file
import { useNavigate } from 'react-router-dom'

// Update TokenRow to accept navigate prop
function TokenRow({ token, onStatusChange, onCancel, done = false, onCreateBill }) {
  const config = STATUS[token.status] || STATUS.waiting

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all
      ${done ? 'opacity-70' : ''} ${config.rowBg} ${config.border}`}
    >
      <span className={`font-display font-bold text-sm px-3 py-1 rounded-pill flex-shrink-0 ${config.bg} ${config.text}`}>
        T-{token.tokenNumber}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-sm text-text-primary truncate">
          {token.patient?.name || token.patient?.phone || 'Patient'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="font-body text-xs text-text-muted">{config.label}</span>
          {token.estimatedWait > 0 && token.status === 'waiting' && (
            <span className="font-body text-xs text-text-muted">· ~{token.estimatedWait}m wait</span>
          )}
          {token.doctor && (
            <span className="font-body text-xs text-text-muted">· {token.doctor.name}</span>
          )}
        </div>
      </div>

      {/* Active token actions */}
      {!done && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {token.status === 'waiting' && (
            <Btn icon={Activity}     onClick={() => onStatusChange(token.id, 'now')}     title="Call now"      cls="text-crimson-500 hover:bg-crimson-100" />
          )}
          {token.status === 'now' && (
            <Btn icon={CheckCircle}  onClick={() => onStatusChange(token.id, 'served')}  title="Mark served"   cls="text-accent-teal hover:bg-accent-teal/10" />
          )}
          {['waiting','now'].includes(token.status) && (
            <Btn icon={FlaskConical} onClick={() => onStatusChange(token.id, 'lab')}     title="Send to lab"   cls="text-accent-sky hover:bg-accent-sky/10" />
          )}
          {['waiting','now'].includes(token.status) && (
            <Btn icon={Pause}        onClick={() => onStatusChange(token.id, 'paused')}  title="Hold"          cls="text-text-muted hover:bg-cream-200" />
          )}
          {token.status === 'paused' && (
            <Btn icon={Play}         onClick={() => onStatusChange(token.id, 'waiting')} title="Resume"        cls="text-crimson-500 hover:bg-crimson-100" />
          )}
          {token.status === 'lab' && (
            <Btn icon={Activity}     onClick={() => onStatusChange(token.id, 'waiting')} title="Back to queue" cls="text-crimson-500 hover:bg-crimson-100" />
          )}
          <Btn icon={X}              onClick={() => onCancel(token.id)}                  title="Cancel"        cls="text-accent-coral hover:bg-accent-coral/10" />
        </div>
      )}

      {/* ── Served token: show Create Bill button ─────────────── */}
      {token.status === 'served' && onCreateBill && (
        <button
          onClick={() => onCreateBill(token)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-teal text-white font-body text-xs font-bold hover:brightness-105 transition-all flex-shrink-0"
        >
          <IndianRupee size={12} />
          Bill
        </button>
      )}
    </div>
  )
}
```

Now add `IndianRupee` to your imports and add `handleCreateBill` to the main component:

```jsx
// Add to imports
import { IndianRupee } from 'lucide-react'

// Add inside the main component (alongside other handlers)
const handleCreateBill = (token) => {
  navigate(`/billing/${token.patient?.id}`, {
    state: {
      patient: token.patient,
      tokenId: token.id,
    }
  })
}
```

Then update all `TokenRow` usages to pass the handler — only served tokens need it:

```jsx
// In the active tokens section:
{activeTokens.map(token => (
  <TokenRow
    key={token.id}
    token={token}
    onStatusChange={handleStatusChange}
    onCancel={handleCancel}
  />
))}

// In the done tokens section:
{doneTokens.slice(0, 5).map(token => (
  <TokenRow
    key={token.id}
    token={token}
    onStatusChange={handleStatusChange}
    onCancel={handleCancel}
    done
    onCreateBill={token.status === 'served' ? handleCreateBill : null}
  />
))}
```

Also add `useNavigate` to the component:

```jsx
const navigate = useNavigate()
```

And remove the "Create Bill Only" button from the patient lookup card — billing only happens after consultation via the served token row, not from the lookup panel.

---

## Fix 2 — Empty PDF on Print

The `window.print()` approach with inline `<style>` doesn't work reliably in React because the style tag is scoped to the modal and browsers ignore it for print. Fix this properly with a dedicated print stylesheet in `index.css` and a print-specific wrapper class.

### Update `client/src/index.css`

Add at the bottom:

```css
/* ── Print styles for billing receipt ───────────────────────── */
@media print {
  /* Hide everything except the receipt */
  body > * {
    display: none !important;
  }

  /* Show only the element with this class */
  .print-receipt {
    display: block !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    background: white !important;
    z-index: 99999 !important;
    padding: 24px !important;
  }

  /* Hide modal header, backdrop, and buttons during print */
  .print-hide {
    display: none !important;
  }
}
```

### Update `ReceiptModal.jsx`

Replace the entire file:

```jsx
import { useRef } from 'react'
import { X, Printer, CheckCircle } from 'lucide-react'

export default function ReceiptModal({ bill, onClose }) {

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const formatMethod = (m) =>
    ({ cash: 'Cash', upi: 'UPI', card: 'Card' })[m] || m

  return (
    <>
      {/* ── Backdrop (hidden on print) ─────────────────────────── */}
      <div className="print-hide fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

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
              className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <X size={16} className="text-white" />
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
                <p className="font-body font-semibold text-sm text-text-primary">
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8A6070', marginBottom: '4px' }}>
                <span>Subtotal</span>
                <span>₹{Number(bill.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
              className="flex-1 btn-primary justify-center py-3 text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
```

**Why the old way failed:** The `<style>` tag inside a React component isn't a real stylesheet — browsers treat it as HTML content and don't apply it to the print media query. The fix is putting `@media print` in `index.css` (a real stylesheet) and using class names (`print-receipt`, `print-hide`) that the CSS targets.

---

## What Else the PRD Mentions That We Haven't Built Yet

Going through the PRD against what's done:

| PRD Item | Status |
|---|---|
| Discount field on bills | ❌ Missing — PRD says "discount field" |
| Bill linked to visitId | ✅ Done (passed via navigation state) |
| Service catalog (searchable dropdown) | ⚠️ Partial — we have a datalist, PRD wants a proper catalog |
| Bill status: partial payment | ❌ Missing — PRD mentions partial payments |
| Resend receipt button | ❌ Missing — PRD says "reprint option" + messaging |
| `bill_receipt` message on payment | ❌ Missing — Phase 7 (messaging) |
| Patient can view bills in portal | ❌ Phase 8 |
| GST filing export | ❌ Phase 9 (analytics) |

For now the **discount field** is the only MVP blocker. Add it to `BillingScreen.jsx`:

In the totals section, add discount before tax:

```jsx
// Add state
const [discount, setDiscount] = useState(0)

// Update tax and total calculations
const discountAmt = Math.round(subtotal * (Number(discount) / 100) * 100) / 100
const taxable     = subtotal - discountAmt
const tax         = Math.round(taxable * 0.18 * 100) / 100
const total       = Math.round((taxable + tax) * 100) / 100

// Add discount row in totals display (between items and GST):
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
```

Also pass `discount` to `billAPI.create` and handle it in the backend:

In `bill.controller.js` update `createBill`:

```js
const { patientId, visitId, items, discountPercent } = req.body

// Update calculation:
const subtotal     = processedItems.reduce((sum, i) => sum + i.lineTotal, 0)
const discountAmt  = Math.round(subtotal * ((Number(discountPercent) || 0) / 100) * 100) / 100
const taxable      = subtotal - discountAmt
const tax          = Math.round(taxable * 0.18 * 100) / 100
const total        = Math.round((taxable + tax) * 100) / 100
```

And add `discountPercent` and `discountAmt` fields to the Bill model:

```js
// In bill.model.js add:
discountPercent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
discountAmt:     { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
```

Restart server → Sequelize auto-adds those columns.

---

## Test After Fixes

- [ ] Reception queue → served token shows "Bill" green button
- [ ] Click "Bill" → billing screen opens with patient pre-filled
- [ ] Add discount % → total updates correctly
- [ ] Generate bill → mark paid → receipt modal opens
- [ ] Click "Print Receipt" → browser print dialog shows the actual receipt (not blank)
- [ ] Receipt has: clinic name, patient name, items table, subtotal, GST, total, payment method
- [ ] "Create Bill Only" button is removed from patient lookup card

Tell me when these are working and we move to Phase 7 — Messaging.