import _ from 'lodash'

// 获取数组的聚合值
const getAggregationValue = (array, type, key) => {
  // 对象的聚合
  if (key) {
    if (type === 'sum') return _.sumBy(array, key)
    else if (type === 'max') return _.maxBy(array, key)[key]
    else if (type === 'min') return _.minBy(array, key)[key]
    else if (type === 'mean' || type === 'average') return _.meanBy(array, key)
    else throw new Error(`No such aggregation type: ${type}`)
  }
  // 值的聚合
  else {
    if (type === 'sum') return _.sum(array)
    else if (type === 'max') return _.max(array)
    else if (type === 'min') return _.min(array)
    else if (type === 'mean' || type === 'average') return _.mean(array)
    else if (type === 'count') return array.length
    // count不允许有key
    else throw new Error(`No such aggregation type: ${type}`)
  }
}

// TODO
// 获取过滤后的数组
// criteria, criterion combination
// Reserved words: datum, and, or, not
// const getFilteredArray = (array, criteria) => {}

// test
const getDomainOfArray = (array, x, y) => {
  return [
    [
      getAggregationValue(array, 'min', x),
      getAggregationValue(array, 'max', x),
    ],
    [
      getAggregationValue(array, 'min', y),
      getAggregationValue(array, 'max', y),
    ],
  ]
}

export default {
  aggregate: getAggregationValue,
  // filter: getFilteredArray,
  test: getDomainOfArray,
}
