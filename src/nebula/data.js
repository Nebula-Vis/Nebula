import * as d3 from 'd3'

// TODO: 健壮性
export default class DataSource {
  constructor(spec) {
    this.spec = spec
    this.data = []
  }

  async init() {
    this.data = await this._generateDataSourcesBySpec(this.spec)
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
      if (source.values) {
        source.values.forEach((v, i) => {
          v._nbid_ = `${source.name}_values_${i}`
        })
      }
      // Graph data
      else if (source.nodes && source.links) {
        source.nodes.forEach((n, i) => {
          n._nbid_ = `${source.name}_nodes_${i}`
        })
        source.links.forEach((l, i) => {
          l._nbid_ = `${source.name}_links_${i}`
        })
      }
    })
  }

  async _generateDataSourcesBySpec (spec) {
    const data = []
    for (const element of spec) {
      const dataObj = {}
      dataObj.name = element.name

      // Inline data - table
      if (element.values) {
        dataObj.values = element.values
      }
      // inline data - graph
      else if (element.nodes && element.links) {
        dataObj.nodes = element.nodes
        dataObj.links = element.links
      }
      // CSV data
      else if (element.path && element.format === "csv") {
        dataObj.values = await this._fetchCsvDataByPath(element.path)
      }
      // JSON data
      else if (element.path && (element.format === "json" || !element.format)) {
        const jsonData = await this._fetchJsonDataByPath(element.path)
        // json data - table
        if (jsonData.values) {
          dataObj.values = jsonData.values
        }
        // json data - graph
        else if (jsonData.nodes && jsonData.links) {
          dataObj.nodes = jsonData.nodes
          dataObj.links = jsonData.links
        }
      }
      data.push(dataObj)
    }
    return data
  }

  async _fetchCsvDataByPath(path) {
    const data = await d3.csv(path)
    this._parseNumericStringToNumberInCsvData(data)
    return data
  }

  async _fetchJsonDataByPath(path) {
    return await d3.json(path)
  }

  // parse numeric values from string to number, e.g. "0.1" => 0.1
  _parseNumericStringToNumberInCsvData(data) {
    if (!data.length) return
    const numericAttributes = this._getNumericAttributesInCsvData(data)
    data.forEach(d => {
      numericAttributes.forEach(attr => {
        d[attr] = +d[attr]
      })
    })
  }

  _getNumericAttributesInCsvData(data) {
    if (!data.length) return []
    const datum = data[0]
    return Object.keys(datum).filter(
      attr => this._isNumericString(datum[attr])
    )
  }

  _isNumericString(value) {
    return typeof value === 'string' && value.length > 0 && !isNaN(+value)
  }
}
