import cluster from "node:cluster"

if (cluster.isPrimary) {
  const os = require('node:os')
  const numCPUs = os.availableParallelism()
  console.log(`\n\nMaster ${process.pid} is running`, `\n${numCPUs} workers:\n`)
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
  const PORTS = Array.from({ length: numCPUs }, (_, i) => 3000 + i)
  for (const PORT of PORTS) {
    const child = cluster.fork({ PORT })
    child.on('message', message => {
      const { uid, event, args = [] } = message
      const e = Store[event]
      const result = e(...args)
      child.send({ uid, data: result })
    })
  }
} else {
  initHttpServer({ onMessage: console.log })
}
