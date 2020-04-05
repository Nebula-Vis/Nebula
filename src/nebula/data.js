import * as d3 from 'd3'

// TODO: 健壮性
export default class DataSource {
  constructor(spec) {
    this.spec = spec
    this.data = []
  }

  async init() {
    this.data = await this._getDataSourcesBySpec(this.spec)
    this._addUniqueIdToData(this.data)
  }

  getDataSourceByName(name) {
    return this.data.find(dataObj => dataObj.name === name)
  }

  print() {
    this.data.forEach(d => {
      console.log(d)
    })
  }

  // 为每个data items赋予一个nebula的内部id，用于之后的比较
  _addUniqueIdToData(sources) {
    sources.forEach(source => {
      // Multidimensional data
      source.values.forEach((v, i) => {
        v._nbid_ = `${source.name}_values_${i}`
      })

      // Graph data
    })
  }

  async _getDataSourcesBySpec (spec) {
    const data = []
    for (const element of spec) {
      const dataObj = {}
      dataObj.name = element.name
  
      // Inline data
      if (element.values || (element.nodes & element.links)) {

      } 
      // CSV data
      else if (element.path && element.format === "csv") {

      } 
      // JSON data
      else if (element.path && (element.format === "json" || !element.format)) {

      }
      data.push(dataObj)
    }
    return data
  }
}
