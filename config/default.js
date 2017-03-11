module.exports = {
  sessionSecret: 'secret',
  database: {
    uri: 'postgres://dalunpan:zhongjiangla@localhost:5432/dalunpan',

    // options: {
    //   logging: false
    // }
  },
  transporter: {
    service: 'outlook',
    port: 587,
    auth: {
      user: 'your@email.com',
      pass: 'password'
    }
  }
}
