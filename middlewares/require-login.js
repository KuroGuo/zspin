module.exports = (req, res, next) => {
  if (!req.session.user || !req.session.user.email) {
    return res.redirect('/login')
  }
  next()
}
