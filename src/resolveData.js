import * as d3 from 'd3'

/**
 * Arrange data into a key-value map, load remote data.
 * @param {Object[]} dataConfig Array of data objects, each being either inline or url data
 * @returns {Promise<Object>}
 */
const resolveData = async dataConfig => {
  const dataLib = {}
  for (const dataObject of dataConfig) {
    if (!dataObject) {
      continue
    }
    if (!dataObject.name) {
      console.warn('Data: data object name not specified')
      continue
    }
    if (
      !dataObject.value &&
      (!dataObject.url ||
        (dataObject.format !== 'json' && dataObject.format !== 'csv'))
    ) {
      console.warn(`Data: wrong spec of ${dataObject.name}, ignoring.`)
      continue
    }

    // fetch remote data
    if (dataObject.url) {
      const dataValue = await d3[dataObject.format](dataObject.url)
        .then(data => data)
        .catch(() => {
          return null
        })
      if (dataValue === null) {
        console.warn(`Data: error fetching ${dataObject.name}, ignoring.`)
        continue
      }
      dataObject.value = dataValue
    }
    if (dataLib[dataObject.name]) {
      console.warn(`Data: duplicate name ${dataObject.name}, overwriting.`)
    }
    dataLib[dataObject.name] = dataObject.value
  }
  return dataLib
}

export default resolveData
