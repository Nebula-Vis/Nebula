import _ from 'lodash'
import resolveData from './resolveData'
import resolveLayout from './resolveLayout'
import resolveVisLib from './resolveVisLib'
import resolveTransformLib from './resolveTransformLib'
import { traverseObject } from '@src/utils'

import {
  Observable,
  ObservableObserver,
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
        data: { id },
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
    const visObserverMap = {} // each visId.propId in output
    const dataMap = {}
    for (const { data, transformations } of this.config.coordinations) {
      // 'd1' -> ['visId1.propId1', 'visId2.propId2']
      const dataNameMap = {}
      data.forEach(d => {
        dataNameMap[d.name] = d.properties
      })

      //// two way data binding ////
      data.forEach(d => {
        const obs = new ObservableObserver(d.name)
        dataMap[d.name] = obs
        d.properties.forEach(p => {
          if (!observableMap[p]) {
            observableMap[p] = new Observable()
          }
          observableMap[p].addObserver(obs)
          if (!visObserverMap[p]) {
            const [visId, prop] = p.split('.')
            const visInstance = this.visualizations[visId]
            if (!visInstance) {
              console.warn(`Compiler: vis instance ${visId} not defined`)
              return
            }
            visObserverMap[p] = new VisInstanceObserver(visInstance, prop)
          }
          obs.addObserver(visObserverMap[p])
        })
      })

      if (!Array.isArray(transformations)) {
        continue
      }
      for (const { name, input, output } of transformations) {
        if (!transformLib[name]) {
          console.warn(`Compiler: transformation ${name} not defined`)
          continue
        }
        const transformation = transformLib[name]
        // create transformation observer // THE observer
        const outputMap = Array.isArray(output)
          ? output.map(o => dataMap[o])
          : _.mapValues(output, o => dataMap[o])
        const transformationObserver = new TransformationObserver(
          transformation,
          input,
          outputMap
        )
        // populate observableMap with each visId.propId in input
        // register transformation observer
        for (const i of Object.values(input)) {
          const endCondition = current => {
            return typeof current === 'string'
          }
          const endTask = current => {
            if (!dataMap[current]) {
              console.warn(
                `Compiler: transformation input data ${current} not defined`
              )
              return
            }
            dataMap[current].addObserver(transformationObserver)
          }
          traverseObject(i, endCondition, endTask)
        }
        for (const o of Object.values(output)) {
          if (!dataMap[o]) {
            console.warn(
              `Compiler: transformation output data ${o} not defined`
            )
            continue
          }
        }
      }
    }
    // add visprop update listeners to call observable.notify
    for (const [key, observable] of Object.entries(observableMap)) {
      const [visId, varId] = key.split('.')
      this.visualizations[visId].$on(`${varId}Update`, data => {
        observable.notify(data)
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
