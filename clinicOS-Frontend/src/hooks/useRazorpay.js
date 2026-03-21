/**
 * useRazorpay hook
 * Opens the Razorpay checkout modal and handles success/failure callbacks.
 */
export const useRazorpay = () => {
  const openCheckout = (orderData, onSuccess, onFailure) => {
    const options = {
      key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:      orderData.amount,       // in paise — passed from backend
      currency:    orderData.currency,
      name:        'ClinicOS',
      description: 'Medical Bill Payment',
      order_id:    orderData.orderId,

      // Prefill patient details
      prefill: {
        name:    orderData.patientName  || '',
        contact: orderData.patientPhone || '',
      },

      theme: { color: '#C43055' }, // ClinicOS crimson

      handler: (response) => {
        // Called by Razorpay on successful payment
        // response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
        onSuccess(response)
      },

      modal: {
        ondismiss: () => {
          onFailure(new Error('Payment cancelled by user'))
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response) => {
      onFailure(new Error(response.error?.description || 'Payment failed'))
    })
    rzp.open()
  }

  return { openCheckout }
}
