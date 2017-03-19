const config = require('config')
const Sequelize = require('sequelize')

const databaseConfig = config.get('database')

module.exports = () => {
  const sequelize = new Sequelize(
    databaseConfig.uri,
    databaseConfig.options || {}
  )

  const User = sequelize.define('user', {
    email: { type: Sequelize.STRING,  validate: { isEmail: true } },
    answered: { type: Sequelize.BOOLEAN }
  }, {
    indexes: [ { unique: true, fields: ['email'] } ],
    instanceMethods: {
      async getBalance() {
        const records = this.records || (await this.getRecords())
        return records
          .filter(r => r.type === 'zcoin')
          .map(r => parseFloat(r.amount))
          .reduce(((a, b) => a + b), 0)
      },
      async getTShirt() {
        const records = this.records || (await this.getRecords())
        return records
          .filter(r => r.type === 't_shirt')
          .map(r => parseFloat(r.amount))
          .reduce(((a, b) => a + b), 0)
      }
    }
  })

  const Record = sequelize.define('record', {
    type: { type: Sequelize.ENUM('zcoin', 't_shirt') },
    amount: { type: Sequelize.DECIMAL },
    sent: { type: Sequelize.BOOLEAN }
  }, {
    indexes: [ { fields: ['sent'] } ],
    defaultScope: { where: { sent: { $not: true } } }
  })

  User.hasMany(Record)

  sequelize.sync()

  return {
    sequelize,
    User,
    Record
  }
}
