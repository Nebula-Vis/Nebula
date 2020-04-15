import Scatterplot from '../visualizations/scatterplot'
import Areachart from '../visualizations/area_chart'
import LineUp from '../visualizations/line_up'
import NodeLinkGraph from '../visualizations/node_link_graph'
import Select from '../visualizations/select'
import Button from '../visualizations/button'
import Input from '../visualizations/input'
import Slider from '../visualizations/slider'
import ReactiveProperty from '../reactive-prop'

export default class VisualizationsSpecParser {
  constructor(dataSources, layout, spec) {
    this._dataSources = dataSources
    this._layout = layout

    if (!spec) throw new TypeError('No visualizations specification.')
    this._spec = spec
  }

  getVisualizationsManager() {
    const visualizations = []
    const visualizationIds = []
    for (const visualizationSpec of this._spec) {
      if (visualizationIds.indexOf(visualizationSpec.id) >= 0)
        throw new SyntaxError(
          `Repeated visualization id ${visualizationSpec.id}.`
        )
      visualizationIds.push(visualizationSpec.id)
      // handle container spec
      const gridsIntervalPattern = /\d+ \d+ \d+ \d+/
      if (visualizationSpec.container.match(gridsIntervalPattern)) {
        // container 是 gridInterval
        const containerName = `_container_${visualizationSpec.id}`
        this._layout.addContainer(containerName, visualizationSpec.container)
        visualizations.push(
          new Visualization(
            visualizationSpec.id,
            containerName,
            visualizationSpec.visualization,
            visualizationSpec.props
          )
        )
      } else {
        // container 是 id
        if (!this._layout.isContainerNameExist(visualizationSpec.container))
          throw new SyntaxError(
            `No such container ${visualizationSpec.container}`
          )
        visualizations.push(
          new Visualization(
            visualizationSpec.id,
            visualizationSpec.container,
            visualizationSpec.visualization,
            visualizationSpec.props
          )
        )
      }
    }
    return new VisualizationsManager(this._dataSources, visualizations)
  }
}

class VisualizationsManager {
  constructor(dataSources, visualizations) {
    this._dataSources = dataSources
    this._visualizations = visualizations
  }

  init() {
    this._visualizations.forEach((visualization) => {
      visualization.init(this._dataSources)
    })
  }

  mount() {
    this._visualizations.forEach((visualization) => {
      visualization.mount()
    })
  }

  getVisualizationById(id) {
    return this._visualizations.filter((visualization) => {
      return id === visualization.getId()
    })[0]
  }

  getVisualizationsByIds(ids) {
    return this._visualizations.filter((visualization) => {
      return ids.includes(visualization.getId())
    })
  }

  getAllVisualizations() {
    return this._visualizations.map((visualization) => visualization)
  }

  getAllVisualizationIds() {
    return this._visualizations.map((visualization) => visualization.getId())
  }
}

class Visualization {
  constructor(id, container, type, propsSpec) {
    this._id = id
    this._container = container
    this._type = type
    this._propsSpec = propsSpec
    this._instance = null
  }

  getId() {
    return this._id
  }

  init(dataSources) {
    const props = { ...this._propsSpec }
    if (props.data) {
      const data = dataSources.getDataSourceByName(props.data)
      if (!data) throw new SyntaxError(`No such data ${props.data}.`)
      props.data = data.values ? data.values : data
    }
    this._instance = this._generateInstance(this._type, props)
  }

  _generateInstance(type, props) {
    switch (type.toLowerCase()) {
      case 'scatterplot':
        return new Scatterplot(props)
      case 'areachart':
        return new Areachart(props)
      case 'lineup':
        return new LineUp(props)
      case 'graph':
        return new NodeLinkGraph(props)
      case 'select':
        return new Select(props)
      case 'button':
        return new Button(props)
      case 'input':
        return new Input(props)
      case 'slider':
        return new Slider(props)
      default:
        throw new SyntaxError(`No such visualization ${type.toLowerCase()}.`)
    }
  }

  mount() {
    this._instance.mount(this._container)
  }

  getVisPropByActionOption(action, option) {
    if (!this._instance) {
      throw new Error(`Visualization: init ${this._id} before accessing prop`)
    }
    const value = Object.values(this._instance)
      .filter((value) => value instanceof ReactiveProperty)
      .find((value) => value.action === action && value.option === option)
    return `${this._id}.${value.name}`
  }
}
