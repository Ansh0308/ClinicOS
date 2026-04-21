import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

let socketInstance = null

export function useSocket({
  onQueueUpdate,
  onQueuePaused,
  onTokenPosition,
  onBillsUpdated,
  onTokenServed,
  onBillUpdated,
  onTokenNew,
} = {}) {
  const { user }    = useAuth()
  const handlersRef = useRef({
    onQueueUpdate, onQueuePaused, onTokenPosition,
    onBillsUpdated, onTokenServed, onBillUpdated, onTokenNew,
  })

  useEffect(() => {
    handlersRef.current = {
      onQueueUpdate, onQueuePaused, onTokenPosition,
      onBillsUpdated, onTokenServed, onBillUpdated, onTokenNew,
    }
  })

  useEffect(() => {
    if (!user) return

    if (!socketInstance) {
      const serverUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
        .replace('/api', '')
      socketInstance = io(serverUrl, {
        withCredentials: true,
        transports:      ['websocket', 'polling'],
        reconnection:    true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      })
    }

    const socket = socketInstance

    if (user.clinicId) socket.emit('join:clinic', user.clinicId)

    const patientId = localStorage.getItem('clinicos_patient_id')
    if (user.role === 'patient' && patientId) {
      socket.emit('join:patient', patientId)
    }

    const handlers = {
      'queue:updated':   (d) => handlersRef.current.onQueueUpdate?.(d),
      'queue:paused':    (d) => handlersRef.current.onQueuePaused?.(d),
      'token:position':  (d) => handlersRef.current.onTokenPosition?.(d),
      'bills:updated':   (d) => handlersRef.current.onBillsUpdated?.(d),
      'token:served':    (d) => handlersRef.current.onTokenServed?.(d),
      'bill:updated':    (d) => handlersRef.current.onBillUpdated?.(d),
      'token:new':       (d) => handlersRef.current.onTokenNew?.(d),
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler)
    })

    socket.on('connect', () => {
      console.log('Socket connected')
      if (user.clinicId) socket.emit('join:clinic', user.clinicId)
      const pid = localStorage.getItem('clinicos_patient_id')
      if (user.role === 'patient' && pid) socket.emit('join:patient', pid)
    })

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler)
      })
    }
  }, [user?.clinicId, user?.role])

  const emit = useCallback((event, data) => {
    socketInstance?.emit(event, data)
  }, [])

  const connected = socketInstance?.connected ?? false

  return { emit, connected }
}
