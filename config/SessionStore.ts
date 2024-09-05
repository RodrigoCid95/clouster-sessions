import { Socket } from 'node:net'
import { Store } from 'express-session'

export class SessionStore extends Store {
  store: Map<any, any>
  client: Socket

  constructor() {
    super()
    this.store = new Map()
  }
  emitToServer(event: string, ...args: any[]) {
    if (!this.client) {
      this.client = new Socket()
      this.client.connect('./session-server.sock')
    }
    return new Promise(resolve => {
      this.client.write(JSON.stringify({ event, args }))
      this.client.once('data', data => {
        resolve(JSON.parse(data.toString()))
      })
    })
  }
  get(sid: any, callback: (arg0: null, arg1: any) => void) {
    process.nextTick(() => this.emitToServer('get', sid).then(session => callback(null, session || null)))
  }
  set(sid: any, session: any, callback: (arg0: null) => void) {
    process.nextTick(() => this.emitToServer('set', sid, session).then(callback))
  }
  destroy(sid: any, callback: (arg0: null) => void) {
    process.nextTick(() => {
      this.store.delete(sid)
      callback(null)
    })
  }
  length(callback: (arg0: null, arg1: number) => void) {
    process.nextTick(() => {
      callback(null, this.store.size)
    })
  }
  all(callback: (arg0: null, arg1: any[]) => void) {
    process.nextTick(() => {
      callback(null, Array.from(this.store.values()))
    })
  }
  clear(callback: (arg0: null) => void) {
    process.nextTick(() => {
      this.store.clear()
      callback(null)
    })
  }
}