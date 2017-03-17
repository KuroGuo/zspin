exports.shuffle = arr => (
  arr
    .map(item => ({ item: item, sortNumber: Math.random() }))
    .sort((a, b) => a.sortNumber - b.sortNumber)
    .map(item => item.item)
)

exports.randomGetOne = arr => arr[randomIndex(arr)]

function randomIndex(arr) {
  return Math.floor(Math.random() * (Array.isArray(arr) ? arr.length : arr))
}
