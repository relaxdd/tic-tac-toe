import { Request, Response } from 'express'
import Service from './Service'
import { validateObject } from '../utils'
import schemes from '../schemes'
import { v4 as uuidv4 } from 'uuid'

const cookieKey = '_awenn2015_tictactoe_playerid'

class Controller {
  private service: Service
  private timers: { id: string, timer: NodeJS.Timer }[] = []

  public constructor() {
    this.service = new Service()
  }

  // @Get
  public getConnected(req: Request, res: Response) {
    res.json(this.service.players)
  }

  // @Get
  public getGames(req: Request, res: Response) {
    const all = 'all' in req.query
    res.json(this.service.getGames(all))
  }

  // @Get
  public connect(req: Request, res: Response) {
    let wasId = true
    const testId: string = req.cookies?.[cookieKey] || null

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
      close: (msg: any) => {
        this.sendMessage(res, { event: 'close', body: msg })
      },
      end: (msg: any) => {
        this.sendMessage(res, { event: 'end', body: msg })
      },
    }

    this.service.emitter.on('update', handlers.update)
    this.service.emitter.on('refresh', handlers.refresh)
    this.service.emitter.on('step', handlers.step)
    this.service.emitter.on('close', handlers.close)
    this.service.emitter.on('end', handlers.end)

    // ***************************************

    const check = this.timers.find(it => it.id === playerId)

    if (check) {
      clearTimeout(check.timer[Symbol.toPrimitive]())
      this.timers = this.timers.filter(it => it.id !== playerId)
    }

    // ***************************************

    res.on('close', () => {
      this.service.emitter.off('update', handlers.update)
      this.service.emitter.off('refresh', handlers.refresh)
      this.service.emitter.off('step', handlers.step)
      this.service.emitter.off('close', handlers.close)
      this.service.emitter.off('end', handlers.end)

      this.service.emitter.emit('refresh', this.service.connected)
      this.service.removePlayer(playerId)

      const find = this.service.getGames(true).find(it => it.players.includes(playerId))

      if (find) {
        const timer = setTimeout(() => {
          const is = this.service.removeGameByPlayerId(playerId)
          if (is) this.service.emitter.emit('update', this.service.getGames())
          this.timers = this.timers.filter(it => it.id !== playerId)
        }, 15 * 1000)

        const index = this.timers.findIndex(it => it.id === playerId)

        if (index === -1)
          this.timers.push({ id: playerId, timer })
        else
          this.timers[index]!.timer = timer
      }

      res.end()
    })

    const count = this.service.addPlayer(playerId)
    this.service.emitter.emit('refresh', count)

    if (!this.service.getGames(true).length)
      this.timers = []

    const body = {
      myId: playerId,
      games: this.service.getGames(),
      players: this.service.connected,
      ...this.service.isInGame(playerId),
    }

    this.sendMessage(res, { event: 'connect', body })
  }

  // @Post
  public createGame(req: Request, res: Response) {
    const schema = schemes.create
    const player = req.query?.['player']
    const body = req?.body || {}
    const validate = validateObject(body, schema)

    if (!validate || typeof player !== 'string')
      return res.status(400).json({ error: 'Bad Request' })

    const gameId = this.service.createGame(player, body)

    if (!gameId) {
      const error = 'Игра с таким именем уже существует!'
      return res.status(400).json({ error })
    }

    this.service.emitter.emit('update', this.service.getGames())

    return res.json({ gameId })
  }

  // @Post
  public joinToGame(req: Request, res: Response) {
    const schema = schemes.join
    const body = req?.body || {}
    const validate = validateObject(body, schema)

    if (!validate) return res.status(400).end()
    const is = this.service.joinToGame(body)

    return !is.status
      ? res.status(is.code).json({ error: is.error })
      : res.end()
  }

  // ***************************************

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
