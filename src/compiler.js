import resolveData from './resolveData'
import resolveLayout from './resolveLayout'
import resolveVisLib from './resolveVisLib'
import resolveTransformLib from './resolveTransformLib'
import { traverseObject } from '@src/utils'

import {
  Observable,
  VisInstanceObserver,
  TransformationObserver,
} from './observer'

export default class Compiler {
  /**
   * Create new system compiler
   * @param {{
   *   data: Object[];
   *   layout: Object;
   *   visualizations: Object[];
   *   coordinations?: Object[];
   *   transformations?: Object[]
   * }} config Visual analytics system config
   */
  constructor(config) {
    this.config = config
    this.visualizations = {}
  }

  /**
   * Construct a interactive coordinated visual analytics system
   * @param {string|Element|undefined} el target element to render the system
   */
  async compile(el) {
    // if (!this.validateConfig()) {
    //   console.error()
    // }

    const data = await resolveData(this.config.data) // Fetch Data
    const layout = resolveLayout(this.config.layout, el) // render container
    const visLib = resolveVisLib() // load vis lib
    const transformLib = resolveTransformLib(this.config.transformations)

    this.renderVisualization(data, layout, visLib) // render vis
    this.coordinate(transformLib) // add coordination
  }

  /**
   * Render visualizations
   * @param {{[id: string]: any}} data loaded data store
   * @param {{[id: string]: Element}} layout rendered containers
   * @param {{[id: string]: VueConstructor}} visLib loaded vis lib
   */
  renderVisualization(data, layout, visLib) {
    const layoutVisMap = {}

    for (const visualization of this.config.visualizations) {
      if (!this.validateVisSpec(visualization, layout, layoutVisMap, visLib)) {
        continue
      }

      const {
        id,
        container,
        visualization: visSpec,
        data: dataSpec,
        encoding,
      } = visualization

      // construct vis instance
      const VisConstructor = visLib[visSpec]
      const el = document.createElement('div')
      layout[container].appendChild(el)
      const propsData = {}
      if (dataSpec) {
        if (data[dataSpec]) {
          propsData.data = data[dataSpec]
        } else {
          console.warn(
            `Compiler: data ${dataSpec} for visualization ${id} not defined`
          )
        }
      }
      // selection spec is ignored // TODO
      if (encoding) {
        propsData.encoding = encoding
      }
      const instance = new VisConstructor({
        el,
        propsData,
      })
      this.visualizations[id] = instance
      layoutVisMap[container] = id
    }
  }

  coordinate(transformLib) {
    if (!Array.isArray(this.config.coordinations)) {
      return
    }

    const observableMap = {} // each visId.propId in input
    const observerMap = {} // each visId.propId in output
    for (const { data, transformations } of this.config.coordinations) {
      // 'd1' -> ['visId1.propId1', 'visId2.propId2']
      const dataMap = {}
      data.forEach(d => {
        dataMap[d.name] = d.properties
      })

      for (const { name, input, output } of transformations) {
        if (!transformLib[name]) {
          console.warn(`Compiler: transformation ${name} not defined`)
          continue
        }
        const transformation = transformLib[name]
        // populate observerMap with each visId.propId in output
        for (const o of Object.values(output)) {
          if (!Array.isArray(dataMap[o])) {
            console.warn(
              `Compiler: transformation output data ${o} not defined`
            )
            continue
          }
          for (const property of dataMap[o]) {
            if (!observerMap[property]) {
              const [visId, prop] = property.split('.')
              const visInstance = this.visualizations[visId]
              if (!visInstance) {
                console.warn(`Compiler: vis instance ${visId} not defined`)
                continue
              }
              observerMap[property] = new VisInstanceObserver(visInstance, prop)
            }
          }
        }

        // create transformation observer // THE observer
        const transformationObserver = new TransformationObserver(
          transformation,
          input,
          dataMap,
          output,
          observerMap
        )
        // populate observableMap with each visId.propId in input
        // register transformation observer
        for (const i of Object.values(input)) {
          const endCondition = current => {
            return typeof current === 'string'
          }
          const endTask = current => {
            if (!Array.isArray(dataMap[current])) {
              console.warn(
                `Compiler: transformation input data ${current} not defined`
              )
              return
            }
            for (const key of dataMap[current]) {
              const visId = key.split('.')[0]
              if (!this.visualizations[visId]) {
                console.warn(`Compiler: vis instance ${visId} not defined`)
                continue
              }
              if (!observableMap[key]) {
                observableMap[key] = new Observable()
              }
              observableMap[key].addObserver(transformationObserver)
            }
          }
          traverseObject(i, endCondition, endTask)
        }
      }
    }
    // add visprop update listeners to call observable.notify
    for (const [key, observable] of Object.entries(observableMap)) {
      const [visId, varId] = key.split('.')
      this.visualizations[visId].$on(`${varId}Update`, data => {
        observable.notify({ origin: key, data })
      })
    }
  }

  validateConfig() {
    // TODO
  }

  validateVisSpec(visualization, layout, layoutVisMap, visLib) {
    if (!visualization) {
      return false
    }

    const { id, container, visualization: visSpec } = visualization
    if (!id) {
      console.warn(`Compiler: a visualization with no id`)
      return false
    }
    if (this.visualizations[id]) {
      console.warn(`Compiler: duplicate visualization id '${id}'`)
      return false
    }
    if (!container || !layout[container]) {
      console.warn(`Compiler: no container for visualization '${id}'`)
      return false
    }
    if (layoutVisMap[container]) {
      console.warn(
        `Compiler: can't render visualization '${id}', container '${container}' already occupied`
      )
      return false
    }
    if (!visSpec || !visLib[visSpec]) {
      console.warn(`Compiler: can't find visualization definition for '${id}'`)
      return false
    }
    return true
  }
}
