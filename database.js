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
      getUnsentRecords() {
         return this.getRecords({ where: { sent: { $not: true } } })
      }
    }
  })

  const Record = sequelize.define('record', {
    type: { type: Sequelize.ENUM('zcoin', 't_shirt') },
    amount: { type: Sequelize.INTEGER },
    sent: { type: Sequelize.BOOLEAN }
  }, {
    indexes: [ { fields: ['sent'] } ]
  })

  User.hasMany(Record)

  sequelize.sync()

  return {
    sequelize,
    User
  }
}
