import { create } from 'zustand'
import { GameObj } from '../@types'
import { createSelector, StoreWithDispatch } from './index.ts'
import Random from '../class/Random.ts'
import { lsGameKey } from '../vars.ts'

export type AlertTypes = 'success' | 'warning' | 'error'

export interface IAlert {
  id: string,
  type: AlertTypes,
  text: string
}

export interface IStore {
  myId: string | null,
  gameId: string | null,
  isConnected: boolean,
  isInGame: boolean,
  alerts: IAlert[],
  /** Кол-во подключенных игроков */
  players: number,
  games: GameObj[],
  /** Модальное окно с вводом пароля */
  isVisible: boolean
}

type AppContext = {
  pushAlert: (type: AlertTypes, text: string) => void
} & StoreWithDispatch<IStore>

export function getGameIdOrNull() {
  return localStorage.getItem(lsGameKey)
}

// TODO: Добавить сохранение myId и gameId

const useAppStore = create<AppContext>((set) => ({
  myId: null,
  gameId: getGameIdOrNull(),
  isConnected: false,
  isInGame: false,
  alerts: [],
  players: 0,
  games: [],
  isVisible: false,
  dispatch: (store) => set(store),
  pushAlert: (type, text) => {
    set(p => ({ alerts: [...p.alerts, { id: Random.uuid(8), type, text }] }))
  },
}))

export const useAppDispatch = () => useAppStore(store => store.dispatch)
export const useAppSelector = createSelector(useAppStore)

export default useAppStore