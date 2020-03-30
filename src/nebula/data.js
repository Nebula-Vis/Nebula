import * as d3 from 'd3'

export default class DataSources {
  constructor(spec) {
    this.spec = spec
  }

  async init() {
    this.data = await this.parseDataSpec(this.spec)
  }

  async parseDataSpec (spec) {
    const data = []
    for (const element of spec) {
      if (!element.name || typeof element.name != 'string')
        throw "Data name error."
  
      const dataObj = {}
      dataObj.name = element.name
  
      if (element.values) {
        dataObj.values = element.values
        data.push(dataObj)
      } else {
        if (element.path && typeof element.path == 'string') {
          // TODO
          dataObj.values = await this.loadData(element.path, element.format)
        } else {
          throw "No inline value and load path."
        }
        
      }
    }
    return data
  }

  async loadData (path, format) {
    if (typeof path !== 'string') {
      throw 'Data path error.'
    }
    if (format && format !== 'json' && format !== 'csv') {
      throw 'Data format error.'
    }
    format = format || 'json'
    const dataValue = await d3[format](path).catch(() => {
      return
    })
    if (dataValue === undefined) {
      throw 'Data loading error.'
    }

    // naive parser: string -> number
    if (Array.isArray(dataValue) && dataValue[0] instanceof Object) {
      dataValue.forEach(v => {
        Object.keys(v).forEach(key => {
          v[key] = v[key].trim()
          if (v[key].length > 0 && !isNaN(+v[key])) {
            v[key] = +v[key]
          }
        })
      })
    }
    return dataValue
  }
}
