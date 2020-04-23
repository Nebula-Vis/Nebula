const fs = require('fs')
const path = require('path')
const https = require('https')
const _ = require('lodash')

const dataPath = '../../public/data/cars-nonull.json'
const host = 'algorithms.projects.zjvis.org'

const cars = readJsonFile(path.resolve(__dirname, dataPath))

const vectorArray = cars.map((car) => [+car.Horsepower, +car.Acceleration])

// normalize by minmax
_.range(0, vectorArray[0].length).forEach((col) => {
  const min = _.minBy(vectorArray, (car) => car[col])[col]
  const max = _.maxBy(vectorArray, (car) => car[col])[col]
  console.log(col, min, max)
  vectorArray.forEach((car) => (car[col] = (car[col] - min) / (max - min)))
})

const kmeansData = {
  input: vectorArray,
  parameters: {
    n_clusters: 4,
  },
}

const dbscanData = {
  input: vectorArray,
  parameters: {
    eps: 0.05,
    min_samples: 10,
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
