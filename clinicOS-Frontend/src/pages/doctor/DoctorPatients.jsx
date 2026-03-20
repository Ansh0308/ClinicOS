import { Users } from 'lucide-react'

export default function DoctorPatients() {
  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-text-primary mb-2">Patients</h1>
      <p className="font-body text-text-muted mb-8">
        Coming soon — searchable patient directory with full history.
      </p>
      <div className="card text-center py-16">
        <Users size={40} className="text-cream-400 mx-auto mb-3" />
        <p className="font-display font-bold text-xl text-text-primary">Patient Directory</p>
        <p className="font-body text-sm text-text-muted mt-1">Phase 5.5 — being built</p>
      </div>
    </div>
  )
}
