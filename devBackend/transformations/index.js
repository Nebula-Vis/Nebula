const _ = require('lodash')

const intersect = ({ arrays }) => {
  if (!Array.isArray(arrays)) {
    throw new Error('Transformation "intersect": wrong parameter')
  }
  for (const array of arrays) {
    if (!Array.isArray(array)) {
      throw new Error('Transformation "intersect": wrong parameter')
    }
  }

  return { intersection: _.intersection(...arrays) }
}

module.exports = { intersect }
