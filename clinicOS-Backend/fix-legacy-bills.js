const sequelize = require('./src/config/database')
const { Bill, Token } = require('./src/models')

async function fix() {
  await sequelize.authenticate()
  console.log('Connected to DB')

  // Find all bills with tokenId = null
  const nullBills = await Bill.findAll({ where: { tokenId: null } })
  console.log(`Found ${nullBills.length} legacy bills without a tokenId.`)

  for (const bill of nullBills) {
    // Find the closest Token for this patient generated around the same time
    const token = await Token.findOne({
      where: {
        patientId: bill.patientId,
        clinicId: bill.clinicId,
      },
      order: [['createdAt', 'DESC']],
    })
    
    if (token) {
      bill.tokenId = token.id
      await bill.save()
      console.log(`Linked Bill ${bill.id.split('-')[0]} to Token ${token.tokenNumber}`)
    }
  }

  process.exit(0)
}

fix()
