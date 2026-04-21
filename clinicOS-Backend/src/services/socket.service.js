let io = null

const initSocket = (httpServer) => {
  const { Server } = require('socket.io')
  require('dotenv').config()

  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.on('join:clinic', (clinicId) => {
      if (!clinicId) return
      socket.join(`clinic:${clinicId}`)
      console.log(`Socket ${socket.id} joined clinic:${clinicId}`)
    })

    socket.on('join:patient', (patientId) => {
      if (!patientId) return
      socket.join(`patient:${patientId}`)
      console.log(`Socket ${socket.id} joined patient:${patientId}`)
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

const emitToClinic = (clinicId, event, data) => {
  if (!io) return
  io.to(`clinic:${clinicId}`).emit(event, data)
}

const emitToPatient = (patientId, event, data) => {
  if (!io) return
  io.to(`patient:${patientId}`).emit(event, data)
}

const getIO = () => io

module.exports = { initSocket, emitToClinic, emitToPatient, getIO }
