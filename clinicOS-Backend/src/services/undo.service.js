const undoStore = new Map()

const UNDO_WINDOW_MS = 10000

const saveUndoState = (clinicId, { tokenId, previousStatus, previousPosition }) => {
  undoStore.set(clinicId, {
    tokenId,
    previousStatus,
    previousPosition,
    expiresAt: Date.now() + UNDO_WINDOW_MS,
  })

  setTimeout(() => {
    const entry = undoStore.get(clinicId)
    if (entry && entry.tokenId === tokenId) {
      undoStore.delete(clinicId)
    }
  }, UNDO_WINDOW_MS)
}

const getUndoState = (clinicId) => {
  const entry = undoStore.get(clinicId)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    undoStore.delete(clinicId)
    return null
  }
  return entry
}

const clearUndoState = (clinicId) => {
  undoStore.delete(clinicId)
}

module.exports = { saveUndoState, getUndoState, clearUndoState }
