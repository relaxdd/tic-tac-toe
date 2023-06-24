import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import type { Ceil, GameDto, Pair, Players } from '../@types'

class Game {
  public readonly id: string
  public readonly name: string
  public readonly size: number
  public readonly password: string
  public readonly players: Players
  public readonly board: Ceil[][]

  private _started = false

  public constructor(creator: string, name: string, size: number, password: string) {
    this.id = uuidv4()

    this.name = name
    this.size = size
    this.password = password.trim()

    this.players = [creator, null]
    this.board = this.createBoard()
  }

  public get started() {
    return this._started
  }

  public join(playerId: string, start = false) {
    this.players[1] = playerId

    if (start) {
      this._started = true
    }
  }

  public step(playerId: string, [r, c]: Pair<number>) {
    this.board![r]![c] = this.players[0] === playerId ? 1 : 0
    return this.board
  }

  public toObject(): GameDto {
    return {
      id: this.id,
      name: this.name,
      password: this.password !== '',
      size: `${this.size}x${this.size}`,
      players: this.players,
    }
  }

  /* =========================== */

  private createBoard(): Ceil[][] {
    const __x = () => [...Array(this.size).keys()]
    return __x().map(() => __x().map(() => null))
  }
}

export default Game