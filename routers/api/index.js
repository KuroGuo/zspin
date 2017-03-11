const express = require('express')
const nodemailer = require('nodemailer')
const config = require('config')

const transporterConfig = config.get('transporter')

const router = express.Router()

router.get('/emails', async function (req, res) {
  const emails = await req.app.db.User.findAll()
  res.send(emails)
})

router.get('/sendemail', (req, res, next) => {
  const transporter = nodemailer.createTransport(transporterConfig)

  transporter.sendMail({
    from: `"Zcoin China" <${transporterConfig.auth.user}>`,
    to: 'kuroguo@qq.com',
    subject: 'Hello ✔',
    text: 'Hello world ? 零币大法好' + new Date().getTime(),
    html: '<h1>零币大法好</h1><b>Hello world ?</b>' + new Date().getTime()
  }, (err, info) => {
    if (err) return next(err)
    console.log('Message %s sent: %s', info.messageId, info.response)
    res.send('sent')
  })
})

module.exports = router
