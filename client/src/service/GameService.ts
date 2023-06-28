import { GameEvents, RespOrError } from '../@types'
import axios, { AxiosError } from 'axios'
import { GameDto } from '../../../shared/@types'

class GameService {
  public static api = this.getPath()
  public static count = 0
  public static client = axios.create({ baseURL: this.api })

  public static connect(
    openFn: () => void,
    eventFn: (data: GameEvents) => void,
    errorFn: (final: boolean) => void,
  ) {
    const url = `${this.api}/connect`
    const source = new EventSource(url, { withCredentials: true })

    source.onopen = openFn

    source.onmessage = (ev: MessageEvent<string>) => {
      try {
        const data = JSON.parse(ev.data) as GameEvents
        eventFn(data)
      } catch (err) {
        console.error(err)
      }
    }

    source.onerror = () => {
      if (this.count >= 10) {
        source.close()
        errorFn(true)
      } else {
        this.count += 1
        errorFn(false)
      }
    }
  }

  public static async createGame(id: string, game: GameDto): Promise<RespOrError<string>> {
    type Resp = { gameId: string }

    try {
      const url = `/create?player=${id}`
      const resp = await this.client.post<Resp>(url, game)
      const gameId = resp.data?.gameId

      if (!gameId)
        return { status: false, error: 'Ошибка сервера, нет gameId!' }
      else
        return { status: true, data: gameId }
    } catch (e) {
      const err = e as AxiosError<{ error: string }>
      console.error(e)
      return { status: false, error: err?.response?.data?.error || err.message }
    }
  }

  public static async joinToGame(gameId: string, playerId: string, password = ''): Promise<RespOrError<undefined>> {
    try {
      const obj = { gameId, password, playerId }
      await this.client.post(`/join`, obj)
      return { status: true, data: undefined }
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

  public static async cancelGame(playerId: string, gameId: string) {
    const obj = { playerId, gameId }
    await this.client.post('/cancel', obj)
  }

  private static getPath() {
    if (window.location.hostname === 'localhost') {
      return (window.location.port !== '5173'
        ? window.location.href
        : 'http://localhost:7000/') + 'api'
    } else {
      return '/api'
    }
  }
}

export default GameService
