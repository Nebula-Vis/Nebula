const fs = require('fs')
const path = require('path')
const csvParse = require('csv-parse/lib/sync')
const _ = require('lodash')

const dataPath = '../../public/data/total-cases-covid-19.csv'
const writePath = '../../public/data/total-cases-covid-19-by-continent.json'

const file = fs.readFileSync(path.resolve(__dirname, dataPath))
const records = csvParse(file, { columns: true, skip_empty_lines: true })

const continents = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
]

const continentRecords = records
  .filter((record) => continents.includes(record.Entity))
  .map((record) => _.mapValues(record, (val) => (isNaN(+val) ? val : +val)))

fs.writeFileSync(
  path.resolve(__dirname, writePath),
  JSON.stringify(continentRecords, null, 2)
)
