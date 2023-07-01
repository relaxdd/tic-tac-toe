import { Request, Response } from 'express'
import Service from './Service'
import { validateObject } from '../includes/utils'
import schemes, { validateSchema } from '../includes/schemes'
import { v4 as uuidv4 } from 'uuid'
import { BoardState, EventsBody, GameObj } from '../../../shared/@types'
import { GameEventNames } from '../../../shared/@types/enums'

const cookieKey = '_awenn2015_tictactoe_playerid'

class Controller {
  private service: Service
  private waiting = 15
  private timers: { id: string, timer: NodeJS.Timer }[] = []

  public constructor() {
    this.service = new Service()
  }

  // @Get
  public getTimers(req: Request, res: Response) {
    res.json(this.timers.map(it => it.id))
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

  private clearWaitingTimer(id: string) {
    const check = this.timers.find(it => it.id === id)

    if (check) {
      clearTimeout(check.timer[Symbol.toPrimitive]())
      this.timers = this.timers.filter(it => it.id !== id)
    }
  }

  private notifyOpponentAboutOnline(id: string) {
    const game = this.service.getGames(true).find(it => it.players.includes(id))

    if (game !== undefined && game.players[1] !== null) {
      const index = game.players.indexOf(id)
      const receiver = game.players[Number(!Boolean(index))]!

      this.service.emitter.broadcast('offline', [receiver], false)
    }
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
        httpOnly: true, sameSite: false,
      })
    }

    res.writeHead(200, {
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    })

    const handlers = {
      update: (msg: GameObj[]) => {
        res.write(this.buildMsg({ event: GameEventNames.Update, body: msg }))
      },
      refresh: (msg: number) => {
        res.write(this.buildMsg({ event: GameEventNames.Refresh, body: msg }))
      },
      step: (msg: BoardState) => {
        res.write(this.buildMsg({ event: GameEventNames.Step, body: msg }))
      },
      close: () => {
        res.write(this.buildMsg({ event: GameEventNames.Close }))
      },
      start: (msg: EventsBody.Start) => {
        res.write(this.buildMsg({ event: GameEventNames.Start, body: msg }))
      },
      endgame: (msg: number) => {
        res.write(this.buildMsg({ event: GameEventNames.Endgame, body: msg }))
      },
      offline: (msg: boolean) => {
        res.write(this.buildMsg({ event: GameEventNames.Offline, body: msg }))
      },
    }

    this.service.emitter.on('update', handlers.update)
    this.service.emitter.on('refresh', handlers.refresh)
    this.service.emitter.on('start', handlers.start)
    this.service.emitter.on('step', handlers.step)
    this.service.emitter.on('close', handlers.close)
    this.service.emitter.on('endgame', handlers.endgame)
    this.service.emitter.on('offline', handlers.offline)

    // ***************************************

    this.clearWaitingTimer(playerId)
    this.notifyOpponentAboutOnline(playerId)

    // ***************************************

    res.on('close', () => {
      this.service.emitter.off('update', handlers.update)
      this.service.emitter.off('refresh', handlers.refresh)
      this.service.emitter.off('start', handlers.start)
      this.service.emitter.off('step', handlers.step)
      this.service.emitter.off('close', handlers.close)
      this.service.emitter.off('endgame', handlers.endgame)
      this.service.emitter.off('offline', handlers.offline)

      this.service.removePlayer(playerId)
      this.service.emitter.emit('refresh', this.service.connected)

      const game = this.service.getGames(true).find(it => it.players.includes(playerId))

      const initCloseTimer = () => {
        if (game === undefined) return

        const players = game.players

        const info = players[1] === null ? null : (() => {
          const index = players.indexOf(playerId)
          const receiver = players[Number(!Boolean(index))]!

          this.service.emitter.broadcast('offline', [receiver], true)

          return [receiver, index] as [string, number]
        })()

        const timer = setTimeout(() => {
          this.timers = this.timers.filter(it => it.id !== playerId)

          const is = this.service.removeGameByPlayerId(playerId)
          if (!is) return

          if (info !== null)
            this.service.emitter.broadcast('endgame', [info[0]], info[1])

          this.service.emitter.emit('update', this.service.getGames())
        }, this.waiting * 1000)

        const index = this.timers.findIndex(it => it.id === playerId)

        if (index === -1)
          this.timers.push({ id: playerId, timer })
        else
          this.timers[index]!.timer = timer
      }

      initCloseTimer()

      res.end()
    })

    const count = this.service.addPlayer(playerId)
    this.service.emitter.emit('refresh', count)

    if (!this.service.getGames(true).length)
      this.timers = []

    const gameInfo = this.service.isInGame(playerId)

    const body: EventsBody.Connect = {
      base: {
        myId: playerId,
        gameId: gameInfo?.gameId || null,
        games: this.service.getGames(),
        players: this.service.connected,
        isInGame: gameInfo !== undefined,
      },
    }

    if (gameInfo !== undefined) {
      body['game'] = gameInfo.state
    }

    res.write(this.buildMsg({ event: 'connect', body }))
  }

  // @Post
  public cancelGame(req: Request, res: Response) {
    const body = req?.body || {}
    const validate = validateSchema('cancel', body)

    if (!validate)
      return res.status(400).json({ error: 'Bad Request' })

    const is = this.service.cancelGame(body)

    return !is.status
      ? res.status(is.code).json({ error: is.error })
      : res.end()
  }

  // @Post
  public createGame(req: Request, res: Response) {
    const body = req?.body || {}
    const validate = validateSchema('create', body)
    const player = req.query?.['player']

    if (!validate || typeof player !== 'string')
      return res.status(400).json({ error: 'Bad Request' })

    const gameId = this.service.createGame(player, body)

    if (!gameId) {
      const error = 'Игра с таким именем уже существует!'
      return res.status(400).json({ error })
    }

    this.service.emitter.broadcastAll('update', [player], this.service.getGames())

    return res.json({ gameId })
  }

  // @Post
  public joinToGame(req: Request, res: Response) {
    const body = req?.body || {}
    const validate = validateSchema('join', body)

    if (!validate) return res.status(400).end()
    const is = this.service.joinToGame(body)

    return !is.status
      ? res.status(is.code).json({ error: is.error })
      : res.end()
  }

  // ***************************************

  // @Post
  public doStep(req: Request, res: Response) {
    const body = req?.body || {}
    const validate = validateSchema('step', body)

    if (!validate) return res.status(400).end()
    const is = this.service.boardStep(body)

    return !is.status
      ? res.status(is.code).json({ error: is.error })
      : res.end()
  }

  /* =========== Private utils methods =========== */

  private buildMsg(msg: { event: string; body?: any }) {
    return `data: ${JSON.stringify(msg)}\n\n`
  }
}

export default Controller
