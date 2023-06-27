import Game from './Game'
import type { GameObj, Pair } from '../@types'
import CustomEmitter from './CustomEmitter'
import { EventsBody, GameState } from '../../../shared/@types'

type ServiceResp =
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
  public readonly emitter: CustomEmitter

  private readonly _games: Game[]
  private readonly _timer = 90

  public constructor() {
    this.emitter = new CustomEmitter()
    this._games = []
  }

  public get players() {
    return this.emitter.players
  }

  public get connected() {
    return this.emitter.players.length
  }

  // **************************

  public cancelGame(obj: { playerId: string, gameId: string }): ServiceResp {
    const find = this._games.find((it) => {
      return it.id === obj.gameId && it.players.includes(obj.playerId)
    })

    if (!find)
      return { status: false, error: 'Bad Request', code: 400 }

    this.removeGameById(obj.gameId)
    this.emitter.emit('update', this.getGames())

    return { status: true }
  }

  public getGames(all = false) {
    return (all ? this._games
        : this._games.filter(it => !it.started && it.players[1] === null)
    ).map(it => it.toObject())
  }

  public isInGame(id: string): { gameId: string, state: GameState } | undefined {
    const game = this._games.find(it => it.players.includes(id))
    if (!game) return undefined

    const isStarted = game.players.length === 2 && game.players[1] !== null
    const gameRole = !isStarted ? 'server' : (game.players[0] === id ? 'server' : 'client')

    return {
      gameId: game.id,
      state: {
        isStarted, gameRole,
        isMyStep: game.whose === id,
        board: game.board,
      },
    }
  }

  public addPlayer(id: string) {
    this.emitter.add(id)
    return this.connected
  }

  public removePlayer(id: string) {
    this.emitter.remove(id)
  }

  // ******************************

  public createGame(player: string, obj: Omit<GameObj, 'id'>): string | null {
    const { name, password } = obj
    const size = Number(obj.size.split('x')?.[0] || '3')

    const exist = this._games.find(it => it.name === name)
    if (exist !== undefined) return null

    const game = new Game(player, name, size, password)
    this._games.push(game)

    return game.id
  }

  public removeGameByPlayerId(id: string) {
    const index = this._games.findIndex(it => it.players.includes(id))
    if (index === -1) return false
    clearTimeout(this._games?.[index]?.timer?.[Symbol.toPrimitive]())
    this._games.splice(index, 1)
    return true
  }

  public removeGameById(id: string) {
    const index = this._games.findIndex(it => it.id === id)
    if (index === -1) return false
    clearTimeout(this._games?.[index]?.timer?.[Symbol.toPrimitive]())
    this._games.splice(index, 1)
    return true
  }

  public joinToGame(obj: JoinPayload): ServiceResp {
    const game = this._games.find(it => it.id === obj.gameId)

    if (!game || game.started) {
      const error = 'Не удалось найти игру или она уже началась'
      return { status: false, error, code: 404 }
    }

    if (game.password && obj.password !== game.password) {
      const error = 'Введен неверный пароль!'
      return { status: false, error, code: 400 }
    }

    game.join(obj.playerId, true)

    const matchRole = (id: string) => {
      return obj.playerId === id && game.players[1] === id
        ? 'client'
        : (game.players[0] === id ? 'server' : null)
    }

    this.emitter.each('start', game.players, (id): EventsBody.Start => {
      return {
        board: game.board,
        role: matchRole(id),
      }
    })

    this.emitter.broadcastAll('update', game.players, this.getGames())

    game.timer = setTimeout(() => {
      this.closeGame(game)
    }, this._timer * 1000)

    return { status: true }
  }

  public boardStep(obj: StepPayload): ServiceResp {
    const game = this._games.find(it => {
      return it.id === obj.gameId && it.players.includes(obj.playerId)
    })

    if (!game) {
      const error = 'Игра с такими id не найдена!'
      return { status: false, error, code: 404 }
    }

    const board = game.step(obj.playerId, obj.pos)

    if (board === false) {
      const error = 'Сейчас ходит другой игрок!'
      return { status: false, error, code: 400 }
    }

    if (game.players[1] !== null)
      this.emitter.broadcast('step', game.players, board)
    else {
      const players = game.players
      this.removeGameById(game.id)
      this.emitter.broadcast('update', players, this.getGames())

      const error = 'Ошибка игры, не определен 2 игрок!'
      return { status: false, error, code: 500 }
    }

    const check = this.checkWinner(board)

    if (check.end)
      this.emitter.broadcast('endgame', game.players, check.winner)
    else {
      const isDrawn = !board.some(row => row.some(ceil => ceil === null))

      // Игра продолжается
      if (!isDrawn) {
        game.timer?.refresh()
        return { status: true }
      }

      this.emitter.broadcast('endgame', game.players, -1)
    }

    clearTimeout(game?.timer?.[Symbol.toPrimitive]())
    const is = this.removeGameById(game.id)

    if (!is) {
      const error = 'Во время удаления игры произошла ошибка!'
      return { status: false, error, code: 500 }
    }

    this.emitter.broadcast('update', game.players, this.getGames())

    return { status: true }
  }

  private closeGame(game: Game) {
    this.removeGameById(game.id)

    this.emitter.broadcast('close', game.players)
    this.emitter.broadcast('update', game.players, this.getGames())
  }

  // ******************************

  private checkWinner(board: (null | 0 | 1)[][]): ({ end: false } | { end: true, winner: number | null }) {
    let winner: number | null = null

    const is = [0, 1].some((i) => {
      if (!this.isSomeWin(board, i)) return false
      winner = i
      return true
    })

    return !is ? { end: false } : { end: true, winner }
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
}

export default Service