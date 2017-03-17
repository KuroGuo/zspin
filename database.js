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
    indexes: [ { unique: true, fields: ['email'] } ]
  })

  sequelize.sync()

  return {
    sequelize,
    User
  }
}
