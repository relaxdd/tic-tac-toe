import EventEmitter from 'events'

class CustomEmitter extends EventEmitter {
  private _players: string[] = []

  public constructor() {
    super()
  }

  // ************************

  public get players() {
    return this._players
  }

  public set players(list: string[]) {
    this._players = list
  }

  public add(id: string) {
    this._players.push(id)
  }

  public remove(id: string) {
    const index = this._players.indexOf(id)
    this._players.splice(index, 1)
  }

  // ************************

  public broadcastAll(type: string, exclude: (string | null)[], msg?: any) {
    const events = this.eventNames()

    if (!events.includes(type)) {
      console.warn('Предупреждение: такое событие не добавлено!')
      return
    }

    exclude = exclude.filter(it => typeof it === 'string')

    const receivers = this._players.filter(it => !exclude.includes(it))
    const indexes = receivers.map(id => this._players.indexOf(id!))

    this.customEmit(type, indexes, msg)
  }

  public broadcast(type: string, receivers: (string | null)[], msg?: any) {
    const events = this.eventNames()

    if (!events.includes(type)) {
      console.warn('Предупреждение: такое событие не добавлено!')
      return
    }

    receivers = receivers.filter(it => typeof it === 'string')
    const indexes = receivers.map(id => this._players.indexOf(id!))

    this.customEmit(type, indexes, msg)
  }

  public customEmit(type: string, indexes: number[], msg?: any) {
    if (!indexes.length) return

    const listeners = this.listeners(type)
    if (!listeners.length) return

    for (const index of indexes) {
      if (index === -1) continue
      const fn = listeners[index]

      if (typeof fn === 'function')
        fn(msg)
      else
        console.error(`Ошибка, под индексом ${index} нет слушателя!`)
    }
  }

  public each(type: string, receivers: (string | null)[], cb: (id: string) => any) {
    const events = this.eventNames()

    if (!events.includes(type)) {
      console.warn('Предупреждение: такое событие не добавлено!')
      return
    }

    receivers = receivers.filter(it => typeof it === 'string')

    const list = receivers.map(id => ({
      index: this._players.indexOf(id!), id: id!
    }))

    if (!list.length) return

    const listeners = this.listeners(type)
    if (!listeners.length) return

    for (const { index, id } of list) {
      if (index === -1) continue
      const fn = listeners[index]

      if (typeof fn === 'function')
        fn(cb(id))
      else
        console.error(`Ошибка, под индексом ${index} нет слушателя!`)
    }
  }
}

export default CustomEmitter