const express = require('express')

const router = express.Router()

router.get('/emails', async function (req, res) {
  const emails = await req.app.db.User.findAll()
  res.send(emails)
})

module.exports = router
