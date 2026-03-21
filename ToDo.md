Good. I have everything I need from the PRD. Let me map exactly what F7 requires vs what we need to build.

---

## What F7 Requires (from PRD §5)

```
KPI Cards:
  - Patients today
  - Revenue today / week / month
  - Average wait time
  - Token throughput
  - No-show rate
  - Doctor utilisation
  - Queue health RAG indicator (Red/Amber/Green)
  - Message delivery stats

Charts (exact types from PRD):
  - Revenue → bar chart by day
  - Avg wait time → line trend
  - Top complaints → horizontal bar (top 10)
  - Throughput → area chart by hour of day

Filters:
  - Date range: Today / 7 days / 30 days / Custom
  - Doctor filter

Export:
  - CSV export of current view

Staff sees simplified version:
  - Patients today, revenue today, queue health only

Role-based visibility:
  - Revenue metrics → Admin only
  - Patient counts + queue stats → Staff too
```

---

## Install Recharts

```bash
cd client
npm install recharts
```

---

## Backend

### 1. `server/src/controllers/analytics.controller.js`

```js
const { success, error } = require('../utils/apiResponse')
const { Token, Visit, Bill, Patient, User, MessageLog } = require('../models')
const { Op, fn, col, literal } = require('sequelize')
const sequelize = require('../config/database')

// ── Helper: get date range ────────────────────────────────────────
const getDateRange = (range, customStart, customEnd) => {
  const now   = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  switch (range) {
    case 'today':
      return { start: today, end: now }
    case '7days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { start, end: now }
    }
    case '30days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      return { start, end: now }
    }
    case 'custom':
      return {
        start: customStart ? new Date(customStart) : today,
        end:   customEnd   ? new Date(customEnd)   : now,
      }
    default:
      return { start: today, end: now }
  }
}

// ── GET /api/analytics/overview ──────────────────────────────────
const getOverview = async (req, res) => {
  const { range = 'today', doctorId, customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)

  // Previous period for trend calculation
  const periodMs    = end - start
  const prevStart   = new Date(start - periodMs)
  const prevEnd     = new Date(start)

  try {
    const tokenWhere = { clinicId, createdAt: { [Op.between]: [start, end] } }
    const billWhere  = { clinicId, createdAt: { [Op.between]: [start, end] } }
    if (doctorId) tokenWhere.doctorId = doctorId

    const [
      totalTokens,
      servedTokens,
      cancelledTokens,
      totalRevenue,
      paidBills,
      newPatients,
      messageStats,
      prevServed,
      prevRevenue,
    ] = await Promise.all([
      // Total tokens issued
      Token.count({ where: tokenWhere }),

      // Served tokens
      Token.count({ where: { ...tokenWhere, status: 'served' } }),

      // Cancelled / no-show tokens
      Token.count({ where: { ...tokenWhere, status: 'cancelled' } }),

      // Revenue (sum of paid bills)
      Bill.sum('total', { where: { ...billWhere, status: 'paid' } }),

      // Number of paid bills
      Bill.count({ where: { ...billWhere, status: 'paid' } }),

      // New patients registered
      Patient.count({ where: { clinicId, createdAt: { [Op.between]: [start, end] } } }),

      // Message delivery stats
      MessageLog.findAll({
        where:      { clinicId, sentAt: { [Op.between]: [start, end] } },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group:      ['status'],
        raw:        true,
      }),

      // Previous period served (for trend)
      Token.count({ where: { clinicId, status: 'served', createdAt: { [Op.between]: [prevStart, prevEnd] } } }),

      // Previous period revenue (for trend)
      Bill.sum('total', { where: { clinicId, status: 'paid', createdAt: { [Op.between]: [prevStart, prevEnd] } } }),
    ])

    // Average wait time calculation
    const servedWithTimes = await Token.findAll({
      where: {
        ...tokenWhere,
        status:   'served',
        calledAt: { [Op.ne]: null },
        issuedAt: { [Op.ne]: null },
      },
      attributes: ['issuedAt', 'calledAt'],
      raw: true,
    })

    let avgWaitMins = 0
    if (servedWithTimes.length > 0) {
      const totalWait = servedWithTimes.reduce((sum, t) => {
        const wait = (new Date(t.calledAt) - new Date(t.issuedAt)) / 1000 / 60
        return sum + wait
      }, 0)
      avgWaitMins = Math.round(totalWait / servedWithTimes.length)
    }

    // No-show rate
    const noShowRate = totalTokens > 0
      ? Math.round((cancelledTokens / totalTokens) * 100)
      : 0

    // Queue health RAG
    let queueHealth = 'green'
    if (avgWaitMins > 45)      queueHealth = 'red'
    else if (avgWaitMins > 25) queueHealth = 'amber'

    // Message stats
    const msgSent   = messageStats.find(m => m.status === 'sent')?.count   || 0
    const msgFailed = messageStats.find(m => m.status === 'failed')?.count || 0

    // Trends (percentage change vs previous period)
    const revenueTrend = prevRevenue > 0
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
      : 0
    const patientTrend = prevServed > 0
      ? Math.round(((servedTokens - prevServed) / prevServed) * 100)
      : 0

    return success(res, {
      kpis: {
        patientsToday:   servedTokens,
        totalTokens,
        revenue:         totalRevenue || 0,
        paidBills,
        newPatients,
        avgWaitMins,
        noShowRate,
        cancelledTokens,
        queueHealth,
        messagesSent:    parseInt(msgSent),
        messagesFailed:  parseInt(msgFailed),
      },
      trends: { revenue: revenueTrend, patients: patientTrend },
      range,
    })
  } catch (err) {
    console.error('getOverview error:', err.message)
    return error(res, 'Failed to fetch overview', 500)
  }
}

// ── GET /api/analytics/revenue ────────────────────────────────────
const getRevenue = async (req, res) => {
  const { range = '7days', doctorId, customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)

  try {
    const bills = await Bill.findAll({
      where: {
        clinicId,
        status:    'paid',
        paidAt:    { [Op.between]: [start, end] },
      },
      attributes: [
        [fn('DATE', col('paidAt')), 'date'],
        [fn('SUM', col('total')),   'revenue'],
        [fn('COUNT', col('id')),    'count'],
      ],
      group:  [fn('DATE', col('paidAt'))],
      order:  [[fn('DATE', col('paidAt')), 'ASC']],
      raw:    true,
    })

    return success(res, { data: bills })
  } catch (err) {
    console.error('getRevenue error:', err.message)
    return error(res, 'Failed to fetch revenue', 500)
  }
}

// ── GET /api/analytics/queue ──────────────────────────────────────
const getQueueStats = async (req, res) => {
  const { range = '7days', doctorId, customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)

  try {
    const where = {
      clinicId,
      status:    'served',
      calledAt:  { [Op.ne]: null },
      issuedAt:  { [Op.ne]: null },
      createdAt: { [Op.between]: [start, end] },
    }
    if (doctorId) where.doctorId = doctorId

    // Avg wait by day
    const tokensByDay = await Token.findAll({
      where,
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')),       'count'],
        'issuedAt',
        'calledAt',
      ],
      raw: true,
    })

    // Group and calculate avg wait per day
    const dayMap = {}
    tokensByDay.forEach(t => {
      const d    = t.date
      const wait = (new Date(t.calledAt) - new Date(t.issuedAt)) / 1000 / 60
      if (!dayMap[d]) dayMap[d] = { date: d, totalWait: 0, count: 0 }
      dayMap[d].totalWait += wait
      dayMap[d].count     += 1
    })

    const avgWaitByDay = Object.values(dayMap).map(d => ({
      date:    d.date,
      avgWait: Math.round(d.totalWait / d.count),
      count:   d.count,
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Throughput by hour (tokens created per hour of day)
    const tokensByHour = await Token.findAll({
      where: { clinicId, createdAt: { [Op.between]: [start, end] } },
      attributes: [
        [fn('HOUR', col('createdAt')), 'hour'],
        [fn('COUNT', col('id')),       'count'],
      ],
      group: [fn('HOUR', col('createdAt'))],
      order: [[fn('HOUR', col('createdAt')), 'ASC']],
      raw:   true,
    })

    // Fill all 24 hours
    const hourMap = {}
    for (let h = 0; h < 24; h++) hourMap[h] = { hour: h, count: 0 }
    tokensByHour.forEach(t => { hourMap[t.hour].count = parseInt(t.count) })
    const throughputByHour = Object.values(hourMap)

    return success(res, { avgWaitByDay, throughputByHour })
  } catch (err) {
    console.error('getQueueStats error:', err.message)
    return error(res, 'Failed to fetch queue stats', 500)
  }
}

// ── GET /api/analytics/complaints ────────────────────────────────
const getTopComplaints = async (req, res) => {
  const { range = '7days', doctorId, customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)

  try {
    const visitWhere = {
      clinicId,
      createdAt:  { [Op.between]: [start, end] },
      isComplete: true,
    }
    if (doctorId) visitWhere.doctorId = doctorId

    // Get all complaint tags from visits in range
    const visits = await Visit.findAll({
      where:      visitWhere,
      attributes: ['complaintTags', 'complaint'],
      raw:        true,
    })

    // Count tag frequency
    const tagCount = {}
    visits.forEach(v => {
      const tags = Array.isArray(v.complaintTags)
        ? v.complaintTags
        : (typeof v.complaintTags === 'string' ? JSON.parse(v.complaintTags || '[]') : [])

      tags.forEach(tag => {
        if (tag) tagCount[tag] = (tagCount[tag] || 0) + 1
      })

      // Also extract keywords from free-text complaint
      if (v.complaint) {
        const words = v.complaint.toLowerCase()
          .split(/[\s,;.]+/)
          .filter(w => w.length > 3)
        words.forEach(w => { tagCount[w] = (tagCount[w] || 0) + 0.5 })
      }
    })

    // Top 10 by count
    const topComplaints = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count: Math.round(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return success(res, { topComplaints, totalVisits: visits.length })
  } catch (err) {
    console.error('getTopComplaints error:', err.message)
    return error(res, 'Failed to fetch complaints', 500)
  }
}

// ── GET /api/analytics/doctors ────────────────────────────────────
const getDoctorStats = async (req, res) => {
  const { range = '7days', customStart, customEnd } = req.query
  const clinicId = req.user.clinicId
  const { start, end } = getDateRange(range, customStart, customEnd)

  try {
    const doctors = await User.findAll({
      where:      { clinicId, role: 'doctor', status: 'approved' },
      attributes: ['id', 'name'],
    })

    const doctorStats = await Promise.all(
      doctors.map(async (doc) => {
        const [served, avgWaitData, revenue] = await Promise.all([
          Token.count({
            where: {
              clinicId,
              doctorId:  doc.id,
              status:    'served',
              createdAt: { [Op.between]: [start, end] },
            },
          }),

          Token.findAll({
            where: {
              clinicId,
              doctorId:  doc.id,
              status:    'served',
              calledAt:  { [Op.ne]: null },
              issuedAt:  { [Op.ne]: null },
              createdAt: { [Op.between]: [start, end] },
            },
            attributes: ['issuedAt', 'calledAt'],
            raw: true,
          }),

          Bill.sum('total', {
            where: {
              clinicId,
              status:    'paid',
              createdAt: { [Op.between]: [start, end] },
              // Bills linked to this doctor's visits
              visitId: {
                [Op.in]: literal(
                  `(SELECT id FROM visits WHERE doctorId = '${doc.id}' AND clinicId = '${clinicId}')`
                ),
              },
            },
          }),
        ])

        let avgWait = 0
        if (avgWaitData.length > 0) {
          const total = avgWaitData.reduce((s, t) => {
            return s + (new Date(t.calledAt) - new Date(t.issuedAt)) / 1000 / 60
          }, 0)
          avgWait = Math.round(total / avgWaitData.length)
        }

        return {
          id:          doc.id,
          name:        doc.name,
          patientsServed: served,
          avgWaitMins: avgWait,
          revenue:     revenue || 0,
        }
      })
    )

    return success(res, { doctors: doctorStats })
  } catch (err) {
    console.error('getDoctorStats error:', err.message)
    return error(res, 'Failed to fetch doctor stats', 500)
  }
}

module.exports = {
  getOverview,
  getRevenue,
  getQueueStats,
  getTopComplaints,
  getDoctorStats,
}
```

---

### 2. `server/src/routes/analytics.routes.js`

```js
const express = require('express')
const router  = express.Router()
const {
  getOverview,
  getRevenue,
  getQueueStats,
  getTopComplaints,
  getDoctorStats,
} = require('../controllers/analytics.controller')
const { protect } = require('../middleware/auth.middleware')
const { rbac }    = require('../middleware/rbac.middleware')

router.use(protect, rbac(['admin']))

router.get('/overview',    getOverview)
router.get('/revenue',     getRevenue)
router.get('/queue',       getQueueStats)
router.get('/complaints',  getTopComplaints)
router.get('/doctors',     getDoctorStats)

module.exports = router
```

---

### 3. Mount in `server/index.js`

```js
app.use('/api/analytics', require('./src/routes/analytics.routes'))
```

---

### 4. Update `client/src/services/api.js`

```js
export const analyticsAPI = {
  getOverview:   (params) => api.get('/analytics/overview',   { params }),
  getRevenue:    (params) => api.get('/analytics/revenue',    { params }),
  getQueue:      (params) => api.get('/analytics/queue',      { params }),
  getComplaints: (params) => api.get('/analytics/complaints', { params }),
  getDoctors:    (params) => api.get('/analytics/doctors',    { params }),
}
```

---

## Frontend

### 5. `client/src/pages/admin/Analytics.jsx`

```jsx
import { useState, useEffect, useCallback } from 'react'
import { analyticsAPI, clinicAPI } from '../../services/api'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  BarChart as HBarChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus,
  Users, IndianRupee, Clock, Activity,
  AlertCircle, CheckCircle, MessageSquare,
  Stethoscope, Download
} from 'lucide-react'

// ── Design tokens for charts ──────────────────────────────────────
const COLORS = {
  crimson: '#C43055', teal: '#5AB09A', sky: '#70B8D8',
  yellow:  '#F0C030', lavender: '#9080C0', peach: '#F0A078',
  cream:   '#E0D4B5', muted: '#8A6070',
}

const RANGE_OPTIONS = [
  { id: 'today',  label: 'Today'    },
  { id: '7days',  label: '7 Days'   },
  { id: '30days', label: '30 Days'  },
  { id: 'custom', label: 'Custom'   },
]

// ── Queue Health RAG ──────────────────────────────────────────────
const RAG = {
  green: { color: 'text-accent-teal',  bg: 'bg-accent-teal/10',  label: 'Healthy',  dot: 'bg-accent-teal'  },
  amber: { color: 'text-amber-600',    bg: 'bg-accent-yellow/10',label: 'Warning',  dot: 'bg-accent-yellow'},
  red:   { color: 'text-accent-coral', bg: 'bg-accent-coral/10', label: 'Critical', dot: 'bg-accent-coral' },
}

// ── Trend indicator ───────────────────────────────────────────────
function Trend({ value }) {
  if (value > 0)  return <span className="flex items-center gap-0.5 text-accent-teal text-xs font-bold"><TrendingUp size={12} />+{value}%</span>
  if (value < 0)  return <span className="flex items-center gap-0.5 text-accent-coral text-xs font-bold"><TrendingDown size={12} />{value}%</span>
  return <span className="flex items-center gap-0.5 text-text-muted text-xs"><Minus size={12} />0%</span>
}

// ── KPI Card ──────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, color, bg, trend, loading }) {
  return (
    <div className="card">
      <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center mb-3`}>
        <Icon size={18} className={color} />
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-cream-200 rounded animate-pulse mb-1" />
      ) : (
        <div className="flex items-end gap-2">
          <p className={`font-display font-bold text-3xl ${color}`}>{value}</p>
          {trend !== undefined && <Trend value={trend} />}
        </div>
      )}
      <p className="font-body text-xs text-text-muted mt-0.5">{label}</p>
      {sub && <p className="font-body text-xs text-text-muted">{sub}</p>}
    </div>
  )
}

// ── Custom tooltip for charts ─────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-cream-300 rounded-2xl px-3 py-2 shadow-card">
      <p className="font-body text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-body text-sm font-bold" style={{ color: entry.color }}>
          {prefix}{typeof entry.value === 'number'
            ? entry.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
            : entry.value
          }{suffix}
        </p>
      ))}
    </div>
  )
}

// ── CSV Export ────────────────────────────────────────────────────
const exportCSV = (data, filename) => {
  if (!data?.length) return
  const keys = Object.keys(data[0])
  const csv  = [
    keys.join(','),
    ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Section header ────────────────────────────────────────────────
function SectionHeader({ title, onExport, exportData, exportFilename }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display font-bold text-lg text-text-primary">{title}</h3>
      {onExport && (
        <button
          onClick={() => exportCSV(exportData, exportFilename)}
          className="flex items-center gap-1.5 font-body text-xs font-semibold text-text-muted hover:text-text-body transition-colors"
        >
          <Download size={13} /> Export CSV
        </button>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function Analytics() {
  const [range, setRange]           = useState('7days')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd]   = useState('')
  const [doctorId, setDoctorId]     = useState('')
  const [doctors, setDoctors]       = useState([])

  const [overview, setOverview]     = useState(null)
  const [revenue, setRevenue]       = useState([])
  const [queueStats, setQueueStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [docStats, setDocStats]     = useState([])
  const [loading, setLoading]       = useState(true)

  // Fetch doctors for filter
  useEffect(() => {
    clinicAPI.getDoctors()
      .then(res => setDoctors(res.data.data.doctors))
      .catch(console.error)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const params = { range, doctorId: doctorId || undefined }
    if (range === 'custom' && customStart && customEnd) {
      params.customStart = customStart
      params.customEnd   = customEnd
    }

    try {
      const [ovRes, revRes, qRes, cmpRes, dRes] = await Promise.all([
        analyticsAPI.getOverview(params),
        analyticsAPI.getRevenue(params),
        analyticsAPI.getQueue(params),
        analyticsAPI.getComplaints(params),
        analyticsAPI.getDoctors(params),
      ])

      setOverview(ovRes.data.data)
      setRevenue(revRes.data.data.data || [])
      setQueueStats(qRes.data.data)
      setComplaints(cmpRes.data.data.topComplaints || [])
      setDocStats(dRes.data.data.doctors || [])
    } catch (err) {
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [range, doctorId, customStart, customEnd])

  useEffect(() => {
    if (range !== 'custom' || (customStart && customEnd)) {
      fetchAll()
    }
  }, [fetchAll])

  const kpis     = overview?.kpis    || {}
  const rag      = RAG[kpis.queueHealth || 'green']
  const trends   = overview?.trends  || {}

  // Format revenue data for chart
  const revenueChartData = revenue.map(r => ({
    date:    new Date(r.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
    revenue: parseFloat(r.revenue) || 0,
    bills:   parseInt(r.count)     || 0,
  }))

  // Format throughput data (show only clinic hours 8am-8pm)
  const throughputData = (queueStats?.throughputByHour || [])
    .filter(h => h.hour >= 7 && h.hour <= 20)
    .map(h => ({
      hour:  `${h.hour}:00`,
      tokens: h.count,
    }))

  // Format avg wait data
  const avgWaitData = (queueStats?.avgWaitByDay || []).map(d => ({
    date:    new Date(d.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
    avgWait: d.avgWait,
    count:   d.count,
  }))

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Analytics</h1>
          <p className="font-body text-text-muted mt-1">Clinic performance and revenue insights</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range tabs */}
          <div className="flex gap-1 bg-cream-100 p-1 rounded-2xl">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setRange(opt.id)}
                className={`px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all
                  ${range === opt.id
                    ? 'bg-white text-crimson-700 shadow-card'
                    : 'text-text-muted hover:text-text-body'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          {range === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-cream-300 font-body text-xs focus:outline-none focus:border-crimson-400"
              />
              <span className="font-body text-xs text-text-muted">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-cream-300 font-body text-xs focus:outline-none focus:border-crimson-400"
              />
            </>
          )}

          {/* Doctor filter */}
          {doctors.length > 0 && (
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-cream-300 bg-white font-body text-xs focus:outline-none focus:border-crimson-400"
            >
              <option value="">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard
          icon={Users}
          label="Patients Served"
          value={kpis.patientsToday ?? '—'}
          trend={trends.patients}
          color="text-crimson-500"
          bg="bg-crimson-100"
          loading={loading}
        />
        <KPICard
          icon={IndianRupee}
          label="Revenue"
          value={kpis.revenue ? `₹${Number(kpis.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
          trend={trends.revenue}
          color="text-accent-teal"
          bg="bg-accent-teal/10"
          loading={loading}
        />
        <KPICard
          icon={Clock}
          label="Avg Wait Time"
          value={kpis.avgWaitMins !== undefined ? `${kpis.avgWaitMins}m` : '—'}
          sub="per patient"
          color="text-accent-sky"
          bg="bg-accent-sky/10"
          loading={loading}
        />
        <KPICard
          icon={Activity}
          label="No-show Rate"
          value={kpis.noShowRate !== undefined ? `${kpis.noShowRate}%` : '—'}
          sub={`${kpis.cancelledTokens || 0} cancelled`}
          color="text-accent-peach"
          bg="bg-accent-peach/10"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <KPICard
          icon={IndianRupee}
          label="Paid Bills"
          value={kpis.paidBills ?? '—'}
          color="text-crimson-500"
          bg="bg-crimson-100"
          loading={loading}
        />
        <KPICard
          icon={Users}
          label="New Patients"
          value={kpis.newPatients ?? '—'}
          color="text-accent-lavender"
          bg="bg-accent-lavender/10"
          loading={loading}
        />
        <KPICard
          icon={MessageSquare}
          label="Messages Sent"
          value={kpis.messagesSent ?? '—'}
          sub={kpis.messagesFailed ? `${kpis.messagesFailed} failed` : undefined}
          color="text-accent-teal"
          bg="bg-accent-teal/10"
          loading={loading}
        />
        {/* Queue Health RAG */}
        <div className="card">
          <div className={`w-10 h-10 ${rag.bg} rounded-2xl flex items-center justify-center mb-3`}>
            <span className={`w-4 h-4 rounded-full ${rag.dot} ${kpis.queueHealth === 'green' ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex items-end gap-2">
            <p className={`font-display font-bold text-xl ${rag.color}`}>{rag.label}</p>
          </div>
          <p className="font-body text-xs text-text-muted mt-0.5">Queue Health</p>
          <p className="font-body text-xs text-text-muted">
            {kpis.avgWaitMins > 45 ? 'Wait > 45min'
              : kpis.avgWaitMins > 25 ? 'Wait > 25min'
              : 'Wait within target'}
          </p>
        </div>
      </div>

      {/* ── Charts Grid ────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">

        {/* Revenue Bar Chart */}
        <div className="card">
          <SectionHeader
            title="Revenue by Day"
            exportData={revenueChartData}
            exportFilename="revenue.csv"
          />
          {loading ? (
            <div className="h-48 bg-cream-100 rounded-2xl animate-pulse" />
          ) : revenueChartData.length === 0 ? (
            <EmptyChart message="No revenue data for this period" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChartData} margin={{ top:5, right:5, bottom:5, left:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cream} />
                <XAxis dataKey="date" tick={{ fontSize:11, fill:COLORS.muted }} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:COLORS.muted }} tickLine={false} axisLine={false}
                  tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                <Tooltip content={<ChartTooltip prefix="₹" />} />
                <Bar dataKey="revenue" fill={COLORS.crimson} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Avg Wait Line Chart */}
        <div className="card">
          <SectionHeader
            title="Avg Wait Time (minutes)"
            exportData={avgWaitData}
            exportFilename="avg-wait.csv"
          />
          {loading ? (
            <div className="h-48 bg-cream-100 rounded-2xl animate-pulse" />
          ) : avgWaitData.length === 0 ? (
            <EmptyChart message="No wait time data for this period" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={avgWaitData} margin={{ top:5, right:5, bottom:5, left:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cream} />
                <XAxis dataKey="date" tick={{ fontSize:11, fill:COLORS.muted }} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:COLORS.muted }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v}m`} />
                <Tooltip content={<ChartTooltip suffix=" min" />} />
                <Line
                  type="monotone" dataKey="avgWait"
                  stroke={COLORS.teal} strokeWidth={2.5}
                  dot={{ fill:COLORS.teal, strokeWidth:0, r:4 }}
                  activeDot={{ r:6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Throughput Area Chart */}
        <div className="card">
          <SectionHeader
            title="Patient Throughput by Hour"
            exportData={throughputData}
            exportFilename="throughput.csv"
          />
          {loading ? (
            <div className="h-48 bg-cream-100 rounded-2xl animate-pulse" />
          ) : throughputData.length === 0 ? (
            <EmptyChart message="No throughput data for this period" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={throughputData} margin={{ top:5, right:5, bottom:5, left:5 }}>
                <defs>
                  <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.sky} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.sky} stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cream} />
                <XAxis dataKey="hour" tick={{ fontSize:10, fill:COLORS.muted }} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize:11, fill:COLORS.muted }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip suffix=" tokens" />} />
                <Area
                  type="monotone" dataKey="tokens"
                  stroke={COLORS.sky} strokeWidth={2}
                  fill="url(#tpGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Complaints Horizontal Bar */}
        <div className="card">
          <SectionHeader
            title="Top Complaints / Tags"
            exportData={complaints}
            exportFilename="complaints.csv"
          />
          {loading ? (
            <div className="h-48 bg-cream-100 rounded-2xl animate-pulse" />
          ) : complaints.length === 0 ? (
            <EmptyChart message="No complaint data for this period" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <HBarChart
                data={[...complaints].reverse()}
                layout="vertical"
                margin={{ top:0, right:20, bottom:0, left:60 }}
              >
                <XAxis type="number" tick={{ fontSize:11, fill:COLORS.muted }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category" dataKey="name"
                  tick={{ fontSize:11, fill:COLORS.muted }}
                  tickLine={false} width={56}
                />
                <Tooltip content={<ChartTooltip suffix=" cases" />} />
                <Bar dataKey="count" radius={[0,4,4,0]}>
                  {complaints.map((_, i) => (
                    <Cell
                      key={i}
                      fill={[COLORS.crimson,COLORS.teal,COLORS.sky,COLORS.lavender,COLORS.peach,COLORS.yellow][i % 6]}
                    />
                  ))}
                </Bar>
              </HBarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Doctor Utilisation Table ────────────────────────── */}
      {docStats.length > 0 && (
        <div className="card">
          <SectionHeader
            title="Doctor Utilisation"
            exportData={docStats}
            exportFilename="doctor-stats.csv"
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream-200">
                  {['Doctor','Patients Served','Avg Wait','Revenue'].map(h => (
                    <th key={h} className="text-left font-body text-xs font-bold uppercase tracking-wider text-text-muted pb-2 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {docStats.map(doc => (
                  <tr key={doc.id} className="hover:bg-cream-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-crimson-100 rounded-xl flex items-center justify-center">
                          <span className="font-display font-bold text-crimson-600 text-xs">
                            {doc.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-body font-semibold text-sm text-text-primary">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-body text-sm text-text-body">{doc.patientsServed}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`font-body text-sm font-semibold
                        ${doc.avgWaitMins > 45 ? 'text-accent-coral'
                          : doc.avgWaitMins > 25 ? 'text-amber-600'
                          : 'text-accent-teal'}`}>
                        {doc.avgWaitMins}m
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-body text-sm text-text-body">
                        ₹{Number(doc.revenue).toLocaleString('en-IN', { maximumFractionDigits:0 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <p className="font-body text-sm text-text-muted">{message}</p>
    </div>
  )
}
```

---

### 6. Update `AdminLayout.jsx` — add Analytics to nav

```jsx
import { LayoutDashboard, Users, UserCheck, Settings, MessageSquare, BarChart2 } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin',           label: 'Overview',      icon: LayoutDashboard, end: true },
  { to: '/admin/analytics', label: 'Analytics',     icon: BarChart2 },
  { to: '/admin/requests',  label: 'Join Requests', icon: UserCheck },
  { to: '/admin/team',      label: 'Team',          icon: Users },
  { to: '/admin/messages',  label: 'Messages',      icon: MessageSquare },
  { to: '/admin/settings',  label: 'Settings',      icon: Settings },
]
```

---

### 7. Update `client/src/App.jsx`

```jsx
import Analytics from './pages/admin/Analytics'

// Add inside /admin nested routes:
<Route path="analytics" element={<Analytics />} />
```

---

## Restart and Test

```bash
cd server && npm run dev
cd client && npm run dev
```

---

## Test Checklist — Full F7 per PRD

**KPI Cards:**
- [ ] Patients Served count updates based on date range
- [ ] Revenue shows ₹ total — only visible to Admin (staff route not exposed)
- [ ] Avg Wait Time in minutes calculated correctly
- [ ] No-show rate % shown
- [ ] Queue Health RAG: green (< 25min), amber (25-45min), red (> 45min)
- [ ] Messages Sent count matches message log

**Charts (exact types from PRD):**
- [ ] Revenue → bar chart by day ✓
- [ ] Avg wait → line chart trend ✓
- [ ] Throughput → area chart by hour ✓
- [ ] Top complaints → horizontal bar top 10 ✓

**Filters:**
- [ ] Today / 7 Days / 30 Days switches update all charts simultaneously
- [ ] Custom date range (start + end inputs appear)
- [ ] Doctor filter narrows all data to that doctor

**Doctor Utilisation table:**
- [ ] Each doctor shows patients served, avg wait, revenue
- [ ] Wait time color coded (green/amber/red)

**Export:**
- [ ] "Export CSV" on each chart downloads a proper CSV file
- [ ] CSV opens correctly in Excel/Sheets

**Role check:**
- [ ] Admin sees full analytics including revenue
- [ ] Staff cannot access `/admin/analytics` (RBAC blocks it)

Tell me when Phase 9 is working and we move to Phase 10 — Real-time with Socket.IO.