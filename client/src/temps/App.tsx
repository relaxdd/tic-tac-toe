import { ReactNode, useEffect } from 'react'
import Games from './Games.tsx'
import Wrapper from './Wrapper.tsx'
import Board from './Board.tsx'
import Alerts from './Alerts.tsx'
import Status from './Status.tsx'
import GameService from '../service/GameService.ts'
import useAppStore, { IStore, useAppDispatch, useAppSelector } from '../store/appStore.ts'
import Password from './Password.tsx'
import { useGameDispatch } from '../store/gameStore.ts'
import { lsRoleKey } from '../vars.ts'
import { isWinner } from '../utils.ts'
import type { GameEvents } from '../@types'
import { GameEventNames } from '../../../shared/@types/enums.ts'

function App(): ReactNode {
  const arr: (keyof IStore)[] = ['isInGame', 'isConnected', 'myId']
  const { isInGame, isConnected } = useAppSelector(...arr)
  const pushAlert = useAppStore(s => s.pushAlert)
  const appDispatch = useAppDispatch()
  const gameDispatch = useGameDispatch()

  function clearBoard() {
    appDispatch({ gameId: null, isInGame: false })
    gameDispatch({
      board: null, isMyStep: false, isStarted: false, gameRole: null, offline: false
    })

    localStorage.removeItem(lsRoleKey)
  }

  function onConnectOpen() {
    appDispatch({ isConnected: true })
  }

  function onConnectEvent(data: GameEvents) {
    switch (data?.event) {
      case GameEventNames.Offline:
        gameDispatch({ offline: data.body })
        break
      case GameEventNames.Connect:
        appDispatch(data.body.base)

        if (data.body.game !== undefined) {
          gameDispatch(data.body.game)
        }

        break
      case GameEventNames.Update:
        appDispatch({ games: data.body })
        break
      case GameEventNames.Refresh:
        appDispatch({ players: data.body })
        break
      case GameEventNames.Start:
        gameDispatch({
          isMyStep: data.body.role === 'server',
          isStarted: true,
          gameRole: data.body.role,
          board: data.body.board
        })

        if (data.body.role !== null)
          localStorage.setItem(lsRoleKey, data.body.role)

        break
      case GameEventNames.Step:
        gameDispatch((prev) => ({
          board: data.body, isMyStep: !prev.isMyStep,
        }))

        break
      case GameEventNames.Close:
        pushAlert('warning', 'Игра окончена по причине бездействия одного из игроков')
        clearBoard()
        break
      case GameEventNames.Endgame: {
        const text = 'Результат игры: '

        if (data.body === -1)
          pushAlert('warning', text + 'Ничья!')
        else {
          // FIXME: Пофиксить потом
          const role = localStorage.getItem(lsRoleKey)
          const isWin = isWinner(role, data.body)

          pushAlert(
            isWin ? 'success' : 'warning',
            text + (isWin ? 'Вы победили' : 'Вы проиграли'),
          )
        }

        clearBoard()
        break
      }
      default:
        console.warn(data)
    }
  }

  function onConnectError(final: boolean) {
    if (final) {
      const error = 'Ошибка подключения к серверу, возможно он недоступен'

      pushAlert('error', error)
      appDispatch({ players: 0, isInGame: false, games: [] })

      return
    }

    appDispatch({ myId: null, isConnected: false })
  }

  useEffect(() => {
    GameService.connect(onConnectOpen, onConnectEvent, onConnectError)
  }, [])

  return (
    <>
      <Wrapper>{isInGame && isConnected ? <Board/> : <Games/>}</Wrapper>
      <Password/>
      <Alerts/>
      <Status/>
    </>
  )
}

export default App
