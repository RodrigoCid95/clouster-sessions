export class IndexController {
  @Get('/')
  public index(req: PXIOHTTP.Request<SessionData>, res: PXIOHTTP.Response) {
    if (!req.session.data) {
      req.session.data = 0
    }
    req.session.data++
    res.send(`Hola mundo! ${req.session.data}`)
  }
}

interface SessionData {
  data: number
}