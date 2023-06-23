import EventEmitter from 'node:events'
import Game from './Game'
import type { GameObj, Pair } from '../@types'
import { GameDto } from '../@types'

// type IPlayer = {
//   id: string,
//   listener: number
// }

type CreateGame =
  | { status: true }
  | { status: false, error: string, code: number }

type JoinPayload = {
  gameId: string,
  playerId: string,
  password: string
}

type StepPayload = {
  pos: Pair<number>,
  playerId: string,
  gameId: string
}

class Service {
  public readonly emitter: EventEmitter
  private readonly _games: Game[]
  private readonly _players: string[]

  public constructor() {
    this.emitter = new EventEmitter()
    this._games = []
    this._players = []
  }

  public get games(): GameDto[] {
    return this.getGames(true)
  }

  public get players() {
    return this._players
  }

  public get count() {
    return this._players.length
  }

  /* ======================== */

  public getGames(all = false) {
    return (all ? this._games
        : this._games.filter(it => !it.started && it.players[1] === null)
    ).map(it => it.toObject())
  }

  public isInGame(id: string) {
    return this._games.find(it => it.players.includes(id)) !== undefined
  }

  public addPlayer(id: string) {
    return this._players.push(id)
  }

  public removePlayer(id: string) {
    const index = this._players.indexOf(id)
    this._players.splice(index, 1)
  }

  /* ======================== */

  public addGame(player: string, obj: Omit<GameObj, 'id'>): string {
    const { name, password } = obj
    const size = obj.size.split('x')?.[0] || '3'

    const game = new Game(player, name, Number(size), password)
    this._games.push(game)

    return game.id
  }

  public removeGame(id: string) {
    const index = this._games.findIndex(it => it.players.includes(id))
    if (index === -1) return false
    this._games.splice(index, 1)
    return true
  }

  public joinToGame(obj: JoinPayload): CreateGame {
    const game = this._games.find(it => it.id === obj.gameId)

    if (!game || game.started) {
      const error = 'Не удалось найти игру или она уже началась'
      return { status: false, error, code: 404 }
    }

    if (game.password && obj.password !== game.password) {
      const error = 'Пароль введен не верно!'
      return { status: false, error, code: 400 }
    }

    game.join(obj.playerId, true)

    return { status: true }
  }

  public boardStep(obj: StepPayload) {
    const game = this._games.find(it => {
      return it.id === obj.gameId && it.players.includes(obj.playerId)
    })

    if (!game) return
    const board = game.step(obj.playerId, obj.pos)

    if (game.players[1] !== null)
      this.broadcast('step', game.players as string[], board)
    else {
      console.error('Ошибка рассылки!')
      return
    }

    const check = this.checkWinner(board)

    if (check.end) {
      this.broadcast('end', game.players as string[], String(check.winner))
    } else {
      const isDrawn = !board.some(row => row.some(ceil => ceil === null))
      if (!isDrawn) return
      this.broadcast('end', game.players as string[], 'draw')
    }

    const is = this.removeGame(game.players[0])

    if (!is) {
      console.error('Произошла ошибка во время удаления игры!')
      return
    }

    this.broadcast('update', game.players as string[], this.games)
  }

  /* ======================== */

  private checkWinner(board: (null | 0 | 1)[][]): ({ end: false } | { end: true, winner: number|null }) {
    let winner: number | null = null

    const is = [0, 1].some((i) => {
      if (!this.isSomeWin(board, i)) return false
      winner = i
      return true
    })

    return !is ? { end: false } : { end: true, winner  }
  }

  private isSomeWin(board: (null | 0 | 1)[][], i: number) {
    for (const row of board) {
      const win = row.every(ceil => ceil === i)
      if (win) return true
    }

    for (let col = 0; col < 3; col++) {
      const win = board.every(row => row[col] === i)
      if (win) return true
    }

    const dig1 = board?.[0]?.[0] === i && board?.[1]?.[1] === i && board?.[2]?.[2] === i
    if (dig1) return true

    const dig2 = board?.[0]?.[2] === i && board?.[1]?.[1] === i && board?.[2]?.[0] === i
    if (dig2) return true

    return false
  }

  /* ======================== */

  private broadcast(type: string, receivers: string[], msg?: any) {
    const events = this.emitter.eventNames()

    if (!events.includes(type)) {
      console.warn('Предупреждение: такое событие не добавлено!')
      return
    }

    const list = receivers.map(id => this._players.indexOf(id))
    const listeners = this.emitter.listeners(type)

    for (const index of list) {
      const fn = listeners[index]

      if (typeof fn === 'function')
        fn(msg)
      else
        console.error(`Ошибка, под индексом ${index} нет слушателя!`)
    }
  }
}

export default Service