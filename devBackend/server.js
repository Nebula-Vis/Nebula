const express = require('express')
const app = express()

const port = 8081
app.use('/data', express.static('./devBackend/data'))
app.listen(port, () =>
  console.log(`Dev data server listening on port ${port}.`)
)
