import cluster from "node:cluster"
import path from 'node:path'
import { initSessionServer } from 'SessionServer'

if (cluster.isPrimary) {
  const sessionSockPath = path.resolve(process.cwd(), 'session-server.sock')
  initSessionServer(sessionSockPath)
    .then(() => {
      const os = require('node:os')
      const numCPUs = os.availableParallelism()
      console.log(`\n\nMaster ${process.pid} is running`, `\n${numCPUs} workers:\n`)

      const PORTS = Array.from({ length: numCPUs }, (_, i) => 3000 + i)
      for (const PORT of PORTS) {
        cluster.fork({ PORT })
      }
    })
} else {
  initHttpServer({ onMessage: console.log })
}
