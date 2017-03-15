const express = require('express')
const ejs = require('ejs')
const cookieSession = require('cookie-session')
const config = require('config')
const bodyParser = require('body-parser')
const path = require('path')

const apiRouter = require('./routers/api')
const pageRouter = require('./routers/page')

const errorHandler = require('./middlewares/error-handler')

module.exports = (database, logger, transporter) => {
  const app = express()

  app.db = database
  app.logger = logger
  app.transporter = transporter

  app.engine('ejs', ejs.renderFile)
  app.set('view engine', 'ejs')

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  app.use(cookieSession({
    name: 'session',
    secret: config.get('sessionSecret'),
    maxAge: 100 * 365 * 24 * 60 * 60 * 1000
  }))

  app.use('/api', apiRouter)
  app.use(pageRouter)
  app.use(express.static(path.normalize(`${__dirname}/static`)))

  app.use((req, res) => { res.redirect('/') })

  app.use(errorHandler)

  return app
}
