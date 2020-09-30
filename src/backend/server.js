const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const axios = require('axios')

const app = express()
const port = 7001

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
  console.log('get /, req: ', req.route)
  res.send('Hello World!')
})

app.post('/api/cars/format', async (req, res) => {
  const { clusterMethod, input, parameters, reductionMethod } = req.body
  console.log({ reductionMethod, clusterMethod, parameters })
  if (clusterMethod && input && parameters && reductionMethod) {
    const dataArray = toDataArr(input)
    const host = 'https://algorithms.projects.zjvis.org'
    const reductionResp = await axios.post(
      `${host}/reduction/${reductionMethod.toLowerCase()}`,
      { input: dataArray, parameters }
    )
    const {
      data: {
        data: { result: reductionResult },
      },
    } = reductionResp
    // console.log(reductionResult)

    const clusterResp = await axios.post(
      `${host}/cluster/${clusterMethod.replace(/-/g, '').toLowerCase()}`,
      {
        input: reductionResult,
        parameters,
      }
    )
    const {
      data: {
        data: { labels },
      },
    } = clusterResp
    console.log(labels)
    res.send({ 'labeled-data': toResultObjects(reductionResult, labels) })
  } else {
    res.send({ error: 'parameter not enough' })
  }
})

app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`)
})

function toDataArr(data) {
  const array = []
  data.forEach((d) => {
    array.push(Object.values(d).filter((v) => typeof v === 'number'))
  })
  return array
}

function toResultObjects(dataArray, labels) {
  return dataArray.map((d, i) => {
    return {
      x: d[0],
      y: d[1],
      label: labels[i],
    }
  })
}
