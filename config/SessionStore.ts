import { Socket } from 'node:net'
import crypto from 'node:crypto'
import path from 'node:path'
import { Store } from 'express-session'

const sessionSockPath = path.resolve(process.cwd(), 'session-server.sock')

class SessionConnector {
  #CALLBACKS: {
    [x: string]: any
  }
  #client: Socket
  #connected: boolean
  constructor() {
    this.#CALLBACKS = {}
    this.#client = new Socket()
    this.#client.on('data', data => {
      const strData = data.toString()
      const parts = strData
        .split('\n')
        .filter(part => part !== '')
        .map(part => JSON.parse(part))
      for (const part of parts) {
        const { uid, data } = part
        this.#CALLBACKS[uid](data)
        delete this.#CALLBACKS[uid]
      }
    })
    this.#connected = false
  }
  async emit(event: string, ...args: any[]) {
    const uid = crypto.randomUUID()
    if (!this.#connected) {
      await new Promise<void>(resolve => this.#client.connect(sessionSockPath, resolve))
      this.#connected = true
    }
    return new Promise(resolve => {
      this.#CALLBACKS[uid] = (data: any) => resolve(data)
      const data = JSON.stringify({ uid, event, args })
      this.#client.write(`${data}\n`)
    })
  }
}

export class SessionStore extends Store {
  connector: SessionConnector
  constructor() {
    super()
    this.connector = new SessionConnector()
  }
  get(sid: any, callback: (arg0: null, arg1: any) => void) {
    this
      .connector
      .emit('get', sid)
      .then(session => callback(null, session || null))
  }
  set(sid: any, session: any, callback: (arg0: null) => void) {
    this
      .connector
      .emit('set', sid, session)
      .then(callback)
  }
  destroy(sid: any, callback: (arg0: null) => void) {
    this
      .connector
      .emit('delete', sid)
      .then(callback)
  }
  length(callback: (arg0: null, arg1: number) => void) {
    this
      .connector
      .emit('length')
      .then((data: any) => callback(null, data))
  }
  all(callback: (arg0: null, arg1: any[]) => void) {
    this
      .connector
      .emit('length')
      .then((data: any) => callback(null, data))
  }
  clear(callback: (arg0: null) => void) {
    this
      .connector
      .emit('clear')
      .then(callback)
  }
}