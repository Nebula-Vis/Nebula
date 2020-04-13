import TransformationsManager from '../transformations/'
export default class TransformationsSpecParser {
  constructor(spec) {
    if (spec) {
      this._spec = spec
      this._transformations = this._spec.map((transformation) => transformation)
    }
  }

  getTransformationsManager() {
    const transformationsManager = new TransformationsManager()

    if (this._transformations) {
      for (const transformation of this._transformations) {
        transformationsManager.addExternalTransformations(transformation)
      }
    }

    return transformationsManager
  }
}
