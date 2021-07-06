import { Router } from 'itty-router'

export class GlobalSpeedTestDurableObjectRegistry {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.storage = state.storage
  }

  async initialize() {
    try {
      const router = Router({
        base: '/api',
      })

      router.put('/registry/:testId', req => this.handleRegisterTest(req))
      router.get('/registry/:testId', req => this.handleGetTest(req))

      router.all('*', req => new Response(null, { status: 404 }))
      this.router = router
    } catch (err) {
      // If anything throws during initialization then we
      // need to be sure that a future request will retry by
      // creating another `initializePromise` below.
      this.initializePromise = undefined
      throw err
    }
  }

  async fetch(req) {
    // Make sure we're fully initialized from storage.
    if (!this.initializePromise) {
      this.initializePromise = this.initialize()
      // `state.waitUntil` ensures that the `initializePromise`
      // will run to completion even if the request that created
      // it ends (e.g. the client disconnects before the `await`
      // below completes).
      this.state.waitUntil(this.initializePromise)
    }
    await this.initializePromise

    try {
      // @ts-ignore
      return this.router.handle(req)
    } catch (e) {
      return new Response(JSON.stringify(e), { status: 500 })
    }
  }

  async handleRegisterTest(req) {
    const body = await req.json()
    const { testId } = req.params

    const test = {
      id: testId,
      url: body.url,
    }

    await this.storage.put(testId, JSON.stringify(test))
    return new Response(JSON.stringify(test), { status: 200 })
  }

  async handleGetTest(req) {
    const { testId } = req.params
    const test = await this.storage.get(testId)
    return new Response(test, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
