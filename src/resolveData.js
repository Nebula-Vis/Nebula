import * as d3 from 'd3'
import { v4 as uuidv4 } from 'uuid'

/**
 * Arrange data into a key-value map, load remote data.
 * @param {Object[]} dataConfig Array of data objects, each being either inline or url data
 * @returns {Promise<Object>}
 */
const resolveData = async dataConfig => {
  const dataLib = {}

  if (!Array.isArray(dataConfig)) {
    return dataLib
  }

  for (const dataObject of dataConfig) {
    if (!dataObject) {
      continue
    }

    const { name, url, format } = dataObject
    let { value } = dataObject

    // skip invalid cases
    if (!name) {
      console.warn('Data: data object name not specified')
      continue
    }
    if (dataLib[name]) {
      console.warn(`Data: duplicate name ${name}, ignoring.`)
      continue
    }
    if (!value && (!url || (format !== 'json' && format !== 'csv'))) {
      console.warn(`Data: wrong spec of ${name}, ignoring.`)
      continue
    }

    // fetch remote data
    if (!value && url) {
      const dataValue = await d3[format](url).catch(() => {
        console.warn(`Data: error fetching ${name}, ignoring.`)
        return null
      })
      if (dataValue === null) {
        continue
      }
      value = dataValue
    }

    // TODO smarter identification
    if (Array.isArray(value) && value[0] instanceof Object) {
      value.forEach(v => {
        v.__uuid__ = uuidv4()
      })
    }
    dataLib[name] = value
  }
  return dataLib
}

export default resolveData
