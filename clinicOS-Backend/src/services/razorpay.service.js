const Razorpay = require('razorpay')
const crypto = require('crypto')
require('dotenv').config()

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set - payment orders will fail')
}

let razorpayClient = null

const buildError = (message, statusCode = 500, meta = {}) => {
  const err = new Error(message)
  err.statusCode = statusCode
  Object.assign(err, meta)
  return err
}

const getClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw buildError('Online payments are not configured on the server.', 503)
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }

  return razorpayClient
}

const parseRazorpayError = (err) => {
  if (err?.error?.description) {
    return buildError(err.error.description, err.statusCode || 502, { cause: err })
  }

  if (err?.response?.data?.error?.description) {
    return buildError(
      err.response.data.error.description,
      err.response.status || 502,
      { cause: err }
    )
  }

  if (err?.code === 'ENOTFOUND' || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT') {
    return buildError('Could not reach Razorpay. Check your internet connection and try again.', 502, { cause: err })
  }

  if (err?.message) {
    return buildError(err.message, err.statusCode || 500, { cause: err })
  }

  return buildError('Failed to contact Razorpay.', 500, { cause: err })
}

/**
 * Create a Razorpay order.
 * amount is in INR (rupees) - this function converts to paise internally.
 */
const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const normalizedAmount = Number(amount)

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw buildError('Bill amount must be greater than zero before creating an online payment order.', 400)
  }

  try {
    const razorpay = getClient()
    const order = await razorpay.orders.create({
      amount: Math.round(normalizedAmount * 100), // Razorpay requires paise (INR 1 = 100 paise)
      currency,
      receipt,
      notes,
    })
    return order
  } catch (err) {
    throw parseRazorpayError(err)
  }
}

/**
 * Verify payment signature - CRITICAL for security.
 * Without this check anyone could fake a payment.
 */
const verifySignature = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw buildError('Online payments are not configured on the server.', 503)
  }

  const body     = orderId + '|' + paymentId
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  return expected === signature
}

module.exports = { createOrder, verifySignature }
