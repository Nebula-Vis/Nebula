import _ from 'lodash'

function traverseObject(target, endCondition, endTask, collectResult) {
  return run(target, [], target)
  function run(current, path) {
    if (endCondition(current, path, target)) {
      return endTask(current, path, target)
    }
    if (Array.isArray(current)) {
      const results = current.map((v, i) => run(v, path.concat(i)))
      if (collectResult) {
        return collectResult(results, current, path, target)
      }
      return results
    }
    if (typeof current === 'object') {
      const results = _.mapValues(current, (v, k) => run(v, path.concat(k)))
      if (collectResult) {
        return collectResult(results, current, path, target)
      }
      return results
    }
  }
}

export { traverseObject }
