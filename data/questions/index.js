const fs = require('fs')
const path = require('path')

const cacheTimeout = 10 * 60 * 1000

let cache

exports.load = force => new Promise((resolve, reject) => {
  if (!force && cache) return resolve(cache)
  fs.readFile(path.normalize(`${__dirname}/questions.json`), (err, data) => {
    if (err) return reject(err)
    cache = JSON.parse(data)
    setTimeout(() => { cache = null }, cacheTimeout)
    resolve(cache)
  })
})
