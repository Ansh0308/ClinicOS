const PDFDocument = require('pdfkit')

/**
 * Generates a PDF receipt for a given bill.
 * Returns a Promise that resolves to a Buffer.
 */
const generateBillPDF = (bill) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const buffers = []

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => resolve(Buffer.concat(buffers)))

      // --- HEADER ---
      doc.fillColor('#A02040').fontSize(24).text('ClinicOS', { align: 'center' })
      doc.fillColor('#5C3040').fontSize(12).text(bill.clinic?.name || 'Clinic', { align: 'center' })
      if (bill.clinic?.address) {
        doc.fontSize(10).text(bill.clinic.address, { align: 'center' })
      }
      doc.moveDown()

      // --- BILL DETAILS ---
      const billIdShort = bill.id ? bill.id.split('-')[0].toUpperCase() : 'N/A'
      
      doc.fillColor('#5C3040').fontSize(14).text('TAX INVOICE / RECEIPT', { align: 'center', underline: true })
      doc.moveDown()

      doc.fontSize(10).fillColor('#000000')
      doc.text(`Receipt No: RCT-${billIdShort}`)
      doc.text(`Date: ${new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN')}`)
      doc.text(`Patient: ${bill.patient?.name || 'N/A'}`)
      if (bill.patient?.phone) doc.text(`Phone: ${bill.patient.phone}`)
      
      const paymentStatus = (bill.status || '').toUpperCase()
      const paymentMethod = bill.paymentMethod ? bill.paymentMethod.toUpperCase() : 'N/A'
      doc.text(`Status: ${paymentStatus}`)
      if (bill.status === 'paid') {
        doc.text(`Payment Method: ${paymentMethod}`)
      }
      
      doc.moveDown(2)

      // --- LINE ITEMS ---
      const tableTop = doc.y
      
      // Table Header
      doc.font('Helvetica-Bold')
      doc.text('Item / Service', 50, tableTop)
      doc.text('Qty', 300, tableTop, { width: 50, align: 'right' })
      doc.text('Price', 380, tableTop, { width: 60, align: 'right' })
      doc.text('Total', 460, tableTop, { width: 70, align: 'right' })
      
      // Separator Line
      doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).strokeColor('#E0D4B5').stroke()
      
      // Table Rows
      let yPosition = tableTop + 25
      doc.font('Helvetica')
      const items = bill.items || []
      
      items.forEach(item => {
        doc.text(item.name || 'Service', 50, yPosition, { width: 240 })
        doc.text((item.quantity || 1).toString(), 300, yPosition, { width: 50, align: 'right' })
        doc.text(`Rs ${Number(item.unitPrice || 0).toFixed(2)}`, 380, yPosition, { width: 60, align: 'right' })
        doc.text(`Rs ${Number(item.lineTotal || 0).toFixed(2)}`, 460, yPosition, { width: 70, align: 'right' })
        yPosition += 20
      })
      
      // Bottom Separator
      doc.moveTo(50, yPosition).lineTo(530, yPosition).strokeColor('#E0D4B5').stroke()
      yPosition += 15

      // --- TOTALS ---
      doc.font('Helvetica')
      doc.text('Subtotal:', 350, yPosition, { width: 100, align: 'right' })
      doc.text(`Rs ${Number(bill.subtotal || 0).toFixed(2)}`, 460, yPosition, { width: 70, align: 'right' })
      yPosition += 15

      if (bill.discountAmt > 0) {
        doc.text(`Discount (${bill.discountPercent || 0}%):`, 350, yPosition, { width: 100, align: 'right' })
        doc.text(`-Rs ${Number(bill.discountAmt || 0).toFixed(2)}`, 460, yPosition, { width: 70, align: 'right' })
        yPosition += 15
      }

      doc.text('Tax (18%):', 350, yPosition, { width: 100, align: 'right' })
      doc.text(`Rs ${Number(bill.tax || 0).toFixed(2)}`, 460, yPosition, { width: 70, align: 'right' })
      yPosition += 15

      doc.font('Helvetica-Bold')
      doc.text('Total Amount:', 350, yPosition, { width: 100, align: 'right' })
      doc.text(`Rs ${Number(bill.total || 0).toFixed(2)}`, 460, yPosition, { width: 70, align: 'right' })
      
      // Footer
      doc.moveDown(4)
      doc.font('Helvetica').fontSize(10).fillColor('#8A6070')
      doc.text('Thank you for choosing ClinicOS!', { align: 'center' })
      doc.text('This is a computer-generated receipt and does not require a physical signature.', { align: 'center' })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = { generateBillPDF }
