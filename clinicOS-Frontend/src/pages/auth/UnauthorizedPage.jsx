import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen hero-glow flex items-center justify-center p-4">
      <div className="card max-w-sm w-full text-center p-10">
        <div className="w-16 h-16 bg-accent-coral/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ShieldX size={32} className="text-accent-coral" />
        </div>
        <h1 className="font-display font-bold text-2xl text-text-primary mb-2">Access Denied</h1>
        <p className="font-body text-text-muted mb-6">You don't have permission to view this page.</p>
        <Link to="/" className="btn-primary justify-center">Go Home</Link>
      </div>
    </div>
  )
}