import { StoreApi, UseBoundStore } from 'zustand'
import { shallow } from 'zustand/shallow'

type SomeObject<T = any> = Record<string, T>

export type DispatchStore<T extends SomeObject> = (store: (T | Partial<T>) | ((prev: T) => T | Partial<T>)) => void
export type StoreWithDispatch<T extends SomeObject> = { dispatch: DispatchStore<T> } & T

export function createSelector<S extends Record<string, any>>(store: UseBoundStore<StoreApi<S>>) {
  type Store = Omit<S, 'dispatch'>
  return <K extends keyof Store>(...keys: K[]) => store((state) => {
      type Select = Pick<Store, K>
      return keys.reduce((acc, key) => {
        acc[key] = state[key]
        return acc
      }, {} as Select) as Select
    }, shallow,
  )
}

// export type DispatchStore = <K extends keyof IStore>(key: K, value: IStore[K] | ((prev: IStore[K]) => IStore[K])) => void

// const dispatch = (key, value) => {
//   return set((prev) => ({
//     ...prev, [key]: typeof value === 'function' ? value(prev[key]) : value,
//   }))
// },