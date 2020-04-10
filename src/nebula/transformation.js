// TODO：健壮处理
export default class ExternalTransformation {
  constructor(name, url, parameters, output) {
    this.name = name
    this.url = url
    this.paramNames = parameters
    this.outputNames = output
  }

  // TODO: v转化为coordination中的data
  async run(input) {
    let param = {}
    if (input instanceof Array)
      // ordered list input
      input.forEach((v, i) => {
        param[this.paramNames[i]] = v
      })
    // key-value input
    else param = input

    const resp = await fetch(this.url, {
      method: 'POST',
      body: param,
    })
    const result = resp.json()

    // 返回两个数组，匹配的话外面可以做
    return {
      keys: this.outputNames,
      values: this.outputNames.map((v) => result[v]),
    }
  }
}
