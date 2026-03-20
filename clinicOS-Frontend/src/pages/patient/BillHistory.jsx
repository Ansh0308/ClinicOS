import { useState, useEffect } from 'react'
import { patientPortalAPI } from '../../services/api'
import { Receipt, CheckCircle, Clock } from 'lucide-react'

export default function BillHistory() {
  const [bills, setBills]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientPortalAPI.getBills()
      .then(res => setBills(res.data.data.bills))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-1/3" />
        {[1,2,3].map(i => <div key={i} className="card h-20" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Bills</h1>
        <p className="font-body text-sm text-text-muted">
          {bills.length} bill{bills.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {bills.length === 0 ? (
        <div className="card text-center py-16">
          <Receipt size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">No bills yet</p>
          <p className="font-body text-sm text-text-muted">Your bills will appear here after consultations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map(bill => (
            <div key={bill.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-body font-bold text-sm text-text-primary">
                    {bill.clinic?.name}
                  </p>
                  <p className="font-body text-xs text-text-muted mt-0.5">
                    {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>

                  {/* Items summary */}
                  <div className="mt-2 space-y-0.5">
                    {bill.items?.slice(0, 2).map((item, i) => (
                      <p key={i} className="font-body text-xs text-text-muted">
                        {item.name} × {item.quantity}
                        <span className="ml-2">₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </p>
                    ))}
                    {bill.items?.length > 2 && (
                      <p className="font-body text-xs text-text-muted">
                        +{bill.items.length - 2} more items
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className="font-display font-bold text-lg text-text-primary">
                    ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`inline-flex items-center gap-1 font-body text-xs font-bold px-2 py-0.5 rounded-pill mt-1
                    ${bill.status === 'paid'
                      ? 'bg-accent-teal/10 text-accent-teal'
                      : 'bg-accent-yellow/10 text-amber-600'
                    }`}>
                    {bill.status === 'paid'
                      ? <><CheckCircle size={11} /> Paid</>
                      : <><Clock size={11} /> Unpaid</>
                    }
                  </span>
                  {bill.paymentMethod && (
                    <p className="font-body text-xs text-text-muted mt-1 capitalize">
                      via {bill.paymentMethod}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
