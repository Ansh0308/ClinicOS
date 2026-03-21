const Razorpay = require('razorpay')
const crypto   = require('crypto')
require('dotenv').config()

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payment orders will fail')
}

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

/**
 * Create a Razorpay order.
 * amount is in INR (rupees) — this function converts to paise internally.
 */
const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const order = await razorpay.orders.create({
    amount:   Math.round(amount * 100), // Razorpay requires paise (₹1 = 100 paise)
    currency,
    receipt,
    notes,
  })
  return order
}

/**
 * Verify payment signature — CRITICAL for security.
 * Without this check anyone could fake a payment.
 */
const verifySignature = (orderId, paymentId, signature) => {
  const body     = orderId + '|' + paymentId
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  return expected === signature
}

module.exports = { createOrder, verifySignature }
