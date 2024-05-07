import { v4 as uuidv4 } from 'uuid'
import type { Ceil, GameDto, Pair, Players } from '../@types'
import { inverse } from '../includes/utils'

class Game {
  public readonly id: string
  public readonly name: string
  public readonly size: number
  public readonly password: string
  public readonly players: Players
  public readonly board: Ceil[][]

  public timer: NodeJS.Timeout | null = null
  public whose: string

  private _started = false

  public constructor(playerId: string, name: string, size: number, password: string) {
    this.id = uuidv4()

    this.name = name
    this.size = size
    this.password = password.trim()
    this.whose = playerId

    this.players = [playerId, null]
    this.board = this.createBoard()
  }

  public get started() {
    return this._started
  }

  public join(playerId: string, start = false) {
    this.players[1] = playerId
    if (start) this.start()
  }

  public start() {
    this._started = true
  }

  public step(playerId: string, [r, c]: Pair<number>) {
    if (this.whose !== playerId) return false

    this.board![r]![c] = this.players[0] === playerId ? 1 : 0
    this.whose = inverse(this.players as string[], playerId)!

    return this.board
  }

  // *******************************

  public toObject(): GameDto {
    return {
      id: this.id,
      name: this.name,
      password: this.password !== '',
      size: `${this.size}x${this.size}`,
      players: this.players,
    }
  }

  private createBoard(): Ceil[][] {
    const __x = () => [...Array(this.size).keys()]
    return __x().map(() => __x().map(() => null))
  }
}

export default Game
