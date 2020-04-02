import * as d3 from 'd3'

export default class DataSource {
  constructor(spec) {
    this.spec = spec
  }

  async init() {
    this.data = await this._getDataSourcesBySpec(this.spec)
    this._addUniqueIdToData(this.data)
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

  // 为每个data items赋予一个nebula的内部id，用于之后的比较
  _addUniqueIdToData(sources) {
    sources.forEach(source => {
      source.values.forEach((v, i) => {
        v._nbid_ = `${source.name}_${i}`
      })
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
        // TODO: load data
      } else {
        throw "No inline value and load path."
      }
      data.push(dataObj)
    }
    return data
  }
}
