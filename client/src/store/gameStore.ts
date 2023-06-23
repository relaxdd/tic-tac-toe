import { create } from 'zustand'
import { createSelector, StoreWithDispatch } from './index.ts'

export interface IGameStore {
  gameRole: 'server' | 'client' | null,
  isStarted: boolean,
  myStep: boolean,
  board: (null | 0 | 1)[][]
}

type GameContext = StoreWithDispatch<IGameStore>

export const defBoard: (null | 0 | 1)[][] = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
]

const useGameStore = create<GameContext>((set) => ({
  gameRole: null,
  isStarted: false,
  myStep: false,
  board: defBoard,
  dispatch: (store) => set(store),
}))

export const useGameDispatch = () => useGameStore(store => store.dispatch)
export const useGameSelector = createSelector(useGameStore)

export default useGameStore