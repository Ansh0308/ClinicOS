import { useState, useEffect } from 'react'
import { messageAPI } from '../../services/api'
import { MessageSquare, CheckCircle, XCircle, Mail, Phone, Smartphone } from 'lucide-react'

const CHANNEL_CONFIG = {
  email:    { label: 'Email',    icon: Mail,        color: 'text-accent-sky',     bg: 'bg-accent-sky/10'     },
  whatsapp: { label: 'WhatsApp', icon: Smartphone,  color: 'text-accent-teal',    bg: 'bg-accent-teal/10'    },
  sms:      { label: 'SMS',      icon: Phone,       color: 'text-accent-lavender',bg: 'bg-accent-lavender/10'},
}

const STATUS_CONFIG = {
  sent:      { label: 'Sent',      color: 'text-accent-teal',  bg: 'bg-accent-teal/10'  },
  delivered: { label: 'Delivered', color: 'text-accent-teal',  bg: 'bg-accent-teal/10'  },
  failed:    { label: 'Failed',    color: 'text-accent-coral', bg: 'bg-accent-coral/10' },
}

const TEMPLATE_LABELS = {
  token_issued:         'Token Issued',
  two_before_you:       '2 Before You',
  your_turn:            'Your Turn',
  bill_receipt:         'Bill Receipt',
  appointment_confirmed:'Appt Confirmed',
  appointment_reminder: 'Appt Reminder',
  appointment_cancelled:'Appt Cancelled',
  lab_result_ready:     'Lab Results',
  follow_up_reminder:   'Follow-up',
  referral_issued:      'Referral',
}

const FILTERS = ['All', 'Email', 'WhatsApp', 'SMS']

export default function MessageLogs() {
  const [logs, setLogs]         = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    const params = {}
    if (filter !== 'All')       params.channel = filter.toLowerCase()
    if (statusFilter !== 'All') params.status  = statusFilter.toLowerCase()

    Promise.all([
      messageAPI.getLogs(params),
      messageAPI.getStats(),
    ])
      .then(([logsRes, statsRes]) => {
        setLogs(logsRes.data.data.logs)
        setStats(statsRes.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter, statusFilter])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-text-primary">
          Message Logs
        </h1>
        <p className="font-body text-text-muted mt-1">
          All automated messages sent to patients
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Sent',    value: stats.total,   color: 'text-crimson-500',  bg: 'bg-crimson-100'    },
            { label: 'Successful',    value: stats.sent,    color: 'text-accent-teal',  bg: 'bg-accent-teal/10' },
            { label: 'Failed',        value: stats.failed,  color: 'text-accent-coral', bg: 'bg-accent-coral/10'},
            { label: 'Today',         value: stats.today,   color: 'text-accent-sky',   bg: 'bg-accent-sky/10'  },
          ].map(s => (
            <div key={s.label} className="card py-4 text-center">
              <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
              <p className="font-body text-xs text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-pill font-body text-xs font-semibold transition-all
                ${filter === f
                  ? 'bg-crimson-800 text-white'
                  : 'bg-white border border-cream-300 text-text-body hover:border-crimson-300'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['All', 'Sent', 'Failed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-pill font-body text-xs font-semibold transition-all
                ${statusFilter === s
                  ? 'bg-crimson-800 text-white'
                  : 'bg-white border border-cream-300 text-text-body hover:border-crimson-300'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Logs table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-16">
          <MessageSquare size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">
            No messages yet
          </p>
          <p className="font-body text-sm text-text-muted">
            Messages will appear here when tokens are issued and bills are paid
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-cream-100 border-b border-cream-200">
            {['Patient', 'Template', 'Channel', 'Status', 'Time'].map((h, i) => (
              <p key={h} className={`font-body text-xs font-bold text-text-muted uppercase tracking-wider
                ${i === 0 ? 'col-span-3' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-2' : 'col-span-2'}`}>
                {h}
              </p>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-cream-100">
            {logs.map(log => {
              const channel = CHANNEL_CONFIG[log.channel]  || CHANNEL_CONFIG.email
              const status  = STATUS_CONFIG[log.status]    || STATUS_CONFIG.sent
              const CIcon   = channel.icon

              return (
                <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-cream-50 transition-colors items-center">
                  {/* Patient */}
                  <div className="col-span-3 min-w-0">
                    <p className="font-body text-sm font-semibold text-text-primary truncate">
                      {log.patient?.name || 'Patient'}
                    </p>
                    <p className="font-body text-xs text-text-muted">{log.patient?.phone}</p>
                  </div>

                  {/* Template */}
                  <div className="col-span-3">
                    <span className="font-body text-xs font-semibold bg-cream-100 text-text-body px-2 py-0.5 rounded-pill">
                      {TEMPLATE_LABELS[log.template] || log.template}
                    </span>
                  </div>

                  {/* Channel */}
                  <div className="col-span-2">
                    <span className={`flex items-center gap-1 font-body text-xs font-semibold px-2 py-0.5 rounded-pill w-fit ${channel.bg} ${channel.color}`}>
                      <CIcon size={11} />
                      {channel.label}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`flex items-center gap-1 font-body text-xs font-semibold px-2 py-0.5 rounded-pill w-fit ${status.bg} ${status.color}`}>
                      {log.status === 'failed'
                        ? <XCircle size={11} />
                        : <CheckCircle size={11} />
                      }
                      {status.label}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="col-span-2">
                    <p className="font-body text-xs text-text-muted">
                      {new Date(log.sentAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <p className="font-body text-xs text-text-muted">
                      {new Date(log.sentAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
