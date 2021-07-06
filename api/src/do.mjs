import { Router } from 'itty-router'
import regions from './../data/regions.json'

export class GlobalSpeedTestDurableObject {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.storage = state.storage
    this.memoryState = {}
  }

  // Initialize Durable Object, load the whole state from storage and prepare sessions for Websockets
  async initialize() {
    try {
      let storedState = await this.storage.list()
      // @ts-ignore
      this.memoryState = Object.fromEntries(storedState) || {}

      // We will put the WebSocket objects for each client, along with some metadata, into `sessions`.
      this.sessions = []

      const router = Router({
        base: '/api',
      })

      router.patch('/tests/:testId', req => this.handleIntake(req))
      router.get('/tests/:testId', req => this.handleWebsockets(req))

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

  async handleIntake(req) {
    const body = await req.json()

    this.memoryState[body.region] = { ...body }
    this.broadcast(this.memoryState[body.region])

    // persist the result
    this.state.waitUntil(this.storage.put(body.region, this.memoryState[body.region]))

    return new Response(JSON.stringify(this.memoryState[body.region]), {
      status: 200,
    })
  }

  async handleWebsocketMessage() {
    Object.keys(regions).map(region => {
      if (this.memoryState[region]) {
        this.broadcast(this.memoryState[region])
      } else {
        this.state.waitUntil(
          fetch(
            `${regions[region]}?url=${encodeURIComponent(
              `https://global-speed-test.eidam.dev/api/tests/${this.testId}`,
            )}`,
          ),
        )
      }
    })
  }

  async handleWebsockets(req) {
    this.testId = req.params.testId

    // @ts-ignore
    const pair = new WebSocketPair()

    // We're going to take pair[1] as our end, and return pair[0] to the client.
    await this.handleWebsocket(pair[1])

    // Now we return the other end of the pair to the client.
    // @ts-ignore
    return new Response(null, { status: 101, webSocket: pair[0] })
  }

  async writeKeyToStorage(id) {
    let data = JSON.parse(JSON.stringify(this.memoryState[id]))
    if (data && data.metadata && data.metadata.last_check) {
      delete data.metadata.last_check.time
    }
    await this.storage.put(id, data)
  }

  async handleWebsocket(webSocket) {
    // Accept our end of the WebSocket. This tells the runtime that we'll be terminating the
    // WebSocket in JavaScript, not sending it elsewhere.
    webSocket.accept()

    // Create our session and add it to the sessions list.
    let session = { webSocket }
    this.sessions.push(session)

    // On "close" and "error" events, remove the WebSocket from the sessions list and broadcast
    // a quit message.
    let closeOrErrorHandler = evt => {
      session.quit = true
      this.sessions = this.sessions.filter(user => user !== session)
    }

    webSocket.addEventListener('message', async event => {
      await this.handleWebsocketMessage()
    })

    webSocket.addEventListener('open', async event => {
      await this.handleWebsocketMessage()
    })

    webSocket.addEventListener('close', closeOrErrorHandler)
    webSocket.addEventListener('error', closeOrErrorHandler)
  }

  broadcast(message) {
    // Apply JSON if we weren't given a string to start with.
    if (typeof message !== 'string') {
      message = JSON.stringify(message)
    }

    // Iterate over all the sessions sending them messages.
    this.sessions = this.sessions.filter(session => {
      try {
        session.webSocket.send(message)
        return true
      } catch (err) {
        session.quit = true
        return false
      }
    })
  }
}
