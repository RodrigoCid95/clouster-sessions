import { createServer } from 'node:net'
import fs from 'node:fs'

export const initSessionServer = (SOCKET_PATH: string) => new Promise<void>(resolve => {
  if (fs.existsSync(SOCKET_PATH)) {
    fs.rmSync(SOCKET_PATH, { force: true })
  }
  const Store = {
    store: new Map(),
    get: (sid: string) => Store.store.get(sid) || null,
    set: (sid: string, session: any) => {
      Store.store.set(sid, session)
      return null
    },
    destroy: (sid: string) => {
      Store.store.delete(sid)
      return null
    },
    length: () => {
      Store.store.size
      return null
    },
    all: () => Array.from(Store.store.values()),
    clear: () => Store.store.clear()
  }
  const sessionServer = createServer(socket => {
    socket.on('data', (data) => {
      const strData = data.toString()
      const parts = strData
        .split('\n')
        .filter(part => part !== '')
        .map(part => JSON.parse(part))
      for (const part of parts) {
        const { uid, event, args = [] } = part
        const e = Store[event]
        const result = e(...args)
        const message = JSON.stringify({ uid, data: result })
        socket.write(`${message}\n`)
      }
    })
  })
  sessionServer.listen(SOCKET_PATH, resolve)
})