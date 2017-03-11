const express = require('express')
const ejs = require('ejs')
const cookieSession = require('cookie-session')
const config = require('config')
const bodyParser = require('body-parser')
const i18n = require('i18n')
const path = require('path')

const apiRouter = require('./routers/api')
const pageRouter = require('./routers/page')

const errorHandler = require('./middlewares/error-handler')

i18n.configure({
  locales: ['zh', 'en'],
  defaultLocale: 'en',
  directory: path.normalize(`${__dirname}/locales`)
})

module.exports = (database, logger) => {
  const app = express()

  app.db = database
  app.logger = logger

  app.engine('ejs', ejs.renderFile)
  app.set('view engine', 'ejs')

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  app.use(cookieSession({
    name: 'session',
    secret: config.get('sessionSecret'),
    maxAge: 24 * 60 * 60 * 1000
  }))

  app.use('/api', apiRouter)
  app.use(i18n.init)
  app.use(pageRouter)
  app.use(express.static(path.normalize(`${__dirname}/static`)))

  app.use((req, res) => { res.redirect('/') })

  app.use(errorHandler)

  return app
}
