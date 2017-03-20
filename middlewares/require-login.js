module.exports = (req, res, next) => {
  if (
    !req.session.user ||
    req.session.user.id === undefined ||
    !req.session.user.email
  ) {
    return res.redirect('/login')
  }
  res.locals.user = req.session.user
  next()
}
