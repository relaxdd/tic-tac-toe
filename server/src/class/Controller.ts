import { Request, Response } from 'express'
import Service from './Service'
import { validateObject } from '../utils'
import schemes from '../schemes'
import { v4 as uuidv4 } from 'uuid'

const cookieKey = '_awenn2015_tictactoe_playerid'

class Controller {
  private service: Service

  public constructor() {
    this.service = new Service()
  }

  public getConnected(req: Request, res: Response) {
    res.json(this.service.players)
  }

  // @Get
  public getGames(req: Request, res: Response) {
    const all = 'all' in req.query
    res.json(this.service.getGames(all))
  }

  public check(req: Request, res: Response) {
    res.json({ games: this.service.games })
  }

  // @Get
  public connect(req: Request, res: Response) {
    let wasId = true
    const testId = req.cookies?.[cookieKey] || null

    const playerId = testId || (() => {
      wasId = false
      return uuidv4()
    })()

    if (!wasId) {
      res.cookie(cookieKey, playerId, {
        httpOnly: true, maxAge: 1800 * 1000, sameSite: false,
      })
    }

    res.writeHead(200, {
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    })

    const handlers = {
      update: (msg: any) => {
        this.sendMessage(res, { event: 'update', body: msg })
      },
      refresh: (msg: any) => {
        this.sendMessage(res, { event: 'refresh', body: msg })
      },
      step: (msg: any) => {
        this.sendMessage(res, { event: 'step', body: msg })
      },
      end: (msg: any) => {
        this.sendMessage(res, { event: 'end', body: msg })
      }
    }

    this.service.emitter.on('update', handlers.update)
    this.service.emitter.on('refresh', handlers.refresh)
    this.service.emitter.on('step', handlers.step)
    this.service.emitter.on('end', handlers.end)

    /* ========================== */

    const count = this.service.addPlayer(playerId)
    this.service.emitter.emit('refresh', count)

    res.on('close', () => {
      this.service.emitter.off('update', handlers.update)
      this.service.emitter.off('refresh', handlers.refresh)
      this.service.emitter.off('step', handlers.step)
      this.service.emitter.off('end', handlers.end)

      res.end()

      this.service.removePlayer(playerId)
      const is = this.service.removeGame(playerId)

      this.service.emitter.emit('refresh', this.service.count)
      if (is) this.service.emitter.emit('update', this.service.games)
    })

    const body = {
      playerId,
      games: this.service.games,
      isInGame: this.service.isInGame(playerId),
    }

    this.sendMessage(res, { event: 'connect', body })
  }

  // @Post
  // @ts-ignore
  public createGame(req: Request, res: Response) {
    const schema = schemes.create
    const player = req.query?.['player']
    const body = req?.body || {}
    const validate = validateObject(body, schema)

    if (!validate || typeof player !== 'string')
      return res.status(400).end()

    const gameId = this.service.addGame(player, body)
    if (!gameId) return res.status(400).end()

    this.service.emitter.emit('update', this.service.games)

    return res.json({ gameId })
  }

  public joinToGame(req: Request, res: Response) {
    const schema = schemes.join
    const body = req?.body || {}
    const validate = validateObject(body, schema)

    if (!validate) return res.status(400).end()
    const is = this.service.joinToGame(body)

    if (!is.status)
      return res.status(is.code).json({ error: is.error })

    this.service.emitter.emit('update', this.service.games)

    return res.end()
  }

  /* =========================================================== */

  // @Post
  public doStep(req: Request, res: Response) {
    const schema = schemes.step
    const body = req?.body || {}
    const validate = validateObject(body, schema)

    if (!validate) return res.status(400).end()
    this.service.boardStep(body)

    return res.end()
  }

  /* =========== Private utils methods =========== */

  private sendMessage(res: Response, msg: { event: string; body: any }) {
    res.write(`data: ${JSON.stringify(msg)}\n\n`)
  }
}

export default Controller
