const path = require('path')
const file = require('../../helpers/file')

const fileLoader =  new file.Loader('json')

exports.load = async function (force) {
  const filename = process.env.NODE_ENV === 'production' ?
    'questions.prod.json' : 'questions.json'
  return await fileLoader.load(
    path.normalize(`${__dirname}/${filename}`),
    force
  )
}
