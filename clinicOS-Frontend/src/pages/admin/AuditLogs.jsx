import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Filter, X } from 'lucide-react'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [userId, setUserId] = useState('')
  const [action, setAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(userId && { userId }),
        ...(action && { action }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }
      const response = await adminAPI.getAuditLogs(params)
      if (response.data.success) {
        setLogs(response.data.data.logs)
        setTotal(response.data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, rowsPerPage])

  const handleFilter = () => {
    setPage(0)
    fetchLogs()
  }

  const handleClear = () => {
    setUserId('')
    setAction('')
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

  const totalPages = Math.ceil(total / rowsPerPage)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-text-primary">Audit Logs</h1>
        <p className="font-body text-text-muted mt-1">Complete action history for your clinic</p>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block font-body text-sm font-semibold text-text-primary mb-1">User ID</label>
            <input
              type="text"
              className="w-full rounded-xl bg-cream-50 border border-cream-200 px-4 py-2 text-sm font-body text-text-primary focus:border-crimson-400 focus:bg-white focus:ring-4 focus:ring-crimson-400/10 outline-none transition-all"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. uuid"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block font-body text-sm font-semibold text-text-primary mb-1">Action</label>
            <input
              type="text"
              className="w-full rounded-xl bg-cream-50 border border-cream-200 px-4 py-2 text-sm font-body text-text-primary focus:border-crimson-400 focus:bg-white focus:ring-4 focus:ring-crimson-400/10 outline-none transition-all"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. USER_LOGIN"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block font-body text-sm font-semibold text-text-primary mb-1">Start Date</label>
            <input
              type="date"
              className="w-full rounded-xl bg-cream-50 border border-cream-200 px-4 py-2 text-sm font-body text-text-primary focus:border-crimson-400 focus:bg-white focus:ring-4 focus:ring-crimson-400/10 outline-none transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block font-body text-sm font-semibold text-text-primary mb-1">End Date</label>
            <input
              type="date"
              className="w-full rounded-xl bg-cream-50 border border-cream-200 px-4 py-2 text-sm font-body text-text-primary focus:border-crimson-400 focus:bg-white focus:ring-4 focus:ring-crimson-400/10 outline-none transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2 min-w-[150px]">
            <button onClick={handleFilter} className="btn-primary py-2 px-4 flex items-center gap-2">
              <Filter size={16} /> Filter
            </button>
            <button onClick={handleClear} className="btn-outline py-2 px-4 flex items-center gap-2">
              <X size={16} /> Clear
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100 border-b border-cream-200">
                <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">User</th>
                <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">Resource ID</th>
                <th className="px-6 py-3 font-body text-xs font-bold text-text-muted uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-text-muted font-body">Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-text-muted font-body">No logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-cream-50 transition-colors">
                    <td className="px-6 py-3 font-body text-sm text-text-primary whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-body text-sm text-text-primary whitespace-nowrap">
                      {log.user ? `${log.user.name} (${log.user.role})` : 'System / Unknown'}
                    </td>
                    <td className="px-6 py-3 font-body text-sm font-semibold text-text-primary whitespace-nowrap">
                      <span className="px-2 py-1 rounded-md bg-cream-100 text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-body text-sm text-text-primary whitespace-nowrap">{log.resourceType}</td>
                    <td className="px-6 py-3 font-body text-sm text-text-primary whitespace-nowrap text-xs">{log.resourceId}</td>
                    <td className="px-6 py-3 font-body text-sm text-text-primary whitespace-nowrap">{log.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-white border-t border-cream-200 flex items-center justify-between">
          <span className="font-body text-sm text-text-muted">
            Showing page {page + 1} of {totalPages || 1} ({total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 rounded border border-cream-200 text-sm font-body disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded border border-cream-200 text-sm font-body disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditLogs
