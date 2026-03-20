const express = require('express')
const cors    = require('cors')
require('dotenv').config()

const sequelize        = require('./src/config/database')
const { errorHandler } = require('./src/middleware/error.middleware')

// Import all models so Sequelize registers them before sync()
require('./src/models/index')

const app = express()

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } })
})
const authRoutes = require('./src/routes/auth.routes')
console.log('authRoutes type:', typeof authRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin', require('./src/routes/clinic.routes'))
// ── Routes (add each as you build them) ───────────────────────────────────────
// app.use('/api/auth',      require('./src/routes/auth.routes'))
// app.use('/api/admin',     require('./src/routes/clinic.routes'))
app.use('/api/patients',  require('./src/routes/patient.routes'))
app.use('/api/tokens',    require('./src/routes/token.routes'))
app.use('/api/visits',    require('./src/routes/visit.routes'))
app.use('/api/bills',     require('./src/routes/bill.routes'))

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler)

// ── Start server + sync DB ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

const start = async () => {
  try {
    // Test database connection
    await sequelize.authenticate()
    console.log('✅ MySQL connected')

    // sync({ alter: true }) updates existing tables to match your models
    // without dropping data — safe for development
    await sequelize.sync({ alter: true })
    console.log('✅ All tables synced')

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err.message)
    process.exit(1)
  }
}

start()