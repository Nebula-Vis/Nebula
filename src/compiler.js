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
    const config = this.validateConfig()
    if (!config) {
      return
    }
    this.config = config

    const data = await resolveData(this.config.data) // Fetch Data
    const layout = resolveLayout(this.config.layout, el) // render container
    const visLib = resolveVisLib() // load vis lib
    this.renderVisualization(data, layout, visLib) // render vis

    const { coordinations, transformations } = this.config
    if (coordinations) {
      // load transformation lib
      const transformLib = resolveTransformLib(transformations)
      // add coordination
      this.coordinate(transformLib)
    }
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
      if (
        !this.validateVisSpec(visualization, layout, layoutVisMap, visLib, data)
      ) {
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
      if (dataSpec && data[dataSpec]) {
        propsData.data = data[dataSpec]
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
    const observableMap = {} // each visId.propId in input
    const visObserverMap = {} // each visId.propId in output
    const dataMap = {}
    for (const [i, coordination] of this.config.coordinations.entries()) {
      if (!this.validateCoordination(coordination)) {
        continue
      }
      const { data, transformations } = coordination
      // 'd1' -> ['visId1.propId1', 'visId2.propId2']
      const dataNameMap = this.getCoordinationDataMap(data, i)

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
            visObserverMap[p] = new VisInstanceObserver(visInstance, prop)
          }
          obs.addObserver(visObserverMap[p])
        })
      })

      if (!Array.isArray(transformations)) {
        continue
      }
      for (const transformSpec of transformations) {
        if (
          !this.validateTransformSpec(transformSpec, transformLib, dataNameMap)
        ) {
          continue
        }
        const { name, input, output } = transformSpec
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
        // register transformation observer
        for (const i of Object.values(input)) {
          const endCondition = current => {
            return typeof current === 'string'
          }
          const endTask = current => {
            if (!dataMap[current]) {
              // TODO pass data between transformations
              return
            }
            dataMap[current].addObserver(transformationObserver)
          }
          traverseObject(i, endCondition, endTask)
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
    if (!(this.config instanceof Object)) {
      console.error(`Config Validation Error: config is not an object`)
      return false
    }

    const configKeys = Object.keys(this.config)
    const lackingKeys = ['data', 'layout', 'visualizations'].filter(
      key => !configKeys.includes(key)
    )
    if (lackingKeys.length !== 0) {
      console.error(
        `Config Validation Error: config lacks required fields ${lackingKeys.join(
          ','
        )}`
      )
      return false
    }

    const {
      data,
      layout,
      visualizations,
      coordinations,
      transformations,
    } = this.config

    const config = { ...this.config }

    if (!Array.isArray(data)) {
      console.error(`Config Validation: config.data is not array`)
      return false
    }
    if (typeof layout !== 'object') {
      console.error(`Config Validation: config.layout is not object`)
      return false
    }
    if (!Array.isArray(visualizations)) {
      console.error(`Config Validation: config.visualizations is not array`)
      return false
    }
    if (coordinations && !Array.isArray(coordinations)) {
      console.warn(
        `Config Validation: config.coordinations is not array, ignore.`
      )
      config.coordinations = null
    }
    if (transformations && !Array.isArray(transformations)) {
      console.warn(
        `Config Validation: config.transformations is not array, ignore`
      )
      config.transformations = null
    }
    return config
  }

  validateVisSpec(visualization, layout, layoutVisMap, visLib, dataLib) {
    if (!visualization) {
      return false
    }

    const { id, container, visualization: visSpec, data } = visualization
    if (!id) {
      console.warn(`Compiler: a visualization with no id`)
      return false
    }
    if (this.visualizations[id]) {
      console.warn(`Compiler: duplicate visualization id '${id}', ignore`)
      return false
    }
    if (!container || !layout[container]) {
      console.warn(`Compiler: no container for visualization '${id}', ignore`)
      return false
    }
    if (layoutVisMap[container]) {
      console.warn(
        `Compiler: can't render visualization '${id}', container '${container}' already occupied, ignore`
      )
      return false
    }
    if (!visSpec || !visLib[visSpec]) {
      console.warn(
        `Compiler: can't find visualization definition for '${id}', ignore`
      )
      return false
    }
    if (data && !dataLib[data]) {
      console.warn(
        `Compiler: data ${data} for visualization ${id} not defined, ignore`
      )
    }
    return true
  }

  validateCoordination(coordination) {
    if (!coordination) {
      return false
    }
    const { data, transformations } = coordination
    if (!data) {
      console.warn(`Compiler: a coordination with no data field, ignore`)
      return false
    }
    if (!Array.isArray(data)) {
      console.warn(`Compiler: coordination.data is not array, ignore`)
      return false
    }
    if (transformations && !Array.isArray(transformations)) {
      console.warn(`Compiler: coordination.coordinations is not array, ignore.`)
      coordination.transformations = null
    }
    return true
  }

  getCoordinationDataMap(data, i) {
    const dataMap = {}
    data.forEach(d => {
      if (!d) {
        return
      }
      if (typeof d.name !== 'string') {
        console.warn(
          `Compiler: data with no name in ${i}th coordination, ignore`
        )
        return
      }
      if (dataMap[d.name] !== undefined) {
        console.warn(
          `Compiler: duplicate data name ${d.name} in ${i}th coordination, ignore`
        )
        return
      }
      if (!Array.isArray(d.properties)) {
        console.warn(
          `Compiler: data ${d.name} with no properties in ${i}th coordination, ignore`
        )
        return
      }
      const validProperties = d.properties.filter(p => {
        if (typeof p !== 'string') {
          return false
        }
        const visId = p.split('.')[0]
        if (!this.visualizations[visId]) {
          return false
        }
        return true
      })
      dataMap[d.name] = validProperties
    })
    return dataMap
  }

  validateTransformSpec(transformSpec, transformLib, dataMap) {
    if (!transformSpec) {
      return false
    }
    const { name, input, output } = transformSpec
    if (typeof name !== 'string') {
      return false
    }
    if (!transformLib[name]) {
      return false
    }
    if (!input || !(input instanceof Object)) {
      return false
    }
    if (!output || !(output instanceof Object)) {
      return false
    }
    for (const i of Object.values(input)) {
      const endCondition = current => {
        return typeof current === 'string'
      }
      const endTask = current => {
        if (!dataMap[current]) {
          // TODO pass data between transformations?
          console.warn(
            `Compiler: transformation input data ${current} not defined`
          )
        }
      }
      traverseObject(i, endCondition, endTask)
    }

    for (const o of Object.values(output)) {
      if (!dataMap[o]) {
        // TODO pass data between transformations?
        console.warn(`Compiler: transformation output data ${o} not defined`)
      }
    }

    return true
  }
}
