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

  const identity = d => (d instanceof Object ? d.__uuid__ : d)
  return { intersection: _.intersectionBy(...arrays, identity) }
}

module.exports = { intersect }
