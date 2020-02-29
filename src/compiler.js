import _ from 'lodash'
import resolveData from './resolveData'
import resolveLayout from './resolveLayout'
import resolveVisLib from './resolveVisLib'

import {
  Subject,
  OverrideObserver,
  IncrementalObserver,
  AsyncObserver,
} from './watcher'

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
    const data = await resolveData(this.config.data) // Fetch Data
    const layout = resolveLayout(this.config.layout, el) // render container
    const visLib = resolveVisLib() // load vis lib

    this.renderVisualization(data, layout, visLib) // render vis
    this.coordinate() // add coordination
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
      if (!visualization) {
        continue
      }

      const {
        id,
        container,
        visualization: visSpec,
        data: dataSpec,
        encoding,
      } = visualization

      // skip error cases
      if (!id) {
        console.warn(`Compiler: a visualization with no id`)
        continue
      }
      if (this.visualizations[id]) {
        console.warn(`Compiler: duplicate visualization id '${id}'`)
        continue
      }
      if (!container || !layout[container]) {
        console.warn(`Compiler: no container for visualization '${id}'`)
        continue
      }
      if (layoutVisMap[container]) {
        console.warn(
          `Compiler: can't render visualization '${id}', container '${container}' already occupied`
        )
        continue
      }
      if (!visSpec || !visLib[visSpec]) {
        console.warn(
          `Compiler: can't find visualization definition for '${id}'`
        )
        continue
      }

      // construct vis instance
      const VisConstructor = visLib[visSpec]
      const el = document.createElement('div')
      layout[container].appendChild(el)
      const propsData = {}
      if (dataSpec) {
        propsData.data = data[dataSpec]
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

  coordinate() {
    // TODO
  }

  // old compiler code
  constructVisualization(lib) {
    // handle components specification
    const comps = this.config.components.map(compSpec => {
      const compConstructor = lib[compSpec.visualization]
      const propsData = {
        id: compSpec.id,
        data: this.data[compSpec.data],
        selection: compSpec.selection,
        encoding: compSpec.encoding,
      }

      return {
        id: compSpec.id,
        containerId: `${compSpec.container}-mount`,
        instance: new compConstructor({ propsData }),
      }
    })

    // handle interaction specification
    const subjects = []
    for (const item of this.config.interaction) {
      // create observers
      const observers = []
      // observers without computation
      if (item.dependency) {
        item.dependency.forEach(d => {
          const destination = d
          const info = getVisualizationIdAndData(destination)
          const compIndex = getCompsIndexById(comps, info.id)
          const observer =
            item.origin instanceof Array
              ? new IncrementalObserver(info, comps[compIndex])
              : new OverrideObserver(info, comps[compIndex])
          observers.push(observer)
        })
      }
      // observers with computation
      if (item.computation) {
        const url = item.computation.url
        const param = item.computation.parameter
        const output = item.computation.output
        const observer = new AsyncObserver(url)
        for (const key of Object.keys(param)) {
          const info = getVisualizationIdAndData(param[key])
          const compIndex = getCompsIndexById(comps, info.id)
          observer.setParam(key, comps[compIndex], info)
        }
        for (const key of Object.keys(output)) {
          output[key].forEach(d => {
            const info = getVisualizationIdAndData(d)
            const compIndex = getCompsIndexById(comps, info.id)
            observer.setOutput(key, comps[compIndex], info)
          })
        }
        observers.push(observer)
      }
      // subscribe observers
      const origins = item.origin instanceof Array ? item.origin : [item.origin]
      origins.forEach(d => {
        const info = getVisualizationIdAndData(d)
        const subjectIndex = getSubjIndexByInfo(subjects, info)
        const subject =
          subjectIndex === -1 ? new Subject(info) : subjects[subjectIndex]
        if (subjectIndex === -1) subjects.push(subject)
        observers.forEach(observer => subject.subscribe(observer))
      })
    }
    // define when to call observers
    subjects.forEach(subject => {
      const compIndex = getCompsIndexById(comps, subject.info.id)
      comps[compIndex].instance.$on(`${subject.info.data}Update`, data => {
        subject.notify(data)
      })
    })

    return comps
  }
}

// old compiler code
const getVisualizationIdAndData = str => {
  const result = str.split('.')
  return {
    id: result[0],
    data: result[1],
  }
}

const getCompsIndexById = (comps, id) => {
  return _.findIndex(comps, comp => comp.id === id)
}

const getSubjIndexByInfo = (subjects, info) => {
  return _.findIndex(
    subjects,
    d => d.info.id === info.id && d.info.data === info.data
  )
}
