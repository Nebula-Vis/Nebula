import * as d3 from 'd3'

export default class DataSource {
  constructor(spec) {
    this.spec = spec
  }

  async init() {
    this.data = await this._getDataSourcesBySpec(this.spec)
  }

  getDataSourceByName(name) {
    const data = this.data.find(dataObj => dataObj.name === name)
    return data && data.values
  }

  print() {
    this.data.forEach(d => {
      console.log(d)
    })
  }

  async _getDataSourcesBySpec (spec) {
    const data = []
    for (const element of spec) {
      if (!element.name || typeof element.name != 'string')
        throw "Data name error."
  
      const dataObj = {}
      dataObj.name = element.name
  
      if (element.values) {
        dataObj.values = element.values
      } else if (element.path && typeof element.path == 'string') {
        dataObj.values = await this._getDataValueByPath(element.path, element.format)
      } else {
        throw "No inline value and load path."
      }
      data.push(dataObj)
    }
    return data
  }

  async _getDataValueByPath (path, format) {
    if (format && format !== 'json' && format !== 'csv') 
      throw 'Data format error.'
    
    format = format || 'json'

    const data = await d3[format](path)
    if (!data) 
      throw 'Data loading error.'
    
    if (format === 'csv') {
      this._parseNumberFromStringInCSV(data)
    }
    return data
  }

  // parse numeric attribute values from string to number in csv file
  // e.g. "0.1" => 0.1
  _parseNumberFromStringInCSV(data) {
    if (!data[0]) return
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
