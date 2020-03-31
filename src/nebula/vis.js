import embed from 'vega-embed'

export default class VisManger {
  constructor (datasources, spec) {
    this.vis1 = new VLScatterplot({
      data: datasources.data[0],
      selection: [],
      x: "A",
      y: "B"
    })
  }

  async init() {
    await this.vis1.init('#chart2-mount')
    
    this.vis1.selection.set([1, 2, 3, 4])
  }
}

class ReactiveProperty {
  constructor(vis, name, value, render) {
    this.vis = vis  // 所属的可视化
    this.name = name
    this.value = value
    this.render = render // value对应的render函数
    this.subs = [] // 订阅者
  }

  get() { return this.value }

  // TODO：这两个函数还得修改
  // set到底怎么触发notify最好，两次触发是vega-lite独有吗
  // set的多种方式
  // 怎么排除caller sub
  // 结合了data transformation还能否work
  // 好好考虑下

  // 外到内，接着到外
  // set可能有多种set方式，后期丰富一下
  set(value) {
    this.value = value
    this.vis[this.render](value)
    this.notify(value)
  }

  // 内到外
  notify(value) {
    console.log(value)
    this.value = value
    this.subs.forEach(sub => {
      sub.set(value)
    })
  }
}

class VLScatterplot {
  constructor(props) {
    this.vlSpec = {
      data: { name: "points", values: props.data.values },
      mark: "point",
      selection: {
        multi: { type: 'multi' },
      },
      encoding: {
        x: { field: props.x, type: 'quantitative' },
        y: { field: props.y, type: 'quantitative' },
        color: {
          condition: { selection: "multi", value: "green" },
          value: "grey"
        }
      }
    }
  }

  async init(selector) {
    this.view = (await embed(selector, this.vlSpec)).view

    this.selection = new ReactiveProperty(
      this, 'selection', 
      this.vlSpec.data.values.map((v, i) => (i + 1)),
      '_renderSelection'
    )

    // 监听数据，更新绑定的其他可视化
    // interaction
    this.view.addDataListener('multi_store', (name, value) => {
      this.selection.notify(value.map(v => v.values[0]))
    })
  }


  // 根据数据，绘制可视化
  _renderSelection(selection) {
    this.view.data('multi_store', selection.map(v => ({
      fields: [{ type: "E", field: "_vgsid_" }],
      values: [v]
    })))
    this.view.runAsync()
  }
}