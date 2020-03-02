import axios from 'axios'

export default class Transformation {
  /**
   * Constructs a transformation
   * @param {{
   *   name: string;
   *   url: string;
   *   parameters: { name: string; type: string }[];
   *   output: { name: string; type: string }[];
   * }} transformConfig Specification of config
   */
  constructor(spec) {
    this._isValid = Transformation.validateSpec(spec)
    if (!this._isValid) {
      console.warn(`Transformation: invalid spec of ${spec && spec.name}.`)
    } else {
      ;({
        name: this._name,
        url: this._url,
        parameters: this._parameters,
        output: this._output,
      } = spec)
    }
  }

  get name() {
    return this._name
  }

  get spec() {
    return {
      name: this._name,
      url: this._url,
      parameters: this._parameters,
      output: this._output,
    }
  }

  /**
   * Execute the transformation with given parameters
   * @param {Array|Object} parameters transformation parameters
   * @returns {Promise<Object>}
   */
  async run(parameters) {
    if (!this._isValid) {
      return
    }
    // handle Array|Object parameters format
    const bodyData = this.getObjectParameter(parameters)

    // // check param type
    // this._parameters.forEach(p => {
    //   if (!this.isCorrectType(bodyData[p.name], p.type)) {
    //     console.warn(
    //       `Transform: wrong paramter type for ${p.name} of transformation ${
    //         this._name
    //       }, expected ${p.type}, got ${typeof bodyData[p.name]}`
    //     )
    //   }
    // })

    // fetch output // TODO replace naive post method
    const output = await axios
      .post(this._url, bodyData)
      .then(res => res.data)
      .catch(() => {
        console.error(`Transform: error executing ${this._name}`)
      })

    // // check output type
    // this._output.forEach(o => {
    //   if (!this.isCorrectType(output[o.name], o.type)) {
    //     console.warn(
    //       `Transform: got wrong output property type for ${
    //         o.name
    //       } of transformation ${this._name}, expected ${
    //         o.type
    //       }, got ${typeof output[o.name]}`
    //     )
    //   }
    // })

    return output
  }

  static validateSpec(spec) {
    if (!spec) {
      return false
    }
    const { name, url, parameters, output } = spec
    if (typeof name !== 'string' || !name) {
      return false
    }
    if (typeof url !== 'string' || !url) {
      return false
    }
    if (
      !Array.isArray(parameters) ||
      !parameters.every(p => typeof p === 'string' && !!p)
    ) {
      return false
    }
    if (
      !Array.isArray(output) ||
      !output.every(o => typeof o === 'string' && !!o)
    ) {
      return false
    }

    return true
  }

  /**
   * Check if value is of `type` type
   * @param {any} value the value to be checked
   * @param {string} type the type to check against
   * @returns {boolean}
   */
  isCorrectType(value, type) {
    // TODO smarter check
    if (type.toLowerCase() === 'array') {
      return Array.isArray(value)
    }
    return typeof value === type
  }

  /**
   * Converts parameter to object
   * @param {Array|Object} parameters transformation parameters
   * @returns {Object}
   */
  getObjectParameter(parameters) {
    if (!Array.isArray(parameters)) {
      return parameters
    }
    const obj = {}
    for (const [i, param] of parameters.entries()) {
      obj[this._parameters[+i].name] = param
    }
    return obj
  }

  /**
   * Converts outout to object
   * @param {Array|Object} output transformation outout
   * @returns {Object}
   */
  getObjectOuput(output) {
    if (!Array.isArray(output)) {
      return output
    }
    const obj = {}
    for (const [i, out] of output.entries()) {
      obj[this._output[+i].name] = out
    }
    return obj
  }
}
