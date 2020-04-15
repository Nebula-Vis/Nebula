export default class CoordinationConstructor {
  constructor() {}

  // 基于low level coordinatioin objects，构建coordination
  constructCoordination(coordination) {
    for (const dataName in coordination.data)
      this._addLinksInData(coordination.data[dataName])

    if (coordination.transformation) {
      this._addLinksInTransformation(
        coordination.data,
        coordination.transformation
      )
    }
  }

  _addLinksInData({ sources, dependencies }) {
    // handle sources
    for (const source1 of sources) {
      for (const source2 of sources) {
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
    if (dependencies) {
      for (const source of sources) {
        for (const dep of dependencies) {
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
        data[paramValue].sources.forEach((d) => {
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
  }

  // _addBidirectionalLinkInTwoProps(prop1, prop2) {
  //   prop1.addSub(prop2)
  //   prop2.addSub(prop1)
  // }

  _addUnidirectionalLinkInTwoProps(origin, destination) {
    origin.addSub(destination)
  }
}
