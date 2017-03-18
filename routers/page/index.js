const express = require('express')
const config = require('config')
const jwt = require('jsonwebtoken')
const validator = require('validator')

const requireLogin = require('../../middlewares/require-login')
const requireAnswered = require('../../middlewares/require-answered')
const questions = require('../../data/questions')
const arrayHelper = require('../../helpers/array')

const router = express.Router()

router.get('/', requireLogin, requireAnswered, async function (req, res, next) { try {
  const User = req.app.db.User

  const email = req.session.user.email

  const user = await User.findOne({ where: { email } })

  const records = await user.getUnsentRecords()

  console.log(records)

  res.render('home')
} catch (err) { next(err) } })

router.get('/login', (req, res) => {
  res.render('login')
})

router.post('/login', async function (req, res, next) { try {
  const email = req.body.email

  if (!validator.isEmail(email)) {
    return res.render('message', {
      message: 'Invalid email address.',
      canBack: true
    })
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

router.get('/question', requireLogin, async function (req, res, next) { try {
  const questionsArray = await questions.load()

  if (!req.session.questions || !req.session.questions.length) {
    const questionsForRender = arrayHelper
      .shuffle(questionsArray)
      .slice(0, 3)
      .map(q => JSON.parse(JSON.stringify(q)))

    questionsForRender.forEach(q => { delete q.answer })

    req.session.questions = questionsForRender
  }

  const question = Array.from(req.session.questions).shift()

  question.options = arrayHelper.shuffle(question.options)

  res.render('question', { question })
} catch (err) { next(err) } })

router.post('/question', requireLogin, async function(req, res, next) { try {
  const title = req.body.title
  const answer = req.body.answer

  const questionsArray = await questions.load()

  const question = questionsArray.filter(q => q.title === title)[0]

  if (!question) throw new Error('Non-exist question.')

  if (answer !== question.answer) {
    return res.render('message', {
      message: 'Wrong.\r\nPlease re-answer.',
      canBack: true
    })
  }

  const questionsTemp = Array.from(req.session.questions)
  questionsTemp.shift()
  if (questionsTemp.length > 0) {
    req.session.questions = questionsTemp
    res.redirect('/question')
  } else {
    delete req.session.questions
    await req.app.db.User.update({ answered: true }, {
      where: { email: req.session.user.email }
    })
    res.redirect('/')
  }
} catch (err) { next(err) } })

module.exports = router
