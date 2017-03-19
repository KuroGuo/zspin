const fs = require('fs')
const path = require('path')

class Loader {
  constructor(type = 'text', cacheTimeout = 10 * 60 * 1000) {
    this.cache = null
    this.cacheTimeout = cacheTimeout
    this.type = type
  }

  load(_path, force) {
    return new Promise((resolve, reject) => {
      if (!force && this.cache) return resolve(this.cache)
      fs.readFile(path.normalize(_path), (err, data) => {
        if (err) return reject(err)
        this.cache = this.type === 'json' ? JSON.parse(data) : data
        setTimeout(() => { this.cache = null }, this.cacheTimeout)
        resolve(this.cache)
      })
    })
  }
}

exports.Loader = Loader
