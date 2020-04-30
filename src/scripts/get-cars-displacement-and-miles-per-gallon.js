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

writeJsonFile(
  path.resolve(__dirname, '../../public/data/cars-vector-array.json'),
  vectorArray
)

function writeJsonFile(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

function readJsonFile(path) {
  const file = fs.readFileSync(path)
  return JSON.parse(file)
}
