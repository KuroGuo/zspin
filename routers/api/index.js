const express = require('express')

const spinner = require('../../data/spinner')

const router = express.Router()

router.post('/record', async function (req, res, next) { try {
  const email = req.session.user.email

  const User = req.app.db.User
  const Record = req.app.db.Record

  let values = await Promise.all([
    User.findOne({ where: { email } }),
    spinner.take()
  ])

  const user = values[0]
  const option = values[1]

  const record = await user.createRecord({
    type: option.type,
    amount: option.amount
  })

  await user.reload({
    include: [Record]
  })

  values = await Promise.all([user.getBalance(), user.getTShirt()])

  const balance = values[0].toFixed(2)
  const tShirt = values[1].toFixed()

  res.status(201).send({
    name: option.name,
    user: { balance, tShirt }
  })
} catch (err) { next(err) } })

module.exports = router
