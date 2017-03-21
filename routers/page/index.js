const express = require('express')
const config = require('config')
const jwt = require('jsonwebtoken')
const validator = require('validator')

const requireLogin = require('../../middlewares/require-login')
const requireAnswered = require('../../middlewares/require-answered')
const questions = require('../../data/questions')
const arrayHelper = require('../../helpers/array')
const validateHelper = require('../../helpers/validator')

const router = express.Router()

router.get('/', requireLogin, requireAnswered, async function (req, res, next) { try {
  const User = req.app.db.User
  const Record = req.app.db.Record

  const userId = req.session.user.id

  let user = await User.findById(userId, {
    include: [{ model: Record, required: false }]
  })

  const values = await Promise.all([user.getBalance(), user.getTShirt()])

  const balance = values[0]
  const tShirt = values[1]

  res.render('home', { balance, tShirt })
} catch (err) { next(err) } })

router.get('/login', (req, res) => {
  res.render('login')
})

router.post('/login', async function (req, res, next) { try {
  const email = req.body.email

  if (!validator.isEmail(email)) {
    return res.render('message', { message: 'Invalid email address' })
  }

  const User = req.app.db.User

  const user = await User.findOne({
    where: { email },
    attributes: ['id', 'email']
  })

  if (user) {
    req.session.user = { id: user.id, email: user.email }
    res.redirect('/')
  } else {
    const transporter = req.app.transporter

    const token = jwt.sign({
      action: 'first_login_confirm',
      email
    }, config.get('jsonWebTokenSecret'))

    const link = `${config.get('siteURL')}login/confirm?token=${encodeURIComponent(token)}`

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
      if (err) next(err)
    })

    res.render('message', {
      message: [
        'We have sent you an email confirmation',
        'Please check your email to login'
      ].join('\r\n')
    })
  }
} catch (err) { next(err) } })

router.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/')
})

router.get('/login/confirm', async function (req, res, next) { try {
  const token = req.query.token

  const data = jwt.verify(token, config.get('jsonWebTokenSecret'))

  const email = data.email

  if (data.action !== 'first_login_confirm') {
    throw new Error(`Invalid token ${token}`)
  }

  const User = req.app.db.User
  const user = await new Promise((resolve, reject) => {
    User.findOrCreate({
      where: { email }
    }).spread(user => {
      resolve(user)
    }).catch(err => { reject(err) })
  })
  req.session.user = { id: user.id, email: user.email }
  res.redirect('/')
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

  if (!question) throw new Error('Non-exist question')

  if (answer !== question.answer) {
    return res.render('message', {
      message: 'Wrong\r\nPlease re-answer'
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

const withdrawalRequestMiddleware = async function (req, res, next) { try {
  const userId = req.session.user.id

  const User = req.app.db.User
  const Record = req.app.db.Record
  const WithdrawalRequest = req.app.db.WithdrawalRequest

  const user = await User.findById(userId, {
    include: [
      { model: Record, required: false },
      { model: WithdrawalRequest, required: false }
    ]
  })

  const balance = await user.getBalance()

  if (parseFloat(balance) < 1) {
    return res.render('message', { message: 'Minumal withdrawal: 1 XZC' })
  }

  res.locals.user = user
  res.locals.balance = balance

  if (user.withdrawalRequest) {
    return res.render('message', {
      message: [
        `Your already have a withdrawal request #${user.withdrawalRequest.id}`,
        'Please wait 24 hours for review'
      ].join('\r\n')
    })
  }

  next()
} catch (err) { next(err) } }

router.get('/withdrawal', requireLogin, withdrawalRequestMiddleware, (req, res) => {
  res.render('withdrawal', { regexp: validateHelper.regexps.zcoinAddress })
})

router.post('/withdrawal', requireLogin, withdrawalRequestMiddleware, (req, res) => {
  const address = req.body.address.trim()

  if (!validateHelper.isZcoinAddress(address)) {
    return res.render('message', { message: 'Wrong address' })
  }

  const email = req.session.user.email

  const transporter = req.app.transporter

  const token = jwt.sign({
    action: 'withdrawal_confirm',
    address
  }, config.get('jsonWebTokenSecret'))

  const link = `${config.get('siteURL')}withdrawal/confirm?token=${encodeURIComponent(token)}`

  transporter.sendMail({
    from: `"Zspin" <${config.get('transporter').auth.user}>`,
    to: email,
    subject: 'Zspin withdrawal confirmation',
    text: `Click this link to confirm: ${link}`,
    html: `
      <h1>Zspin withdrawal confirmation</h1>
      <p>Click this link to confirm:\r\n${link}</p>
    `
  }, (err, info) => {
    if (err) next(err)
  })

  res.render('message', {
    message: [
      'We have sent you an email confirmation',
      'Please check your email to confirm'
    ].join('\r\n')
  })
})

router.get('/withdrawal/confirm', requireLogin, withdrawalRequestMiddleware, async function (req, res, next) { try {
  const token = req.query.token

  const data = jwt.verify(token, config.get('jsonWebTokenSecret'))

  if (data.action !== 'withdrawal_confirm') {
    throw new Error(`Invalid Token ${token}`)
  }

  const address = data.address

  const withdrawalRequest = await res.locals.user.createWithdrawalRequest({ address })

  res.render('message', {
    message: [
      `Created a new withdrawal request #${withdrawalRequest.id}`,
      'Please wait 24 hours for review'
    ].join('\r\n'),
    backHref: '/'
  })
} catch (err) { next(err) } })

const claimRequestMiddleware = async function (req, res, next) { try {
  const userId = req.session.user.id

  const User = req.app.db.User
  const Record = req.app.db.Record
  const ClaimRequest = req.app.db.ClaimRequest

  const user = await User.findById(userId, {
    include: [
      { model: Record, required: false },
      { model: ClaimRequest, required: false }
    ]
  })

  const tShirt = await user.getTShirt()

  if (parseFloat(tShirt) < 1) {
    return res.render('message', { message: 'Minumal claim: 1 T-Shirt' })
  }

  res.locals.user = user
  res.locals.tShirt = tShirt

  if (user.claimRequest) {
    return res.render('message', {
      message: [
        `Your already have a claim request #${user.claimRequest.id}`,
        'Please wait 24 hours for review'
      ].join('\r\n')
    })
  }

  next()
} catch (err) { next(err) } }

router.get('/claim', requireLogin, claimRequestMiddleware, (req, res) => {
  res.render('claim')
})

router.post('/claim', requireLogin, claimRequestMiddleware, (req, res, next) => {
  const address = req.body.address
  const receiver = req.body.receiver
  const phone = req.body.phone

  const email = req.session.user.email

  const transporter = req.app.transporter

  const token = jwt.sign({
    action: 'claim_confirm',
    address,
    receiver,
    phone
  }, config.get('jsonWebTokenSecret'))

  const link = `${config.get('siteURL')}claim/confirm?token=${encodeURIComponent(token)}`

  transporter.sendMail({
    from: `"Zspin" <${config.get('transporter').auth.user}>`,
    to: email,
    subject: 'Zspin claim confirmation',
    text: `Click this link to confirm: ${link}`,
    html: `
      <h1>Zspin claim confirmation</h1>
      <p>Click this link to confirm:\r\n${link}</p>
    `
  }, (err, info) => {
    if (err) next(err)
  })

  res.render('message', {
    message: [
      'We have sent you an email confirmation',
      'Please check your email to confirm'
    ].join('\r\n')
  })
})

router.get('/claim/confirm', requireLogin, claimRequestMiddleware, async function (req, res, next) { try {
  const token = req.query.token

  const data = jwt.verify(token, config.get('jsonWebTokenSecret'))

  if (data.action !== 'claim_confirm') {
    throw new Error(`Invalid Token ${token}`)
  }

  const address = data.address
  const receiver = data.receiver
  const phone = data.phone

  const claimRequest = await res.locals.user.createClaimRequest({
    address,
    receiver,
    phone
  })

  res.render('message', {
    message: [
      `Created a new claim request #${claimRequest.id}`,
      'Please wait 24 hours for review'
    ].join('\r\n'),
    backHref: '/'
  })
} catch (err) { next(err) } })

module.exports = router
