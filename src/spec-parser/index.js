import DataSpecParser from './data'
import LayoutSpecParser from './layout'
import VisualizationsSpecParser from './visualizations'
import TransformationsSpecParser from './transformation'
import CoordinationSpecParser from './coordination'

class SpecParser {
  // el这玩意后期还得抽出来，逻辑不对
  // 感觉解析和构建，错误在哪里发现，值得考虑一下
  constructor(el, spec) {
    this._el = el
    this._spec = spec
    this._dataParser = new DataSpecParser(this._spec.data)
    this._layoutParser = new LayoutSpecParser(this._spec.layout)
    // this._visualizationsParser = null
    // this._coordinationParser = null
    // this._transformationParser = null

    this._dataSources = []
    this._layout = null
    this._visualizationsManager = null
    this._transformationsManager = null
  }

  async init() {
    await this._dataParser.loadData()
    this._dataSources = this._dataParser.getDataSources()

    this._layout = this._layoutParser.generateLayout()
    this._layout.mount(this._el)

    this._visualizationsManager = new VisualizationsSpecParser(
      this._dataSources,
      this._layout,
      this._spec.visualizations
    ).getVisualizationsManager()
    this._visualizationsManager.init()
    this._visualizationsManager.mount()

    this._transformationsManager = new TransformationsSpecParser(
      this._spec.transformations
    ).getTransformationsManager()

    new CoordinationSpecParser(
      this._dataSources,
      this._visualizationsManager,
      this._transformationsManager,
      this._spec.coordination
    )
  }
}

export default SpecParser
