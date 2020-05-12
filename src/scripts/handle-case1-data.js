const fs = require('fs')
const path = require('path')

const dataPath = '../../public/data/movies.json'

const file = fs.readFileSync(path.resolve(__dirname, dataPath))
const movies = JSON.parse(file)

const distributors = {}

movies.forEach((movie) => {
  let distributor = distributors[movie.Distributor]
  if (!distributor) {
    distributor = distributors[movie.Distributor] = {
      distributor: movie.Distributor,
      movies: [],
      gross: 0,
    }
  }
  distributor.movies.push(movie)
  distributor.gross += movie.Worldwide_Gross
})

const topDistributors = Object.values(distributors)
  .sort((distributor1, distributor2) => distributor2.gross - distributor1.gross)
  .slice(0, 3)

topDistributors.forEach((distributor) => {
  distributor.movies.sort(
    (movie1, movie2) =>
      new Date(movie2.Release_Date) - new Date(movie1.Release_Date)
  )
})

topDistributors.forEach((distributor, i) => {
  fs.writeFileSync(
    path.resolve(
      __dirname,
      `../../public/data/movies-${i + 1}-${distributor.distributor
        .split(' ')
        .join('')}.json`
    ),
    JSON.stringify(distributor.movies, null, 2)
  )
})
