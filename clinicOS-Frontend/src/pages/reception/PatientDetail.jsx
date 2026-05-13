import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { patientAPI } from '../../services/api'
import { ArrowLeft, User, Phone, Calendar, Stethoscope, CreditCard, Clock, Activity, ListOrdered } from 'lucide-react'

const PatientDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patientData, setPatientData] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatientDetail = async () => {
      try {
        const response = await patientAPI.getStaffDetail(id)
        if (response.data.success) {
          setPatientData(response.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch patient details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPatientDetail()
  }, [id])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-6xl mx-auto">
        <div className="h-8 bg-cream-200 rounded w-1/3" />
        <div className="card h-64" />
      </div>
    )
  }

  if (!patientData) {
    return <div className="p-4 text-center text-text-muted font-body">Patient not found.</div>
  }

  const { patient, visits, bills, activeToken } = patientData

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-muted hover:text-crimson-700 font-body transition-colors"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary mb-3">
            {patient.name || 'Unnamed Patient'}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm font-body text-text-muted">
            <div className="flex items-center gap-1.5 bg-cream-50 px-3 py-1.5 rounded-full border border-cream-200">
              <Phone size={14} className="text-crimson-600" />
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-cream-50 px-3 py-1.5 rounded-full border border-cream-200">
              <Calendar size={14} className="text-crimson-600" />
              <span>{patient.dob ? new Date(patient.dob).toLocaleDateString() : 'DOB not provided'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-cream-50 px-3 py-1.5 rounded-full border border-cream-200 capitalize">
              <User size={14} className="text-crimson-600" />
              <span>{patient.gender || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {activeToken ? (
          <div className="bg-crimson-800 text-white p-5 rounded-2xl flex flex-col items-center md:items-end min-w-[200px] shadow-btn">
            <span className="font-body text-xs text-white/80 font-semibold uppercase tracking-wider mb-1">Active Token</span>
            <span className="font-display font-bold text-4xl mb-1">#{activeToken.tokenNumber}</span>
            <div className="flex items-center gap-2 mt-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              <div className="w-2 h-2 rounded-full bg-accent-teal animate-pulse" />
              <span className="font-body text-xs font-semibold capitalize tracking-wide">{activeToken.status}</span>
            </div>
          </div>
        ) : (
          <div className="bg-cream-50 border border-cream-200 px-4 py-2 rounded-xl text-sm font-body text-text-muted">
            No Active Token
          </div>
        )}
      </div>

      <div className="flex space-x-4 border-b border-cream-200 mb-6">
        <button
          className={`pb-2 px-2 font-body font-semibold ${tabValue === 0 ? 'text-crimson-700 border-b-2 border-crimson-700' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setTabValue(0)}
        >
          Overview
        </button>
        <button
          className={`pb-2 px-2 font-body font-semibold ${tabValue === 1 ? 'text-crimson-700 border-b-2 border-crimson-700' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setTabValue(1)}
        >
          Visits
        </button>
        <button
          className={`pb-2 px-2 font-body font-semibold ${tabValue === 2 ? 'text-crimson-700 border-b-2 border-crimson-700' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setTabValue(2)}
        >
          Bills
        </button>
      </div>

      {tabValue === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card h-full">
            <h2 className="font-display font-bold text-xl text-text-primary mb-4 flex items-center gap-2">
              <Stethoscope size={20} className="text-crimson-600" /> Recent Visits
            </h2>
            {visits.length === 0 ? (
              <p className="font-body text-text-muted">No recent visits.</p>
            ) : (
              <div className="space-y-4">
                {visits.slice(0, 3).map((visit) => (
                  <div key={visit.id} className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-body font-bold text-sm text-text-primary">
                        {new Date(visit.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-body text-text-muted bg-white px-2 py-1 rounded border border-cream-200">
                        Dr. {visit.doctor?.name || 'Unknown'}
                      </span>
                    </div>
                    <p className="font-body text-sm text-text-muted truncate">
                      <span className="font-semibold text-text-primary">Diagnosis:</span> {visit.diagnosis || 'None recorded'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="card h-full">
            <h2 className="font-display font-bold text-xl text-text-primary mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-crimson-600" /> Outstanding Bills
            </h2>
            {bills.filter(b => b.status !== 'paid').length === 0 ? (
              <p className="font-body text-text-muted">No outstanding bills.</p>
            ) : (
              <div className="space-y-4">
                {bills.filter(b => b.status !== 'paid').slice(0, 3).map(bill => (
                  <div key={bill.id} className="p-3 bg-cream-50 rounded-xl border border-cream-200 flex justify-between items-center">
                    <div>
                      <span className="block font-body font-bold text-sm text-text-primary mb-1">
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/30 rounded text-xs font-bold uppercase tracking-wider">
                        {bill.status}
                      </span>
                    </div>
                    <span className="font-display font-bold text-xl text-crimson-600">
                      ₹{(Number(bill.total) - Number(bill.paidAmount || 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tabValue === 1 && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-100 border-b border-cream-200">
                  <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Complaint</th>
                  <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Diagnosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-text-muted font-body">No visits found</td>
                  </tr>
                ) : (
                  visits.map(visit => (
                    <tr key={visit.id} className="hover:bg-cream-50 transition-colors">
                      <td className="px-6 py-4 font-body text-sm text-text-primary whitespace-nowrap">
                        {new Date(visit.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-text-primary whitespace-nowrap">
                        {visit.doctor?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-text-primary">{visit.complaint || '-'}</td>
                      <td className="px-6 py-4 font-body text-sm text-text-primary">{visit.diagnosis || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tabValue === 2 && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-100 border-b border-cream-200">
                  <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Paid Amount</th>
                  <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-text-muted font-body">No bills found</td>
                  </tr>
                ) : (
                  bills.map(bill => (
                    <tr key={bill.id} className="hover:bg-cream-50 transition-colors">
                      <td className="px-6 py-4 font-body text-sm text-text-primary whitespace-nowrap">
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-body text-sm font-semibold text-text-primary whitespace-nowrap">
                        ₹{Number(bill.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-text-primary whitespace-nowrap">
                        ₹{Number(bill.paidAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-body text-sm whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          bill.status === 'paid' ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30' :
                          bill.status === 'partial' ? 'bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/30' :
                          'bg-crimson-100 text-crimson-600 border border-crimson-200'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-body text-sm text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/billing/${bill.patientId}`)}
                          className="btn-outline py-1 px-3 text-xs"
                        >
                          View Bill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientDetail
