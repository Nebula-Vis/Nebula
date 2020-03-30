import * as d3 from 'd3'

export default class DataSources {
  constructor(spec) {
    this.spec = spec
  }

  async init() {
    this.data = await this.parseDataSpec(this.spec)
  }

  getDataByName(name) {
    if (!Array.isArray(this.data)) return
    const data = this.data.find(dataObj => dataObj.name === name)
    return data && data.values
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

    let data
    try {
      data = await d3[format](path)
    } catch (e) {
      throw 'Data loading error.'
    }

    if (format === 'csv') {
      this.parseNumberFromStringInCSV(data)
    }
    return data
  }

  // parse numeric attribute values from string to number
  // e.g. "0.1" => 0.1
  parseNumberFromStringInCSV(data) {
    if (!data || !data[0]) return
    const numericAttributes = Object.keys(data[0]).filter(
      key => this.isNumberInStringFormat(data[0][key])
    )
    data.forEach(d => {
      numericAttributes.forEach(key => {
        d[key] = +d[key]
      })
    })
  }

  isNumberInStringFormat(value) {
    return typeof value === 'string' && value.length > 0 && !isNaN(+value)
  }
}
