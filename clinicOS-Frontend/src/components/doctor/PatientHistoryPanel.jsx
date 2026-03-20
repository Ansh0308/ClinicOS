import { useState, useEffect } from 'react'
import { visitAPI } from '../../services/api'
import { X, ChevronDown, ChevronUp, Pill, FlaskConical, FileText } from 'lucide-react'

export default function PatientHistoryPanel({ patientId, onClose }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    visitAPI.getPatientVisits(patientId)
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [patientId])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel slides in from right */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-hero flex flex-col">

        {/* Header */}
        <div className="nav-gradient px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="font-body text-xs text-white/60 uppercase tracking-wider">Patient History</p>
            <p className="font-display font-bold text-white text-lg">
              {data?.patient?.name || 'Patient'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all">
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Patient stats */}
        {data?.patient && (
          <div className="px-5 py-3 bg-cream-50 border-b border-cream-200 flex gap-4 flex-shrink-0">
            <div>
              <p className="font-body text-xs text-text-muted">Phone</p>
              <p className="font-body text-sm font-semibold text-text-primary">{data.patient.phone}</p>
            </div>
            <div>
              <p className="font-body text-xs text-text-muted">Total Visits</p>
              <p className="font-body text-sm font-semibold text-text-primary">{data.patient.visitCount}</p>
            </div>
            {data.patient.gender && (
              <div>
                <p className="font-body text-xs text-text-muted">Gender</p>
                <p className="font-body text-sm font-semibold text-text-primary capitalize">{data.patient.gender}</p>
              </div>
            )}
          </div>
        )}

        {/* Visit list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="card animate-pulse h-24" />
            ))
          ) : data?.visits?.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={32} className="text-cream-400 mx-auto mb-2" />
              <p className="font-body text-sm text-text-muted">No previous visits</p>
            </div>
          ) : (
            data?.visits?.map(visit => (
              <div key={visit.id} className="card border border-cream-200 p-0 overflow-hidden">

                {/* Visit header — click to expand */}
                <button
                  className="w-full px-4 py-3 flex items-start justify-between text-left hover:bg-cream-50 transition-colors"
                  onClick={() => setExpanded(expanded === visit.id ? null : visit.id)}
                >
                  <div>
                    <p className="font-body text-xs text-text-muted">
                      {new Date(visit.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                      {visit.doctor && ` · ${visit.doctor.name}`}
                    </p>
                    <p className="font-body font-semibold text-sm text-text-primary mt-0.5">
                      {visit.complaint || 'No complaint recorded'}
                    </p>
                    {visit.diagnosis && (
                      <p className="font-body text-xs text-text-muted mt-0.5">
                        Dx: {visit.diagnosis}
                      </p>
                    )}
                  </div>
                  {expanded === visit.id
                    ? <ChevronUp size={16} className="text-text-muted flex-shrink-0 mt-0.5" />
                    : <ChevronDown size={16} className="text-text-muted flex-shrink-0 mt-0.5" />
                  }
                </button>

                {/* Expanded details */}
                {expanded === visit.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-cream-100">

                    {/* Complaint tags */}
                    {visit.complaintTags?.length > 0 && (
                      <div className="pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {visit.complaintTags.map(tag => (
                            <span key={tag} className="font-body text-xs bg-crimson-100 text-crimson-600 px-2 py-0.5 rounded-pill">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prescriptions */}
                    {visit.prescriptions?.length > 0 && (
                      <div>
                        <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1">
                          <Pill size={11} /> Prescriptions
                        </p>
                        <div className="space-y-1">
                          {visit.prescriptions.map((rx, i) => (
                            <p key={i} className="font-body text-xs text-text-body bg-cream-50 rounded-xl px-3 py-2">
                              <strong>{rx.name}</strong>
                              {rx.dose && ` · ${rx.dose}`}
                              {rx.frequency && ` · ${rx.frequency}`}
                              {rx.duration && ` · ${rx.duration}`}
                            </p>
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
                            <span key={test} className="font-body text-xs bg-accent-sky/10 text-accent-sky px-2 py-0.5 rounded-pill">
                              {test}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up */}
                    {visit.followUpDate && (
                      <p className="font-body text-xs text-text-muted">
                        Follow-up: <strong className="text-text-body">{new Date(visit.followUpDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
