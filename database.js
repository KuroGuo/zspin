const config = require('config')
const Sequelize = require('sequelize')

const validateHelper = require('./helpers/validator')

const databaseConfig = config.get('database')

module.exports = () => {
  const sequelize = new Sequelize(
    databaseConfig.uri,
    databaseConfig.options || {}
  )

  const User = sequelize.define('user', {
    email: { type: Sequelize.STRING,  validate: { isEmail: true } },
    answered: Sequelize.BOOLEAN
  }, {
    indexes: [ { unique: true, fields: ['email'] } ],
    instanceMethods: {
      async getBalance() {
        const records = this.records || (await this.getRecords())
        return records
          .filter(r => r.type === 'zcoin')
          .map(r => parseFloat(r.amount))
          .reduce(((a, b) => a + b), 0)
          .toFixed(2)
      },
      async getTShirt() {
        const records = this.records || (await this.getRecords())
        return records
          .filter(r => r.type === 't_shirt')
          .map(r => parseFloat(r.amount))
          .reduce(((a, b) => a + b), 0)
          .toFixed()
      }
    }
  })

  const Record = sequelize.define('record', {
    type: Sequelize.ENUM('zcoin', 't_shirt'),
    amount: Sequelize.DECIMAL,
    sent: Sequelize.BOOLEAN,
    ip: Sequelize.STRING
  }, {
    indexes: [ { fields: ['userId', 'sent', 'createdAt'] } ],
    defaultScope: { where: { sent: { $not: true } } }
  })

  const requestStatus = {
    type: Sequelize.ENUM('pending', 'resolved', 'rejected'),
    defaultValue: 'pending'
  }

  const WithdrawalRequest = sequelize.define('withdrawalRequest', {
    address: {
      type: Sequelize.STRING,
      validate: { is: validateHelper.regexps.zcoinAddress }
    },
    status: requestStatus
  }, {
    indexes: [ { fields: ['status'] } ],
    defaultScope: { where: { status: 'pending' } }
  })

  const ClaimRequest = sequelize.define('claimRequest', {
    address: Sequelize.STRING,
    receiver: Sequelize.STRING,
    phone: Sequelize.STRING,
    status: requestStatus
  }, {
    indexes: [ { fields: ['status'] } ],
    defaultScope: { where: { status: 'pending' } }
  })

  User.hasMany(Record)
  User.hasOne(WithdrawalRequest)
  User.hasOne(ClaimRequest)
  WithdrawalRequest.belongsTo(User)
  ClaimRequest.belongsTo(User)

  sequelize.sync()

  return {
    sequelize,
    User,
    Record,
    WithdrawalRequest,
    ClaimRequest
  }
}
