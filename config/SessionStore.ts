import crypto from 'node:crypto'
import { Store } from 'express-session'

class SessionConnector {
  #CALLBACKS: {
    [x: string]: any
  }
  constructor() {
    this.#CALLBACKS = {}
    process.on('message', message => {
      const { uid, data } = message as any
      this.#CALLBACKS[uid](data)
      delete this.#CALLBACKS[uid]
    })
  }
  async emit(event: string, ...args: any[]) {
    const uid = crypto.randomUUID()
    return new Promise(resolve => {
      this.#CALLBACKS[uid] = (data: any) => resolve(data)
      if (process.send) {
        process.send({ uid, event, args })
      }
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