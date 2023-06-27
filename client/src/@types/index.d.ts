import { BoardState, EventsBody, GameObj } from '../../../shared/@types'
import { GameEventNames } from '../../../shared/@types/enums.ts'

export type RespOrError<T = unknown> = { status: false, error: string } | { status: true, data: T }
export type RoleWinner = -1 | 0 | 1

export type GameEvents =
  | { event: GameEventNames.Connect, body: EventsBody.Connect }
  | { event: GameEventNames.Update, body: GameObj[] }
  | { event: GameEventNames.Refresh, body: number }
  | { event: GameEventNames.Start, body: EventsBody.Start }
  | { event: GameEventNames.Close, body?: undefined }
  | { event: GameEventNames.Step, body: BoardState }
  | { event: GameEventNames.Endgame, body: RoleWinner }
  | { event: GameEventNames.Offline, body: boolean }