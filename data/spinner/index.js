const path = require('path')
const file = require('../../helpers/file')

const fileLoader =  new file.Loader('json')

exports.take = async function () {
  const options = await load()
  let possibilitySum = 0
  options.forEach(o => {
    o.possibilityStart = possibilitySum
    possibilitySum += o.possibility
  })
  const result = Math.random() * possibilitySum
  return options
    .sort((a, b) => b.possibilityStart - a.possibilityStart)
    .find(o => o.possibilityStart <= result )
}

async function load(force) {
  const filename = process.env.NODE_ENV === 'production' ?
    'options.prod.json' : 'options.json'
  return await fileLoader.load(
    path.normalize(`${__dirname}/${filename}`),
    force
  )
}
