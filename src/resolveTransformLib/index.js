import Transformation from './Transformation'
import builtInTransformations from './builtInTransformations.json'

/**
 * Arrange transformations into a key-value map, load builtin, register custom.
 * @param {Object[]} transformConfig Array of transformations objects, each being either inline or url transformations
 * @returns {{[id: string]: Transformation}}
 */
const resolveTransform = transformConfig => {
  const transformLib = {}

  // load builtin transformations
  builtInTransformations.forEach(builtIn => {
    if (Transformation.validateSpec(builtIn)) {
      transformLib[builtIn.name] = new Transformation(builtIn)
    }
  })

  if (!Array.isArray(transformConfig)) {
    return transformLib
  }

  // register custom transformations
  for (const transformObject of transformConfig) {
    if (Transformation.validateSpec(transformObject)) {
      const { name } = transformObject
      if (transformLib[name]) {
        console.warn(`Transformations: duplicate name ${name}, ignoring.`)
        continue
      }
      transformLib[name] = new Transformation(transformObject)
    }
  }

  return transformLib
}

export default resolveTransform
