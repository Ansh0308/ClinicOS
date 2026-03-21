import { useState, useEffect } from 'react'
import { patientPortalAPI } from '../../services/api'
import { Bell, Mail, Smartphone, Phone, CheckCircle, XCircle } from 'lucide-react'

const CHANNEL_CONFIG = {
  email:    { label: 'Email',    icon: Mail,       color: 'text-accent-sky',      bg: 'bg-accent-sky/10'       },
  whatsapp: { label: 'WhatsApp', icon: Smartphone, color: 'text-accent-teal',     bg: 'bg-accent-teal/10'      },
  sms:      { label: 'SMS',      icon: Phone,      color: 'text-accent-lavender', bg: 'bg-accent-lavender/10'  },
}

const TEMPLATE_LABELS = {
  token_issued:          'Token Issued',
  two_before_you:        '2 Before You',
  your_turn:             'Your Turn',
  bill_receipt:          'Bill Receipt',
  appointment_confirmed: 'Appointment Confirmed',
  appointment_reminder:  'Appointment Reminder',
  follow_up_reminder:    'Follow-up Reminder',
}

export default function NotificationLog() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientPortalAPI.getNotifications()
      .then(res => setLogs(res.data.data.logs))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="card h-16" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Notifications</h1>
        <p className="font-body text-sm text-text-muted">Messages sent to you</p>
      </div>

      {logs.length === 0 ? (
        <div className="card text-center py-16">
          <Bell size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">No notifications yet</p>
          <p className="font-body text-sm text-text-muted">Messages will appear when you use the clinic</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const ch = CHANNEL_CONFIG[log.channel] || CHANNEL_CONFIG.email
            const CIcon = ch.icon
            return (
              <div key={log.id} className="card py-3 flex items-center gap-3">
                <div className={`w-9 h-9 ${ch.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <CIcon size={16} className={ch.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-text-primary">
                    {TEMPLATE_LABELS[log.template] || log.template}
                  </p>
                  <p className="font-body text-xs text-text-muted">
                    via {ch.label} · {new Date(log.sentAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    {' at '}
                    {new Date(log.sentAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                {log.status === 'failed'
                  ? <XCircle size={16} className="text-accent-coral flex-shrink-0" />
                  : <CheckCircle size={16} className="text-accent-teal flex-shrink-0" />
                }
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
