import { useCallback, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertCircle,
  Clock,
  Download,
  IndianRupee,
  MessageSquare,
  Minus,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { analyticsAPI, clinicAPI } from '../../services/api'

const COLORS = {
  crimson: '#C43055',
  teal: '#5AB09A',
  sky: '#70B8D8',
  yellow: '#F0C030',
  lavender: '#9080C0',
  peach: '#F0A078',
  cream: '#E0D4B5',
  muted: '#8A6070',
}

const RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: '7 Days' },
  { id: '30days', label: '30 Days' },
  { id: 'custom', label: 'Custom' },
]

const RAG = {
  green: {
    label: 'Healthy',
    color: 'text-accent-teal',
    bg: 'bg-accent-teal/10',
    dot: 'bg-accent-teal',
    note: 'Wait within target',
  },
  amber: {
    label: 'Warning',
    color: 'text-amber-600',
    bg: 'bg-accent-yellow/10',
    dot: 'bg-accent-yellow',
    note: 'Wait above 25 min',
  },
  red: {
    label: 'Critical',
    color: 'text-accent-coral',
    bg: 'bg-accent-coral/10',
    dot: 'bg-accent-coral',
    note: 'Wait above 45 min',
  },
}

const COMPLAINT_BAR_COLORS = [
  COLORS.crimson,
  COLORS.teal,
  COLORS.sky,
  COLORS.lavender,
  COLORS.peach,
  COLORS.yellow,
]

const formatCurrency = (value, options = {}) => {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    ...options,
  }).format(amount)
}

const formatDateLabel = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
})

const exportCsv = (rows, filename) => {
  if (!rows?.length) return

  const headers = Object.keys(rows[0])
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\n')

  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function Trend({ value }) {
  if (value > 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-accent-teal">
        <TrendingUp size={12} />+{value}%
      </span>
    )
  }

  if (value < 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-accent-coral">
        <TrendingDown size={12} />
        {value}%
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-xs text-text-muted">
      <Minus size={12} />
      0%
    </span>
  )
}

function KPICard({ icon: Icon, label, value, subtext, color, bg, trend, loading }) {
  return (
    <div className="card">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${bg}`}>
        <Icon size={18} className={color} />
      </div>

      {loading ? (
        <div className="mb-2 h-8 w-20 animate-pulse rounded-xl bg-cream-200" />
      ) : (
        <div className="flex items-end gap-2">
          <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
          {typeof trend === 'number' && <Trend value={trend} />}
        </div>
      )}

      <p className="mt-0.5 font-body text-xs text-text-muted">{label}</p>
      {subtext && <p className="mt-1 font-body text-xs text-text-muted">{subtext}</p>}
    </div>
  )
}

function SectionHeader({ title, exportData, exportFilename }) {
  const canExport = Boolean(exportFilename)

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="font-display text-lg font-bold text-text-primary">{title}</h3>
      {canExport && (
        <button
          type="button"
          onClick={() => exportCsv(exportData, exportFilename)}
          disabled={!exportData?.length}
          className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-muted transition-colors hover:text-text-body disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={13} />
          Export CSV
        </button>
      )}
    </div>
  )
}

function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-cream-300 bg-white px-3 py-2 shadow-card">
      <p className="mb-1 font-body text-xs text-text-muted">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="font-body text-sm font-bold" style={{ color: entry.color }}>
          {prefix}
          {typeof entry.value === 'number'
            ? entry.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
            : entry.value}
          {suffix}
        </p>
      ))}
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-2xl bg-cream-50">
      <div className="text-center">
        <AlertCircle size={18} className="mx-auto mb-2 text-text-muted" />
        <p className="font-body text-sm text-text-muted">{message}</p>
      </div>
    </div>
  )
}

function RevenueSnapshot({ label, value }) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3">
      <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-crimson-700">{formatCurrency(value)}</p>
    </div>
  )
}

export default function Analytics() {
  const [range, setRange] = useState('7days')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [doctors, setDoctors] = useState([])

  const [overview, setOverview] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [queueStats, setQueueStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [doctorStats, setDoctorStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    clinicAPI.getDoctors()
      .then((res) => setDoctors(res.data.data.doctors || []))
      .catch((err) => {
        console.error('Doctor filter load error:', err)
      })
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const params = {
      range,
      doctorId: doctorId || undefined,
    }

    if (range === 'custom') {
      params.customStart = customStart
      params.customEnd = customEnd
    }

    try {
      const [overviewRes, revenueRes, queueRes, complaintsRes, doctorsRes] = await Promise.all([
        analyticsAPI.getOverview(params),
        analyticsAPI.getRevenue(params),
        analyticsAPI.getQueue(params),
        analyticsAPI.getComplaints(params),
        analyticsAPI.getDoctors(params),
      ])

      setOverview(overviewRes.data.data)
      setRevenue(revenueRes.data.data.data || [])
      setQueueStats(queueRes.data.data)
      setComplaints(complaintsRes.data.data.topComplaints || [])
      setDoctorStats(doctorsRes.data.data.doctors || [])
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setErrorMessage(err.response?.data?.error || 'Failed to load analytics.')
    } finally {
      setLoading(false)
    }
  }, [customEnd, customStart, doctorId, range])

  useEffect(() => {
    if (range !== 'custom' || (customStart && customEnd)) {
      fetchAll()
    }
  }, [customEnd, customStart, fetchAll, range])

  const kpis = overview?.kpis || {}
  const trends = overview?.trends || {}
  const revenueSummary = overview?.revenueSummary || {}
  const queueHealth = RAG[kpis.queueHealth || 'green']

  const revenueChartData = revenue.map((entry) => ({
    date: formatDateLabel(entry.date),
    revenue: Number(entry.revenue || 0),
    bills: Number(entry.count || 0),
  }))

  const avgWaitData = (queueStats?.avgWaitByDay || []).map((entry) => ({
    date: formatDateLabel(entry.date),
    avgWait: entry.avgWait,
    count: entry.count,
  }))

  const throughputData = (queueStats?.throughputByHour || [])
    .filter((entry) => entry.hour >= 7 && entry.hour <= 20)
    .map((entry) => ({
      hour: `${String(entry.hour).padStart(2, '0')}:00`,
      tokens: entry.count,
    }))

  const chartExports = {
    revenue: revenueChartData.map((entry) => ({
      date: entry.date,
      revenue: entry.revenue,
      bills: entry.bills,
    })),
    avgWait: avgWaitData.map((entry) => ({
      date: entry.date,
      avg_wait_minutes: entry.avgWait,
      patients: entry.count,
    })),
    throughput: throughputData.map((entry) => ({
      hour: entry.hour,
      tokens: entry.tokens,
    })),
    complaints: complaints.map((entry) => ({
      complaint: entry.name,
      count: entry.count,
    })),
    doctors: doctorStats.map((entry) => ({
      doctor: entry.name,
      patients_served: entry.patientsServed,
      avg_wait_minutes: entry.avgWaitMins,
      revenue: entry.revenue,
    })),
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Analytics</h1>
          <p className="mt-1 font-body text-text-muted">
            Clinic performance, queue health, and revenue trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-2xl bg-cream-100 p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRange(option.id)}
                className={`rounded-xl px-3 py-1.5 font-body text-xs font-semibold transition-all ${
                  range === option.id
                    ? 'bg-white text-crimson-700 shadow-card'
                    : 'text-text-muted hover:text-text-body'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {range === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-cream-300 px-3 py-1.5 font-body text-xs focus:border-crimson-400 focus:outline-none"
              />
              <span className="font-body text-xs text-text-muted">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-cream-300 px-3 py-1.5 font-body text-xs focus:border-crimson-400 focus:outline-none"
              />
            </>
          )}

          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="rounded-xl border border-cream-300 bg-white px-3 py-1.5 font-body text-xs focus:border-crimson-400 focus:outline-none"
          >
            <option value="">All Doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {range === 'custom' && (!customStart || !customEnd) && (
        <div className="mb-5 rounded-2xl border border-accent-yellow/40 bg-accent-yellow/10 px-4 py-3 font-body text-sm text-amber-700">
          Select both custom dates to refresh the dashboard.
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-accent-coral/30 bg-accent-coral/5 px-4 py-3 font-body text-sm text-accent-coral">
          {errorMessage}
        </div>
      )}

      <div className="card mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted">Revenue Snapshot</p>
            <h2 className="font-display text-xl font-bold text-text-primary">Today / 7 days / 30 days</h2>
          </div>
          <div className="rounded-xl bg-crimson-50 px-3 py-1.5 font-body text-xs font-semibold text-crimson-700">
            Admin only
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <RevenueSnapshot label="Today" value={revenueSummary.today} />
          <RevenueSnapshot label="Last 7 Days" value={revenueSummary.week} />
          <RevenueSnapshot label="Last 30 Days" value={revenueSummary.month} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KPICard
          icon={Users}
          label="Patients Served"
          value={kpis.patientsToday ?? '—'}
          subtext={`${kpis.totalTokens || 0} tokens issued`}
          trend={trends.patients}
          color="text-crimson-500"
          bg="bg-crimson-100"
          loading={loading}
        />
        <KPICard
          icon={IndianRupee}
          label="Revenue"
          value={loading ? '—' : formatCurrency(kpis.revenue)}
          subtext={`${kpis.paidBills || 0} paid bills`}
          trend={trends.revenue}
          color="text-accent-teal"
          bg="bg-accent-teal/10"
          loading={loading}
        />
        <KPICard
          icon={Clock}
          label="Average Wait"
          value={kpis.avgWaitMins !== undefined ? `${kpis.avgWaitMins}m` : '—'}
          subtext="Measured from issue to call"
          color="text-accent-sky"
          bg="bg-accent-sky/10"
          loading={loading}
        />
        <KPICard
          icon={Activity}
          label="Token Throughput"
          value={kpis.tokenThroughput ?? '—'}
          subtext={`${kpis.tokenThroughputRate || 0}% of issued tokens`}
          color="text-accent-peach"
          bg="bg-accent-peach/10"
          loading={loading}
        />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KPICard
          icon={AlertCircle}
          label="No-show Rate"
          value={kpis.noShowRate !== undefined ? `${kpis.noShowRate}%` : '—'}
          subtext={`${kpis.cancelledTokens || 0} cancelled tokens`}
          color="text-accent-coral"
          bg="bg-accent-coral/10"
          loading={loading}
        />
        <KPICard
          icon={Stethoscope}
          label="Doctor Utilisation"
          value={kpis.doctorUtilisation !== undefined ? `${kpis.doctorUtilisation}%` : '—'}
          subtext={`${kpis.activeDoctors || 0}/${kpis.totalDoctors || 0} doctors active`}
          color="text-accent-lavender"
          bg="bg-accent-lavender/10"
          loading={loading}
        />
        <KPICard
          icon={MessageSquare}
          label="Message Delivery"
          value={kpis.messageDeliveryRate !== undefined ? `${kpis.messageDeliveryRate}%` : '—'}
          subtext={`${kpis.messagesSent || 0} successful • ${kpis.messagesFailed || 0} failed`}
          color="text-accent-teal"
          bg="bg-accent-teal/10"
          loading={loading}
        />

        <div className="card">
          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${queueHealth.bg}`}>
            <span className={`h-4 w-4 rounded-full ${queueHealth.dot} ${kpis.queueHealth === 'green' ? 'animate-pulse' : ''}`} />
          </div>
          {loading ? (
            <div className="mb-2 h-8 w-20 animate-pulse rounded-xl bg-cream-200" />
          ) : (
            <p className={`font-display text-2xl font-bold ${queueHealth.color}`}>{queueHealth.label}</p>
          )}
          <p className="mt-0.5 font-body text-xs text-text-muted">Queue Health</p>
          <p className="mt-1 font-body text-xs text-text-muted">
            {kpis.avgWaitMins !== undefined ? `${queueHealth.note} • ${kpis.avgWaitMins} min avg wait` : queueHealth.note}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <div className="card">
          <SectionHeader
            title="Revenue by Day"
            exportData={chartExports.revenue}
            exportFilename="analytics-revenue.csv"
          />
          {loading ? (
            <div className="h-56 animate-pulse rounded-2xl bg-cream-100" />
          ) : revenueChartData.length === 0 ? (
            <EmptyChart message="No revenue data for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid stroke={COLORS.cream} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.muted }} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: COLORS.muted }}
                  tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                />
                <Tooltip content={<ChartTooltip prefix="₹" />} />
                <Bar dataKey="revenue" fill={COLORS.crimson} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <SectionHeader
            title="Average Wait Trend"
            exportData={chartExports.avgWait}
            exportFilename="analytics-average-wait.csv"
          />
          {loading ? (
            <div className="h-56 animate-pulse rounded-2xl bg-cream-100" />
          ) : avgWaitData.length === 0 ? (
            <EmptyChart message="No wait-time data for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={avgWaitData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid stroke={COLORS.cream} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.muted }} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: COLORS.muted }}
                  tickFormatter={(value) => `${value}m`}
                />
                <Tooltip content={<ChartTooltip suffix=" min" />} />
                <Line
                  type="monotone"
                  dataKey="avgWait"
                  stroke={COLORS.teal}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS.teal, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <SectionHeader
            title="Patient Throughput by Hour"
            exportData={chartExports.throughput}
            exportFilename="analytics-throughput.csv"
          />
          {loading ? (
            <div className="h-56 animate-pulse rounded-2xl bg-cream-100" />
          ) : throughputData.length === 0 ? (
            <EmptyChart message="No throughput data for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={throughputData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.sky} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.sky} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.cream} strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  interval={2}
                  tick={{ fontSize: 10, fill: COLORS.muted }}
                  tickLine={false}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.muted }} />
                <Tooltip content={<ChartTooltip suffix=" tokens" />} />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke={COLORS.sky}
                  strokeWidth={2}
                  fill="url(#throughputGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <SectionHeader
            title="Top Complaints"
            exportData={chartExports.complaints}
            exportFilename="analytics-top-complaints.csv"
          />
          {loading ? (
            <div className="h-56 animate-pulse rounded-2xl bg-cream-100" />
          ) : complaints.length === 0 ? (
            <EmptyChart message="No complaint data for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={[...complaints].reverse()}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 60, bottom: 0 }}
              >
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.muted }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={58}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: COLORS.muted }}
                />
                <Tooltip content={<ChartTooltip suffix=" cases" />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {[...complaints].reverse().map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COMPLAINT_BAR_COLORS[index % COMPLAINT_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <SectionHeader
          title="Doctor Utilisation"
          exportData={chartExports.doctors}
          exportFilename="analytics-doctor-utilisation.csv"
        />
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded-2xl bg-cream-100" />
            ))}
          </div>
        ) : doctorStats.length === 0 ? (
          <EmptyChart message="No doctor activity data for this period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream-200">
                  {['Doctor', 'Patients Served', 'Avg Wait', 'Revenue'].map((heading) => (
                    <th
                      key={heading}
                      className="pb-2 pr-4 text-left font-body text-xs font-bold uppercase tracking-wider text-text-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {doctorStats.map((doctor) => (
                  <tr key={doctor.id} className="transition-colors hover:bg-cream-50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-crimson-100">
                          <span className="font-display text-xs font-bold text-crimson-600">
                            {doctor.name?.charAt(0) || 'D'}
                          </span>
                        </div>
                        <span className="font-body text-sm font-semibold text-text-primary">{doctor.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-body text-sm text-text-body">{doctor.patientsServed}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`font-body text-sm font-semibold ${
                          doctor.avgWaitMins > 45
                            ? 'text-accent-coral'
                            : doctor.avgWaitMins > 25
                              ? 'text-amber-600'
                              : 'text-accent-teal'
                        }`}
                      >
                        {doctor.avgWaitMins}m
                      </span>
                    </td>
                    <td className="py-3 font-body text-sm text-text-body">{formatCurrency(doctor.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
