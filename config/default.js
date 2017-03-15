module.exports = {
  siteURL: 'https://zspin.zcoin.io/',
  sessionSecret: 'secret',
  database: {
    uri: 'postgres://zspin:password@localhost:5432/zspin',

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
  },
  jsonWebTokenSecret: 'secret'
}
