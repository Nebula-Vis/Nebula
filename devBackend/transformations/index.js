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

const union = ({ arrays }) => {
  if (!Array.isArray(arrays)) {
    throw new Error('Transformation "union": wrong parameter')
  }
  for (const array of arrays) {
    if (!Array.isArray(array)) {
      throw new Error('Transformation "union": wrong parameter')
    }
  }
  const identity = d => (d instanceof Object ? d.__uuid__ : d)
  return { union: _.unionBy(...arrays, identity) }
}

const bin = ({ data, field, binCount }) => {
  if (
    !Array.isArray(data) ||
    typeof field !== 'string' ||
    typeof binCount !== 'number'
  ) {
    throw new Error('Transformation "union": wrong parameter')
  }
  const min = _.minBy(data, field)[field]
  const max = _.maxBy(data, field)[field]
  const interval = (max - min) / binCount
  const bins = new Array(binCount)
  for (let i = 0; i < binCount; i++) {
    bins[i] = []
  }
  data.forEach(d => {
    const binIndex = Math.min(
      binCount - 1,
      Math.floor((d[field] - min) / interval)
    )
    bins[binIndex].push(d)
  })
  return bins
}

module.exports = { intersect, union, bin }
