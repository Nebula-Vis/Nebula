import embed from 'vega-embed'
import ReactiveProperty from '../nebula/reactive_prop'

export default class VLScatterplot {
  constructor(props) {
    this.id = props.id
    this.vlSpec = {
      data: { name: 'points', values: props.data.values },
      mark: 'point',
      selection: {
        multi: { type: 'multi' },
      },
      encoding: {
        x: { field: props.x, type: 'quantitative' },
        y: { field: props.y, type: 'quantitative' },
        color: {
          condition: { selection: 'multi', value: 'green' },
          value: 'grey',
        },
      },
    }
  }

  async init(selector) {
    this.view = (await embed(selector, this.vlSpec)).view

    this.selection = new ReactiveProperty(
      this,
      'selection',
      this.vlSpec.data.values.map((v, i) => i + 1),
      '_renderSelection'
    )

    // 监听数据，更新绑定的其他可视化
    // interaction
    this.view.addDataListener('multi_store', (name, value) => {
      this.selection.set(value.map((v) => v.values[0]))
    })
  }

  // 根据数据，绘制可视化
  _renderSelection(selection) {
    this.view.data(
      'multi_store',
      selection.map((v) => ({
        fields: [{ type: 'E', field: '_vgsid_' }],
        values: [v],
      }))
    )
    this.view.runAsync()
  }
}
