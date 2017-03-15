const express = require('express')
const config = require('config')
const jwt = require('jsonwebtoken')

const requireLogin = require('../../middlewares/require-login')
const validator = require('../../helpers/validator')

const router = express.Router()

router.get('/', requireLogin, (req, res) => {
  res.send('Zspin')
})

router.get('/login', (req, res) => {
  res.render('login')
})

router.post('/login', async function (req, res, next) { try {
  const email = req.body.email

  if (!validator.isEmail(email)) {
    return res.render('message', { message: 'Not a valid email address.' })
  }

  const User = req.app.db.User

  const user = await User.findOne({
    where: { email },
    attributes: ['email']
  })

  if (user) {
    req.session.user = { email: user.email }
    res.redirect('/')
  } else {
    const transporter = req.app.transporter

    const siteURL = config.get('siteURL')
    const jwtSecret = config.get('jsonWebTokenSecret')

    const token = jwt.sign({
      action: 'first_login_confirm',
      email
    }, jwtSecret)

    const link = `${siteURL}confirm?token=${token}`

    transporter.sendMail({
      from: `"Zspin" <${config.get('transporter').auth.user}>`,
      to: email,
      subject: 'Zspin first login confirmation',
      text: `Click this link to login: ${link}`,
      html: `
        <h1>Zspin first login confirmation</h1>
        <p>Click this link to login:\r\n${link}</p>
      `
    }, (err, info) => {
      if (err) return next(err)
      res.send('sent')
    })

    res.render('message', {
      message: [
        'We have sent you an email confirmation.',
        'Please check your email to login.'
      ].join('\r\n')
    })
  }
} catch (err) { next(err) } })

router.get('/confirm', async function (req, res, next) { try {
  const token = req.query.token

  const jwtSecret = config.get('jsonWebTokenSecret')

  const data = jwt.verify(token, jwtSecret)

  const email = data.email

  switch (data.action) {
    case 'first_login_confirm': {
      const User = req.app.db.User
      const user = await new Promise((resolve, reject) => {
        User.findOrCreate({
          where: { email }
        }).spread(user => {
          resolve(user)
        }).catch(err => { reject(err) })
      })
      req.session.user = { email: user.email }
      res.redirect('/')
      break
    }
    default:
      throw new Error(`Invalid token ${token}`)
  }
} catch (err) { next(err) } })

module.exports = router
