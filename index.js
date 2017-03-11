const log4js = require('log4js')

const createApp = require('./app')
const connectDatabase = require('./database')

log4js.loadAppender('file')
log4js.addAppender(log4js.appenders.file('logs/debug.log'))

const logger = log4js.getLogger()

logger.setLevel('ERROR')

const app = createApp(connectDatabase(), logger)

app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})
