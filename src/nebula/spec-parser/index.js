import DataSpecParser from './data'
import LayoutSpecParser from './layout'
// import VisualizationsSpecParser from './vis'
// import CoordinationSpecParser from './coordination'
// import TransformationsSpecParser from './transformation'

class SpecParser {
  // el这玩意后期还得抽出来，逻辑不对
  constructor(el, spec) {
    this._el = el
    this._spec = spec
    this._dataParser = new DataSpecParser(this._spec.data)
    this._layoutParser = new LayoutSpecParser(this._spec.layout)
    this._visualizationsParser = null
    this._coordinationParser = null
    this._transformationParser = null

    this._dataSources = []
    this._layout = null
  }

  async init() {
    await this._dataParser.loadData()
    this._dataSources = this._dataParser.getDataSources()

    this._layout = this._layoutParser.generateLayout()
    this._layout.mount(this._el)
  }
}

export default SpecParser
