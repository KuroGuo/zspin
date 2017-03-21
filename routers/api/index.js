const express = require('express')
const requestIp = require('request-ip')

const spinner = require('../../data/spinner')

const router = express.Router()

router.post('/record', async function (req, res, next) { try {
  const userId = req.session.user.id
  const email = req.session.user.email
  const ip = requestIp.getClientIp(req)
  // const interval = 12 * 60 * 60 * 1000
  const interval = 60 * 1000

  const User = req.app.db.User
  const Record = req.app.db.Record

  const latestRecord = await Record.unscoped().findOne({
    where: {
      $or: ip ? [{ userId }, { ip }] : [{ userId }],
      createdAt: {
        $gt: new Date(new Date() - interval)
      }
    },
    order: [['createdAt', 'DESC']]
  })

  if (latestRecord) {
    return res.status(403).send({
      waitTime: interval - (new Date() - latestRecord.createdAt)
    })
  }

  let values = await Promise.all([
    User.findOne({ where: { email } }),
    spinner.take()
  ])

  const user = values[0]
  const option = values[1]

  const record = await user.createRecord({
    type: option.type,
    amount: option.amount,
    ip
  })

  await user.reload({ include: [Record] })

  values = await Promise.all([user.getBalance(), user.getTShirt()])

  const balance = values[0]
  const tShirt = values[1]

  res.status(201).send({
    name: option.name,
    user: { balance, tShirt }
  })
} catch (err) { next(err) } })

module.exports = router
