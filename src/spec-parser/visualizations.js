import Scatterplot from '@/visualizations/scatter-plot'
import Areachart from '@/visualizations/area-chart'
import Barchart from '@/visualizations/bar-chart'
import LineUp from '@/visualizations/line-up'
import Linechart from '@/visualizations/line-chart'
import NodeLinkGraph from '@/visualizations/node-link-graph'
import Select from '@/visualizations/select'
import Button from '@/visualizations/button'
import Input from '@/visualizations/input'
import Slider from '@/visualizations/slider'
import VegaLite from '@/visualizations/vega-lite'
import PieChart from '@/visualizations/pie-chart'
import DonutChart from '@/visualizations/donut-chart'
import SectorChart from '@/visualizations/sector-chart'
import SunburstChart from '@/visualizations/sunburst-chart'
import Map from '@/visualizations/Map'
import Heatmap2D from '@/visualizations/heatmap-2D'
import Tree from '@/visualizations/tree'
import TreeMap from '@/visualizations/tree-map'
import ParallelCoordinates from '@/visualizations/parallel-coordinates'
import RadialCoordinates from '@/visualizations/radial-coordinates'
import ReactiveProperty from '@/reactive-prop'

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
    const props = { ...this._propsSpec, id: this._id }
    if (props.data) {
      if (this._type.toLowerCase() === 'vegalite') {
        const data = dataSources.getDataSourceByName(props.data.name)
        if (!data) throw new SyntaxError(`No such data ${props.data.name}.`)
        props.data.values = data.values ? data.values : data
      } else {
        const data = dataSources.getDataSourceByName(props.data)
        if (!data) throw new SyntaxError(`No such data ${props.data}.`)
        props.data = data.values ? data.values : data
      }
    }
    this._instance = this._generateInstance(this._type, props)
  }

  _generateInstance(type, props) {
    switch (type.toLowerCase()) {
      case 'scatterplot':
        return new Scatterplot(props)
      case 'areachart':
        return new Areachart(props)
      case 'barchart':
        return new Barchart(props)
      case 'lineup':
        return new LineUp(props)
      case 'linechart':
        return new Linechart(props)
      case 'graph':
        return new NodeLinkGraph(props)
      case 'select':
        return new Select(props)
      case 'tree':
        return new Tree(props)
      case 'treemap':
        return new TreeMap(props)
      case 'parallel':
        return new ParallelCoordinates(props)
      case 'radial':
        return new RadialCoordinates(props)
      case 'button':
        return new Button(props)
      case 'input':
        return new Input(props)
      case 'slider':
        return new Slider(props)
      case 'vegalite':
        return new VegaLite(props)
      case 'piechart':
        return new PieChart(props)
      case 'donutchart':
        return new DonutChart(props)
      case 'sectorchart':
        return new SectorChart(props)
      case 'sunburstchart':
        return new SunburstChart(props)
      case 'map':
        return new Map(props)
      case 'heatmap2d':
        return new Heatmap2D(props)
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
    if (!value) {
      throw new Error(
        `Visualization: no vis.prop in ${this._instance.constructor.name} matches ${action} ${option}`
      )
    }
    return `${this._id}.${value.name}`
  }
}
