const dns = require('dns')
const nodemailer = require('nodemailer')
require('dotenv').config()

// Force IPv4 resolution — Render blocks IPv6 SMTP connections
dns.setDefaultResultOrder('ipv4first')

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'smtp.gmail.com',
  port:   Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  socketTimeout:     10000,
})

module.exports = transporter