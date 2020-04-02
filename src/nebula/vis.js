import test1 from '../visualizations/test1'
import test2 from '../visualizations/test2'

export default class VisManger {
  constructor (datasources, spec) {
    this.vis3 = new test1({
      id: 'vis3',
      el: '#chart3-mount',
      data: datasources.data[0],
      x: "A",
      y: "B"
    })

    this.vis2 = new test2({
      id: 'vis2',
      data: datasources.data[0],
      x: "A",
      y: "B"
    })

    this.vis1 = new test1({
      id: 'vis1',
      el: '#chart1-mount',
      data: datasources.data[0],
      x: "A",
      y: "B"
    })
  }

  async init() {
    await this.vis2.init('#chart2-mount')

    this.vis1.selection.addSub(this.vis3.selection)
    this.vis1.selection.addSub(this.vis2.selection)
    this.vis2.selection.addSub(this.vis1.selection)
    this.vis3.selection.addSub(this.vis1.selection)
    
    // this.vis1.selection.set([1, 2, 3])
    // this.vis2.selection.set([1, 2, 3, 4])
  }
}



