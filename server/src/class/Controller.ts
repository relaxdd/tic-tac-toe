import { NextFunction, Request, Response } from 'express'
import { cookieKey } from '../defines'
import Service from './Service'
import { CancelGameBody, CreateGameSchema, DoNextStepBody, GetGamesQuery, JoinToGameBody } from '../includes/schemes'
import { v4 as uuidv4 } from 'uuid'
import { BoardState, EventsBody, GameObj } from '../../../shared/@types'
import { GameEventNames } from '../../../shared/@types/enums'
import ApiError from './ApiError'

class Controller {
  private service: Service
  private waiting = 15
  private timers: { id: string, timer: NodeJS.Timer }[] = []

  public constructor() {
    this.service = new Service()
  }

  public connect(req: Request, res: Response, next: NextFunction) {
    try {
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

      if (!this.service.getGames(true).length) {
        this.timers = []
      }

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
    } catch (err) {
      return next(err)
    }
  }

  public getTimerIds(_: Request, res: Response, next: NextFunction) {
    try {
      return res.json(this.timers.map(it => it.id))
    } catch (err) {
      return next(err)
    }
  }

  public getConnected(_: Request, res: Response, next: NextFunction) {
    try {
      return res.json(this.service.players)
    } catch (err) {
      return next(err)
    }
  }

  public getGames(req: Request<any, any, any, GetGamesQuery>, res: Response, next: NextFunction) {
    try {
      const all = 'all' in req.query
      return res.json(this.service.getGames(all))
    } catch (err) {
      return next(err)
    }
  }

  public cancelGame(req: Request<any, any, CancelGameBody>, res: Response, next: NextFunction) {
    try {
      this.service.cancelGame(req.body)
      return res.end()
    } catch (err) {
      return next(err)
    }
  }

  public createGame(
    req: Request<any, any, CreateGameSchema['body'], CreateGameSchema['query']>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const player = String(req.query.player)
      const gameId = this.service.createGame(player, req.body)

      if (!gameId) {
        const error = 'Игра с таким именем уже существует'
        return next(new ApiError(error, 400))
      }

      this.service.emitter.broadcastAll('update', [player], this.service.getGames())

      return res.json({ gameId })
    } catch (err) {
      return next(err)
    }
  }

  public joinToGame(req: Request<any, any, JoinToGameBody>, res: Response, next: NextFunction) {
    try {
      this.service.joinToGame(req.body)
      return res.end()
    } catch (err) {
      return next(err)
    }
  }

  public doNextStep(req: Request<any, any, DoNextStepBody>, res: Response, next: NextFunction) {
    try {
      this.service.boardStep(req.body)
      return res.end()
    } catch (err) {
      return next(err)
    }
  }

  /* =========== Private utils methods =========== */

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

  private buildMsg(msg: { event: string; body?: any }) {
    return `data: ${JSON.stringify(msg)}\n\n`
  }
}

export default Controller
