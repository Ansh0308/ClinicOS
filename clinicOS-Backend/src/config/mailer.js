const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   process.env.MAIL_PORT,
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

module.exports = transporter