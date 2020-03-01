const transformations = require('./transformations')
const express = require('express')
const app = express()

app.use('/data', express.static('./devBackend/data'))

app.use(express.json()) // for parsing application/json
app.post('/comp/:name', function(req, res) {
  let output
  try {
    output = transformations[req.params.name](req.body)
  } catch (e) {
    res
      .status(500)
      .send(`Server error running transformation ${req.params.name}`)
  }
  res.status(200).send(output)
})

const port = 8081
app.listen(port, () =>
  console.log(`Dev data server listening on port ${port}.`)
)
