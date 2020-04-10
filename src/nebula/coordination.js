import ReactiveProperty from './reactive_prop'

export default class CoordinationManager {
  constructor(dataSources, visManager, spec) {
    this.dataSources = dataSources
    this.visManager = visManager
    this.spec = spec
    this.coordinationObjs = this.spec.map((coordinationSpec) => {
      const coordination = {
        data: null,
        transformations: null,
        triggers: null,
      }
      // low level
      if (coordinationSpec.how === undefined) {
        coordination.triggers = coordinationSpec.triggers || 'any'
        coordination.data = {}
        for (const data of coordinationSpec.data) {
          if (coordination.data[data.name] !== undefined)
            throw new Error('Coordination data name cannot be repeated.')
          coordination.data[data.name] = data.properties
          // todo: transformation
        }
      }
      // high level
      else {
        // ...
      }
      return coordination
    })
    this._constructCoordination()
  }

  _constructCoordination() {
    for (const coordination of this.coordinationObjs) {
      const reactiveVariables = []
      // data, props的依赖
      for (const dataName in coordination.data) {
        const reactiveData = new ReactiveProperty(null, dataName, null, null)
        for (const prop of coordination.data[dataName]) {
          // info[0]: visid, info[1]: vis prop
          const propInfo = prop.split('.')
          const visProp = this.visManager.getVisInstanceById(propInfo[0])[
            propInfo[1]
          ]
          reactiveData.addSub(visProp)
          visProp.addSub(reactiveData)
        }
        reactiveVariables.push(reactiveData)
      }
      console.log(reactiveVariables)
      // data, transformation的依赖
    }
  }
}
