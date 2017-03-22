const express = require('express')
const config = require('config')

const requireLogin = require('../middlewares/require-login')

const router = express.Router()

router.get('/', requireLogin, (req, res) => {
  res.send('home')
})

router.get('/login', (req, res) => {
  res.render('login')
})

router.post('/login', (req, res) => {
  const password = req.body.password

  if (password !== config.get('admin.password')) {
    return res.render('message', { message: 'Password error' })
  }

  req.session.logined = true

  res.redirect('/')
})

module.exports = router
