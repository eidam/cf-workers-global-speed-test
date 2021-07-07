import { Router } from 'itty-router'

// export of the Durable Object class
export { GlobalSpeedTestDurableObject } from './tests.mjs'
export { GlobalSpeedTestDurableObjectRegistry } from './registry.mjs'

// API Worker
export default {
  async initialize() {
    const router = Router({
      base: '/api',
    })
    // POST - create a new test and DO instance
    router.post('/tests', (req, env) => this.handleCreateTest(req, env))

    // GET - open websocket connection and get tests results
    router.get('/tests/:testId', (req, env) =>
      this.handleGetTestResults(req, env),
    )

    // GET - get test metadata
    router.get('/registry/:testId', (req, env) =>
      this.handleGetRegistry(req, env),
    )

    // PATCH - perform test on the Worker and save results to DO
    router.patch('/tests/:testId', (req, env) =>
      this.handlePerformTest(req, env),
    )

    router.all('*', req => new Response(null, { status: 404 }))
    this.router = router
  },

  async fetch(req, env) {
    if (!this.initializePromise) {
      this.initializePromise = this.initialize()
    }
    await this.initializePromise
    return this.router.handle(req, env)
  },

  // POST - create a new DO instance and return its ID
  async handleCreateTest(req, env) {
    const url = new URL(req.url).searchParams.get('url')
    if (!url) {
      return new Response("missing 'url' parameter")
    }

    const id = env.DO_GLOBAL_SPEED_TEST.newUniqueId()

    // persist all the DO ids in case we want to delete them in the future
    const registry = env.DO_GLOBAL_SPEED_TEST_REGISTRY.idFromName('registry')
    const registryStub = env.DO_GLOBAL_SPEED_TEST_REGISTRY.get(registry)

    const newTestRes = await registryStub.fetch(
      `/api/registry/${id.toString()}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          url,
        }),
      },
    )

    return new Response(await newTestRes.text(), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  },

  // GET - pass websocket through to DO
  async handleGetTestResults(req, env) {
    if (req.headers.get('Upgrade') != 'websocket') {
      return new Response('Expected websocket', { status: 400 })
    }

    const { testId } = req.params

    const id = env.DO_GLOBAL_SPEED_TEST.idFromString(testId)
    const stub = env.DO_GLOBAL_SPEED_TEST.get(id)

    return stub.fetch(req)
  },

  async handleGetRegistry(req, env) {
    // persist all the DO ids in case we want to delete them in the future
    const registry = env.DO_GLOBAL_SPEED_TEST_REGISTRY.idFromName('registry')
    const registryStub = env.DO_GLOBAL_SPEED_TEST_REGISTRY.get(registry)

    return registryStub.fetch(req)
  },

  // PATCH - perform test and send response to DO
  async handlePerformTest(req, env) {
    const { testId } = req.params

    const registry = env.DO_GLOBAL_SPEED_TEST_REGISTRY.idFromName('registry')
    const registryStub = env.DO_GLOBAL_SPEED_TEST_REGISTRY.get(registry)

    const testRes = await registryStub.fetch(`/api/registry/${testId}`)
    const testMetadata = await testRes.json()

    if (!testMetadata.id) {
      return new Response(null, { status: 404 })
    }

    const id = env.DO_GLOBAL_SPEED_TEST.idFromString(testMetadata.id)
    const stub = env.DO_GLOBAL_SPEED_TEST.get(id)

    const testRegion = req.headers.get('x-test-region')
    const testLocation = await this.getWorkerLocation()

    if (!testMetadata.url || !testRegion) {
      return new Response("missing 'url' in metadata or 'region' header")
    }

    // Perform a check and measure time
    const init = {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'cf-workers-global-speed-test (+https://github.com/eidam/cf-workers-global-speed-test)',
      },
    }

    const testRequestStartTime = Date.now()
    const testResponse = await fetch(testMetadata.url, init)
    const testRequestTime = Math.round(Date.now() - testRequestStartTime)

    return stub.fetch(req, {
      method: 'PATCH',
      body: JSON.stringify({
        region: testRegion,
        redirected: testResponse.redirected,
        status: testResponse.status,
        statusText: testResponse.statusText,
        headers: Object.fromEntries(testResponse.headers),
        time: testRequestTime,
        location: testLocation,
      }),
    })
  },

  async getWorkerLocation() {
    const res = await fetch('https://cloudflare-dns.com/dns-query', {
      method: 'OPTIONS',
    })
    return res.headers.get('cf-ray').split('-')[1]
  },
}
