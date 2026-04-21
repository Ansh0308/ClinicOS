/**
 * useRazorpay hook
 * Opens the Razorpay checkout modal and handles success/failure callbacks.
 */
export const useRazorpay = () => {
  const openCheckout = (orderData, onSuccess, onFailure) => {
    if (!window.Razorpay) {
      onFailure(new Error('Razorpay checkout failed to load. Refresh and try again.'))
      return
    }

    const keyId = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!keyId) {
      onFailure(new Error('Online payments are not configured for this app.'))
      return
    }

    const options = {
      key: keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'ClinicOS',
      description: 'Medical Bill Payment',
      order_id: orderData.orderId,

      prefill: {
        name: orderData.patientName || '',
        contact: orderData.patientPhone || '',
      },

      theme: { color: '#C43055' },

      handler: (response) => {
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
