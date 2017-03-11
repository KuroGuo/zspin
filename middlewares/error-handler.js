module.exports = (err, req, res, next) => {
  let errContent

  if (req.session && req.session.user && req.session.user.email) {
    errContent = `user: ${req.session.user.email}\r\n${err.stack}`
  } else {
    errContent = err.stack
  }

  req.app.logger.error(errContent)

  if (res.headersSent) return next(err)

  res.status(500)
  res.send({ error: err.message })
}
