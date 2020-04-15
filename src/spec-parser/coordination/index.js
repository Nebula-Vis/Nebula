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

  // todo
  parse(spec) {
    const coordinationObjs = []

    const highLevelSpec = spec.filter((s) => s.how)
    const lowLevelSpec = spec.filter((s) => !s.how)

    highLevelSpec.forEach((s) => {
      lowLevelSpec.push(...this._highLevelParser.parse(s))
    })
    console.log(lowLevelSpec)

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
