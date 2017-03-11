const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.render('login', {
    title: '登录'
  })
})

module.exports = router
