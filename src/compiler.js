import resolveData from './resolveData'
import resolveLayout from './resolveLayout'
import resolveVisLib from './resolveVisLib'
import resolveTransformLib from './resolveTransformLib'

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
    this.validateConfig()

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

  coordinate(/*transformLib*/) {
    // TODO
  }

  validateConfig() {
    // TODO
  }
}
