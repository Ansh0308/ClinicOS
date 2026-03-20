// Generates a unique clinic code like CLIN-4X9Z
// Characters chosen to avoid confusion: no 0/O, no 1/I/L

const generateClinicCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CLIN-'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

module.exports = { generateClinicCode }