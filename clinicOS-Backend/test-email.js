const { sendEmail } = require('./src/services/message.service')
require('dotenv').config()

async function test() {
  try {
    console.log('Sending test email to', process.env.MAIL_USER)
    await sendEmail(process.env.MAIL_USER, 'Test Subject', 'Test Body')
    console.log('Email sent successfully')
  } catch (err) {
    console.error('Error sending email:', err)
  }
}
test()
