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
      const { event, args = [] } = JSON.parse(strData)
      const e = Store[event]
      if (e) {
        const result = e(...args)
        socket.write(JSON.stringify(result))
      }
    })
  })
  const listen = sessionServer.listen(SOCKET_PATH, resolve)
  process.on('SIGTERM', () => {
    listen.close(() => {
      fs.rmSync(SOCKET_PATH, { force: true })
    })
  })
})
