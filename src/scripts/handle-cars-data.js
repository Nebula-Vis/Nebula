const fs = require('fs')
const path = require('path')

const dataPath = '../../public/data/cars.json'

const file = fs.readFileSync(path.resolve(__dirname, dataPath))
const cars = JSON.parse(file)

const noNullCars = cars.filter((car) =>
  Object.values(car).every((value) => value !== null)
)

fs.writeFileSync(
  path.resolve(__dirname, '../../public/data/cars-nonull.json'),
  JSON.stringify(noNullCars, null, 2)
)
