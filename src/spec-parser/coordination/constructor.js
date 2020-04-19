import ReactiveProperty from '../../reactive-prop'

export default class CoordinationConstructor {
  constructor() {}

  // 基于low level coordinatioin objects，构建coordination
  constructCoordination(coordination) {
    for (const dataName in coordination.dataVisualization)
      this._addLinksInData(coordination.dataVisualization[dataName])

    if (coordination.transformation) {
      this._addLinksInTransformation(
        coordination.dataVisualization,
        coordination.transformation
      )
    }
  }

  _addLinksInData({ bidirectionalBind, unidirectionalBind }) {
    // handle sources
    for (const source1 of bidirectionalBind) {
      for (const source2 of bidirectionalBind) {
        if (source1.rawStr !== source2.rawStr) {
          if (source1.prop && source2.prop)
            this._addUnidirectionalLinkInTwoProps(source1.prop, source2.prop)
          else
            throw new SyntaxError(
              `No such properties ${source1.prop}, ${source2.prop}`
            )
        }
      }
    }

    // handle dependencies
    if (unidirectionalBind) {
      for (const source of bidirectionalBind) {
        for (const dep of unidirectionalBind) {
          if (source.prop && dep.prop)
            this._addUnidirectionalLinkInTwoProps(source.prop, dep.prop)
          else
            throw new SyntaxError(
              `No such properties ${source.prop}, ${dep.prop}`
            )
        }
      }
    }
  }

  _addLinksInTransformation(data, transformation) {
    const instance = transformation.instance
    // handle input
    for (const paramName in transformation.input) {
      const reactivePropInTransformation = instance[paramName]
      const paramValue = transformation.input[paramName]

      if (typeof paramValue == 'string' && paramValue in data) {
        // Declared data: 构建依赖
        data[paramValue].bidirectionalBind.forEach((d) => {
          this._addUnidirectionalLinkInTwoProps(
            d.prop,
            reactivePropInTransformation
          )
        })
      } else {
        // Literal：直接赋值
        reactivePropInTransformation.set(paramValue)
      }
    }

    // handle output
    for (const paramName in transformation.output) {
      const reactivePropInTransformation = instance[paramName]
      const paramValue = transformation.output[paramName] // array

      paramValue.forEach((param) => {
        this._addUnidirectionalLinkInTwoProps(
          reactivePropInTransformation,
          param.prop
        )
      })
    }

    // handle triggers
    if (transformation.triggers !== 'any') {
      transformation.instance.trigger = new ReactiveProperty(
        transformation.instance,
        'trigger',
        false,
        'run'
      )
      transformation.triggers.addSub(transformation.instance.trigger)
    }
  }

  // _addBidirectionalLinkInTwoProps(prop1, prop2) {
  //   prop1.addSub(prop2)
  //   prop2.addSub(prop1)
  // }

  _addUnidirectionalLinkInTwoProps(origin, destination) {
    origin.addSub(destination)
  }
}
