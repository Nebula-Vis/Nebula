
export default class DataSource {
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
          dataObj.values = await this.loadData()
        } else {
          throw "No inline value and load path."
        }
        
      }
    }
    return data
  }

  async loadData (path, type) {

  }
}
