import DataSpecParser from './data'
import LayoutSpecParser from './layout'
import VisualizationsSpecParser from './visualizations'
// import CoordinationSpecParser from './coordination'
import TransformationsSpecParser from './transformation'

class SpecParser {
  // el这玩意后期还得抽出来，逻辑不对
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

    // coordination
    // test vis <--> trans
    const chart1 = this._visualizationsManager.getVisualizationById('chart1')
    const chart2 = this._visualizationsManager.getVisualizationById('chart2')
    const chart3 = this._visualizationsManager.getVisualizationById('chart3')
    const trans1 = this._transformationsManager.generateTransformationInstance(
      'Intersect2'
    )
    chart1._instance.selection.addSub(trans1.array1)
    chart2._instance.selection.addSub(trans1.array2)
    trans1.intersection.addSub(chart3._instance.selection)
    // todo: trans param and return should be reactive properties
    // coordination中，从data、transformation这两个字段收集依赖，然后构建依赖
  }
}

export default SpecParser
