const { MessageLog, Patient } = require('./src/models')

async function check() {
  try {
    const logs = await MessageLog.findAll({
      limit: 10,
      order: [['sentAt', 'DESC']],
      raw: true
    })
    console.log('=== Recent Message Logs ===')
    console.log(logs.length ? logs : 'No logs found.')

    const patients = await Patient.findAll({
      include: [{ association: 'user', attributes: ['email'] }],
      limit: 5,
      raw: true,
      nest: true
    })
    console.log('\n=== Recent Patients ===')
    console.log(patients)
  } catch (err) {
    console.error('Error querying DB:', err)
  }
  process.exit(0)
}
check()
