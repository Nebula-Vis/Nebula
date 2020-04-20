import * as d3 from 'd3'

/**
 * Init
 * const dataParser = new DataSpecParser(spec)
 * await dataParser.loadData()
 * const dataSources = dataParser.getDataSources()
 *
 * Get data
 * const data = dataSources.getDataSourceByName(name)
 * data.values
 */
export default class DataSpecParser {
  constructor(spec) {
    if (!spec) throw new TypeError('No data specification')
    this._spec = spec
    this._dataSources = null
  }

  async loadData() {
    this._dataSources = await this._generateDataSourcesBySpec(this._spec)
    this._addUniqueIdToData(this._dataSources)
  }

  getDataSources() {
    return new DataSources(this._dataSources)
  }

  // 为每个data items赋予一个nebula的内部id，用于之后的比较
  _addUniqueIdToData(sources) {
    sources.forEach((source) => {
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

  async _generateDataSourcesBySpec(spec) {
    const dataSources = []
    for (const element of spec) {
      const dataObj = {}
      dataObj.name = element.name

      // Inline data - table
      if (element.values) {
        dataObj.values = element.values
      }
      // Inline data - graph
      else if (element.nodes && element.links) {
        dataObj.nodes = element.nodes
        dataObj.links = element.links
      }
      // CSV data
      else if (element.path && element.format === 'csv') {
        dataObj.values = await this._fetchCsvDataByPath(element.path)
      }
      // JSON data
      else if (element.path && (element.format === 'json' || !element.format)) {
        const jsonData = await this._fetchJsonDataByPath(element.path)
        // graph
        if (jsonData.nodes && jsonData.links) {
          dataObj.nodes = jsonData.nodes
          dataObj.links = jsonData.links
        } // table
        else {
          dataObj.values = jsonData
        }
      }
      dataSources.push(dataObj)
    }
    return dataSources
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
    data.forEach((d) => {
      numericAttributes.forEach((attr) => {
        d[attr] = +d[attr]
      })
    })
  }

  _getNumericAttributesInCsvData(data) {
    if (!data.length) return []
    const datum = data[0]
    return Object.keys(datum).filter((attr) =>
      this._isNumericString(datum[attr])
    )
  }

  _isNumericString(value) {
    return typeof value === 'string' && value.length > 0 && !isNaN(+value)
  }
}

/**
 * One data source: { name, values/nodes/links }
 */
class DataSources {
  constructor(dataSources) {
    this._dataSources = dataSources
  }

  getDataSourceByName(name) {
    return this._dataSources.find((d) => d.name === name)
  }

  // getDataBySelection(selection) {
  //   const nbidStrArray = selection[0]._nbid_.split('_')
  //   const dataSourceName = nbidStrArray[0]
  //   const valueName = nbidStrArray[1]

  //   const dataSource = this.getDataSourceByName(dataSourceName)
  //   return dataSource[valueName].filter((d) => selection.includes(d._nbid_))
  // }
}
