import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { Stethoscope, Users, ShieldOff, ShieldCheck } from 'lucide-react'

const FILTERS = ['All', 'Doctors', 'Staff']

export default function TeamManagement() {
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')
  const [acting, setActing]     = useState(null)

  useEffect(() => {
    adminAPI.getTeam()
      .then(res => setMembers(res.data.data.members))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (id, action) => {
    setActing(id)
    try {
      await adminAPI.updateMember(id, action)
      setMembers(prev => prev.map(m =>
        m.id === id ? { ...m, status: action === 'suspend' ? 'suspended' : 'approved' } : m
      ))
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed')
    } finally {
      setActing(null)
    }
  }

  const filtered = members.filter(m => {
    if (filter === 'Doctors') return m.role === 'doctor'
    if (filter === 'Staff')   return m.role === 'staff'
    return true
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-text-primary">Team</h1>
        <p className="font-body text-text-muted mt-1">Manage your clinic's doctors and staff</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-pill font-body text-sm font-semibold transition-all
              ${filter === f
                ? 'bg-crimson-800 text-white shadow-btn'
                : 'bg-white text-text-body border border-cream-300 hover:border-crimson-300'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">No members yet</p>
          <p className="font-body text-text-muted text-sm">
            Approved doctors and staff will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(member => (
            <div key={member.id} className="card flex flex-col md:flex-row md:items-center gap-4">

              <div className="flex items-center gap-3 flex-1">
                <div className="w-11 h-11 bg-crimson-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-white">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body font-bold text-text-primary">{member.name}</p>
                    <span className={`font-body text-xs font-bold px-2 py-0.5 rounded-pill
                      ${member.role === 'doctor' ? 'bg-crimson-100 text-crimson-600' : 'bg-accent-sky/10 text-accent-sky'}`}>
                      {member.role === 'doctor' ? 'Doctor' : 'Staff'}
                    </span>
                    <span className={`font-body text-xs font-bold px-2 py-0.5 rounded-pill
                      ${member.status === 'approved' ? 'bg-accent-teal/10 text-accent-teal' : 'bg-accent-coral/10 text-accent-coral'}`}>
                      {member.status === 'approved' ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <p className="font-body text-sm text-text-muted">{member.email}</p>
                  <p className="font-body text-xs text-text-muted">
                    Joined {new Date(member.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAction(member.id, member.status === 'approved' ? 'suspend' : 'reactivate')}
                disabled={acting === member.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-body text-sm font-semibold transition-all flex-shrink-0 disabled:opacity-50
                  ${member.status === 'approved'
                    ? 'border border-accent-coral/30 text-accent-coral hover:bg-accent-coral/5'
                    : 'border border-accent-teal/30 text-accent-teal hover:bg-accent-teal/5'
                  }`}
              >
                {acting === member.id ? (
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : member.status === 'approved' ? (
                  <><ShieldOff size={15} /> Suspend</>
                ) : (
                  <><ShieldCheck size={15} /> Reactivate</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}