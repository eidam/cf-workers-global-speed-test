const express = require('express')
const fetch = require('node-fetch')
const app = express()
const port = process.env.PORT || 3000

app.get('/', async (req, res) => {
  if (process.env.SECRET && !req.header("x-global-test-secret")?.includes(process.env.SECRET)) {
    res.sendStatus(401)
    return
  }

  const url = req.query.url
  if (!url) {
    res.sendStatus(400)
    return
  }

  const init = {
    // These properties are part of the Fetch Standard
    method: 'PATCH',
    headers: {
        'User-Agent': 'cf-workers-global-speed-test (+https://github.com/eidam/cf-workers-global-speed-test)',
        'x-test-region': process.env.REGION
    },
    body: null,
    redirect: 'manual',

    // The following properties are node-fetch extensions
    follow: 0, // maximum redirect count. 0 to not follow redirect
    timeout: 20000, // req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies). Signal is recommended instead.
    compress: true, // support gzip/deflate content encoding. false to disable
  }

  const response = await fetch(url, init)

  res.send({
    status: response.status,
    region: process.env.REGION,
  })
})

app.listen(port, () => {
  console.log(`Proxy server listening at http://localhost:${port}`)
})
