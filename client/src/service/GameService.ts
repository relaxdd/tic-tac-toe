import type { GameObj } from '../@types'
import { GameDto } from '../@types'
import axios, { AxiosError } from 'axios'

type FullData = { playerId: string, isInGame: boolean, games: GameObj[] }

export type GameEvents =
  | { event: 'connect', body: FullData }
  | { event: 'update', body: GameObj[] }
  | { event: 'refresh', body: number }
  | { event: 'start', body: undefined }
  | { event: 'step', body: (0 | 1 | null)[][] }
  | { event: 'end', body: 'draw' | '1' | '0' }

type CheckData = { games: GameObj[] }

function getPath() {
  if (window.location.hostname === 'localhost') {
    return (window.location.port === '7000'
      ? window.location.href
      : 'http://localhost:7000/') + 'api'
  } else {
    return '/api'
  }
}

class GameService {
  public static api = getPath()
  public static count = 0
  public static client = axios.create({ baseURL: this.api })

  public static myId: string | null = null

  public static connect(
    openFn: () => void,
    eventFn: (data: GameEvents, myId: string | null) => void,
    errorFn: (final: boolean) => void,
  ) {
    const url = `${this.api}/connect`
    const source = new EventSource(url, { withCredentials: true })

    source.onopen = openFn

    source.onmessage = (ev: MessageEvent<string>) => {
      try {
        const data = JSON.parse(ev.data) as GameEvents
        if (data.event === 'connect') this.myId = data.body.playerId
        eventFn(data, this.myId)
      } catch (err) {
        console.error(err)
      }
    }

    source.onerror = () => {
      if (this.count >= 10) {
        this.myId = null
        source.close()
        errorFn(true)
      } else {
        this.count += 1
        errorFn(false)
      }
    }
  }

  public static async check() {
    try {
      const resp = await this.client.get<CheckData>(`/check`)
      return resp.data
    } catch (e) {
      console.error(e)
      return null
    }
  }

  public static async createGame(id: string, game: GameDto) {
    type Resp = { gameId: string }

    try {
      const url = `/create?player=${id}`
      const resp = await this.client.post<Resp>(url, game)

      return resp.data?.gameId
    } catch (e) {
      console.error(e)
      return null
    }
  }

  public static async joinToGame(gameId: string, playerId: string, password = '') {
    try {
      const obj = { gameId, password, playerId }
      await this.client.post(`/join`, obj)
      return { status: true }
    } catch (e) {
      const err = e as AxiosError<{ error: string }>
      console.error(err)
      return { status: false, error: err?.response?.data?.error || err.message }
    }
  }

  public static async boardStep(r: number, c: number, playerId: string, gameId: string) {
    const obj = { pos: [r, c], playerId, gameId }
    const resp = await this.client.post('/step', obj)
    return resp.data
  }
}

export default GameService
