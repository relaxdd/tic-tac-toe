import { create } from 'zustand'
import { createSelector, StoreWithDispatch } from './index.ts'
import { BoardState } from '../../../shared/@types'

type GameRoles = 'server' | 'client'

export interface IGameStore {
  board: BoardState | null
  isStarted: boolean,
  gameRole: GameRoles | null,
  isMyStep: boolean,
  /** Опонент не в сети */
  offline: boolean
}

// type GameState = Pick<IGameStore, 'board' | 'myStep'>
type GameContext = StoreWithDispatch<IGameStore>

// const defState: GameState = {
//   board: defBoard,
//   myStep: false,
// }

// function getGameRole(): GameRoles | null {
//   const allow = ['client', 'server']
//   const role = localStorage.getItem(lsRoleKey)
//
//   if (!role) return null
//   return allow.includes(role) ? role as GameRoles : null
// }
//
// function validateState(state: unknown) {
//   return state !== null && typeof state === 'object' &&
//     'board' in state && 'myStep' in state && typeof state.myStep === 'boolean' &&
//     typeof state.board === 'object' && Array.isArray(state.board)
// }
//
// function getGameState(): GameState {
//   const json = localStorage.getItem(lsStateKey)
//   if (!json) return defState
//
//   try {
//     const state = JSON.parse(json) as unknown
//     if (validateState(state))
//       return state as GameState
//     else
//       return defState
//   } catch (e) {
//     console.error(e)
//     return defState
//   }
// }

const useGameStore = create<GameContext>((set): GameContext => ({
  isStarted: false,
  isMyStep: false,
  gameRole: null,
  board: null,
  offline: false,
  dispatch: (store) => set(store),
}))

export const useGameDispatch = () => useGameStore(store => store.dispatch)
export const useGameSelector = createSelector(useGameStore)

export default useGameStore