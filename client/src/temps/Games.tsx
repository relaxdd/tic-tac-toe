import { FormEvent, ReactNode, useState } from 'react'
import { GameDto } from '../@types'
import GameService from '../service/GameService.ts'
import scss from './modules/App.module.scss'
import { lsGameKey, lsRoleKey, sizes } from '../vars.ts'
import useAppStore, { IStore, useAppDispatch, useAppSelector } from '../store/appStore.ts'
import useGameStore, { useGameDispatch } from '../store/gameStore.ts'

const Games = (): ReactNode => {
  const arr: (keyof IStore)[] = ['myId', 'games', 'isConnected']
  const { isConnected, myId, games } = useAppSelector(...arr)
  const pushAlert = useAppStore(s => s.pushAlert)
  const gameRole = useGameStore(s => s.gameRole)
  const appDispatch = useAppDispatch()
  const gameDispatch = useGameDispatch()
  const [isLoading, setLoading] = useState(false)

  async function onCreateGame(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = new FormData(e.currentTarget)
    const obj: Record<string, any> = {}

    for (const it of form.entries())
      obj[it[0]] = it[1]

    if (!myId) {
      pushAlert('error', 'Ошибка клиента, нет myId')
      return
    }

    const gameId = await GameService.createGame(myId, obj as GameDto)
    setLoading(false)

    if (!gameId)
      alert('Произошла непредвиденная ошибка!')
    else {
      (e.target as HTMLFormElement).reset()

      appDispatch({ isInGame: true, gameId })
      gameDispatch({ gameRole: 'server', myStep: true })
      localStorage.setItem(lsRoleKey, 'server')
    }
  }

  async function onJoinToGame(gameId: string) {
    if (gameRole === 'server') {
      appDispatch({ isInGame: true })
      return
    }

    const item = games.find(it => it.id === gameId)
    if (!item || !myId) return

    if (item.password) {
      appDispatch({ isVisible: true })
      localStorage.setItem(lsGameKey, gameId)
      return
    }

    const result = await GameService.joinToGame(gameId, myId)

    if (!result.status) {
      const def = 'Не удалось присоединиться к игре!'
      pushAlert('warning', result?.error || def)
      return
    }

    appDispatch({ isInGame: true, gameId })
    gameDispatch({ gameRole: 'client' })
    localStorage.setItem(lsRoleKey, 'client')
  }

  return (
    <>
      <ul className={scss.appGames}>
        <li className={scss.appGames_head}>
          <span>Название</span>
          <span>Пароль</span>
          <span>Размер</span>
          <span>Действие</span>
        </li>

        {games.map((game) => (
          <li className={scss.appGames_item} key={game.id}>
            <span>{game.name}</span>
            <span>{game.password ? 'Да' : 'Нет'}</span>
            <span>{game.size}</span>
            <span>
              <input
                type="button"
                onClick={() => onJoinToGame(game.id)}
                value="Вступить"
              />
            </span>
          </li>
        ))}
      </ul>

      <form className={scss.appCreate} onSubmit={onCreateGame}>
        <div className={scss.appCreate_form}>
          <input
            name="name"
            type="text"
            className="form-control"
            placeholder="Название игры"
            required
          />

          <input
            name="password"
            type="password"
            className="form-control"
            placeholder="Пароль для входа"
          />

          <select name="size" className="form-select" required>
            <option disabled>Размер сетки</option>

            {sizes.map((size, i) => (
              <option value={size} key={i}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className={scss.appCreate_btn}>
          <input
            type="submit"
            className="btn btn-primary"
            value="Создать игру"
            disabled={isLoading || !isConnected}
          />
        </div>
      </form>
    </>
  )
}

export default Games
