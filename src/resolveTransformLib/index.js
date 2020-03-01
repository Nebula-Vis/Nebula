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
    transformLib[name] = new Transformation(builtIn)
  })

  if (!Array.isArray(transformConfig)) {
    return transformLib
  }

  // register custom transformations
  for (const transformObject of transformConfig) {
    if (!transformObject) {
      continue
    }

    const { name, url, parameters, output } = transformObject

    // skip invalid cases
    if (!name) {
      console.warn('Transformations: custom transformation name not specified')
      continue
    }
    if (transformLib[name]) {
      console.warn(`Transformations: duplicate name ${name}, ignoring.`)
      continue
    }
    if (!url || !Array.isArray(parameters) || !Array.isArray(output)) {
      console.warn(`Transformations: wrong spec of ${name}, ignoring.`)
      continue
    }

    transformLib[name] = new Transformation(transformObject)
  }

  return transformLib
}

export default resolveTransform
