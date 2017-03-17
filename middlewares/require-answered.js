module.exports = async function (req, res, next) { try {
  const User = req.app.db.User

  const user = await User.findOne({
    where: { email: req.session.user.email },
    attributes: ['answered']
  })

  if (!user.answered) return res.redirect('/question')

  next()
} catch (err) { next(err) } }
