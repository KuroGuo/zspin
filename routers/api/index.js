const express = require('express')

const router = express.Router()

router.post('/record', async function (req, res, next) { try {
  const email = req.session.user.email

  const User = req.app.db.User

  const user = await User.findOne({ where: { email } })

  // user.addRecord({
    // type: ''
  // })

  res.end()
} catch (err) { next(err) } })

module.exports = router
