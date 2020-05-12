import HighLevelParser from './high-level'
import LowLevelParser from './low-level'
import Constructor from './constructor'

export default class CoordinationSpecParser {
  constructor(dataSources, visualizationsManager, transformationsManager) {
    this._dataSources = dataSources
    this._visualizationsManager = visualizationsManager
    this._transformationsManager = transformationsManager

    this._highLevelParser = new HighLevelParser(visualizationsManager)
    this._lowLevelParser = new LowLevelParser(
      dataSources,
      visualizationsManager,
      transformationsManager
    )
    this._constructor = new Constructor()
  }

  parse(spec) {
    if (!Array.isArray(spec)) return []
    const coordinationObjs = []

    const highLevelSpec = spec.filter((s) => {
      return typeof s === 'string' || s.how
    })
    const lowLevelSpec = spec.filter((s) => {
      return typeof s === 'object' && !s.how
    })

    highLevelSpec.forEach((s) => {
      lowLevelSpec.push(...this._highLevelParser.parse(s))
    })

    coordinationObjs.push(
      ...lowLevelSpec.map((s) => this._lowLevelParser.parse(s))
    )
    return coordinationObjs
  }

  construct(coordinationObjs) {
    coordinationObjs.forEach((coordination) => {
      this._constructor.constructCoordination(coordination)
    })
  }
}
