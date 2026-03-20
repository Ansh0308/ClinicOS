import { useState, useEffect } from 'react'
import { patientPortalAPI } from '../../services/api'
import { Stethoscope, ChevronDown, ChevronUp, Pill, FlaskConical, Calendar } from 'lucide-react'

export default function VisitHistory() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    patientPortalAPI.getVisits()
      .then(res => setData(res.data.data))
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

  const { visits = [] } = data || {}

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">
          Visit History
        </h1>
        <p className="font-body text-sm text-text-muted">
          {visits.length} consultation{visits.length !== 1 ? 's' : ''} recorded
        </p>
      </div>

      {visits.length === 0 ? (
        <div className="card text-center py-16">
          <Stethoscope size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">
            No visits yet
          </p>
          <p className="font-body text-sm text-text-muted">
            Your consultation history will appear here after your first visit
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map(visit => (
            <div key={visit.id} className="card p-0 overflow-hidden">

              {/* Visit header */}
              <button
                className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-cream-50 transition-colors"
                onClick={() => setExpanded(expanded === visit.id ? null : visit.id)}
              >
                <div className="w-10 h-10 bg-crimson-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={16} className="text-crimson-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-bold text-sm text-text-primary">
                    {visit.complaint || 'Consultation'}
                  </p>
                  <p className="font-body text-xs text-text-muted mt-0.5">
                    Dr. {visit.doctor?.name}
                    {' · '}
                    {new Date(visit.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                  {/* Complaint tags */}
                  {visit.complaintTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {visit.complaintTags.slice(0, 3).map(tag => (
                        <span key={tag} className="font-body text-xs bg-crimson-100 text-crimson-600 px-2 py-0.5 rounded-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {expanded === visit.id
                  ? <ChevronUp size={16} className="text-text-muted flex-shrink-0 mt-1" />
                  : <ChevronDown size={16} className="text-text-muted flex-shrink-0 mt-1" />
                }
              </button>

              {/* Expanded visit details */}
              {expanded === visit.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-cream-100">

                  {/* Diagnosis */}
                  {visit.diagnosis && (
                    <div className="pt-3">
                      <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                        Diagnosis
                      </p>
                      <p className="font-body text-sm text-text-body bg-cream-50 rounded-xl px-3 py-2">
                        {visit.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {visit.prescriptions?.length > 0 && (
                    <div>
                      <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                        <Pill size={11} /> Prescriptions
                      </p>
                      <div className="space-y-1.5">
                        {visit.prescriptions.map((rx, i) => (
                          <div key={i} className="bg-cream-50 rounded-xl px-3 py-2">
                            <p className="font-body text-sm font-bold text-text-primary">
                              {rx.name}
                            </p>
                            <p className="font-body text-xs text-text-muted">
                              {[rx.dose, rx.frequency, rx.duration].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tests */}
                  {visit.testsOrdered?.length > 0 && (
                    <div>
                      <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                        <FlaskConical size={11} /> Tests Ordered
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {visit.testsOrdered.map(test => (
                          <span key={test} className="font-body text-xs bg-accent-sky/10 text-accent-sky px-2.5 py-1 rounded-pill">
                            {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up */}
                  {visit.followUpDate && (
                    <div className="flex items-center gap-2 bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl px-3 py-2">
                      <Calendar size={14} className="text-amber-600 flex-shrink-0" />
                      <p className="font-body text-sm text-text-body">
                        Follow-up:{' '}
                        <strong>
                          {new Date(visit.followUpDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </strong>
                      </p>
                    </div>
                  )}

                  {/* Vitals */}
                  {visit.vitals && Object.values(visit.vitals).some(Boolean) && (
                    <div>
                      <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                        Vitals
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(visit.vitals).filter(([,v]) => v).map(([k, v]) => (
                          <div key={k} className="bg-cream-50 rounded-xl px-3 py-2">
                            <p className="font-body text-xs text-text-muted capitalize">{k === 'bp' ? 'Blood Pressure' : k}</p>
                            <p className="font-body text-sm font-bold text-text-primary">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
