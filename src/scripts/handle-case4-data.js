const fs = require('fs')
const path = require('path')
const https = require('https')

const dataPath = '../../public/data/cars-nonull.json'
const host = 'algorithms.projects.zjvis.org'

const cars = readJsonFile(path.resolve(__dirname, dataPath))

const algorithmInput = cars.map((car) =>
  Object.values(car)
    .map((v) => +v)
    .filter((v) => !isNaN(v))
)

const kmeansData = {
  input: algorithmInput,
  parameters: {
    n_clusters: 5,
  },
}

const dbscanData = {
  input: algorithmInput,
  parameters: {
    eps: 50,
    min_samples: 5,
  },
}

post({ host, path: '/cluster/kmeans' }, kmeansData, (data) => {
  const labels = data.data.labels
  const carsWithLabel = cars.map((car, i) => ({
    ...car,
    label: labels[i],
  }))
  writeJsonFile(
    path.resolve(__dirname, '../../public/data/cars-kmeans.json'),
    carsWithLabel
  )
})

post({ host, path: '/cluster/dbscan' }, dbscanData, (data) => {
  const labels = data.data.labels
  const carsWithLabel = cars.map((car, i) => ({
    ...car,
    label: labels[i],
  }))
  writeJsonFile(
    path.resolve(__dirname, '../../public/data/cars-dbscan.json'),
    carsWithLabel
  )
})

function post(options, data, callback) {
  const dataString = JSON.stringify(data)
  options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length,
    },
    ...options,
  }
  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`)
    res.setEncoding('utf8')
    res.on('data', (data) => {
      console.log(data)
      callback(JSON.parse(data))
    })
    res.on('end', () => console.log('end'))
  })

  req.on('error', (err) => {
    console.error(err)
  })

  req.write(dataString)
  req.end()
}

function writeJsonFile(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

function readJsonFile(path) {
  const file = fs.readFileSync(path)
  return JSON.parse(file)
}
