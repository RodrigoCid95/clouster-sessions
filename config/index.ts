import session from 'express-session'
import { SessionStore } from './SessionStore'

export const HTTP: PXIOHTTP.Config = {
  middlewares: [
    session({
      store: new SessionStore(),
      secret: 'secret',
      resave: false,
      saveUninitialized: true
    })
  ]
}