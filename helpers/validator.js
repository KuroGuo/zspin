exports.isEmail = email => {
  const regexp = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})*$/
  return regexp.test(email)
}
