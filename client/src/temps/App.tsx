import { ReactNode, useEffect } from 'react'
import Games from './Games.tsx'
import Wrapper from './Wrapper.tsx'
import Board from './Board.tsx'
import Alerts from './Alerts.tsx'
import Status from './Status.tsx'
import GameService, { GameEvents } from '../service/GameService.ts'
import useAppStore, { IStore, useAppDispatch, useAppSelector } from '../store/appStore.ts'
import Password from './Password.tsx'
import { defBoard, useGameDispatch, useGameSelector } from '../store/gameStore.ts'
import { GameObj } from '../@types'
import { lsRoleKey, lsStateKey } from '../vars.ts'
import { isWinner } from '../utils.ts'

function App(): ReactNode {
  const arr: (keyof IStore)[] = ['isInGame', 'isConnected', 'myId']
  const { isInGame, isConnected } = useAppSelector(...arr)
  const { gameRole } = useGameSelector('gameRole')
  const pushAlert = useAppStore(s => s.pushAlert)
  const appDispatch = useAppDispatch()
  const gameDispatch = useGameDispatch()

  function clearBoard() {
    appDispatch({ gameId: null, isInGame: false })
    gameDispatch({
      board: defBoard, myStep: false, isStarted: false, gameRole: null,
    })

    localStorage.removeItem(lsRoleKey)
    localStorage.removeItem(lsStateKey)
  }

  function onConnectOpen() {
    appDispatch({ isConnected: true })
  }

  function onConnectEvent(data: GameEvents, id: string | null) {
    switch (data?.event) {
      case 'connect': {
        const { isStarted, ...test } = data.body

        appDispatch(test)
        gameDispatch({ isStarted })
        break
      }
      // Обновление списка игр
      case 'update': {
        if (id === null) {
          pushAlert('error', 'Ошибка клиента, нет myId!')
          return
        }

        const list = data.body as GameObj[]
        const me = list.find(it => it.players.includes(id))

        appDispatch({ games: list, isInGame: me !== undefined })

        if (me !== undefined)
          gameDispatch({ isStarted: me.players[1] !== null })

        break
      }
      // Обновление кол-ва игроков
      case 'refresh':
        appDispatch({ players: data.body })
        break
      case 'step': {
        let obj = null

        gameDispatch(prev => {
          obj = { board: data.body, myStep: !prev.myStep }
          return obj
        })

        localStorage.setItem(lsStateKey, JSON.stringify(obj))
        break
      }
      case 'close':
        pushAlert('warning', 'Игра окончена по причине бездействия одного из игроков')
        clearBoard()
        break
      case 'end': {
        const text = 'Результат игры: '

        if (data.body === -1) {
          pushAlert('warning', text + 'Ничья!')
        } else {
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
      appDispatch({ players: 0, isInGame: false })

      return
    }

    appDispatch({ myId: null, isConnected: false })
  }

  useEffect(() => {
    async function load() {
      await GameService.connect(onConnectOpen, onConnectEvent, onConnectError)
    }

    // async function focus() {
    //   const check = await GameService.check()
    //
    //   if (check)
    //     appDispatch(check)
    //   else
    //     pushAlert('error', 'При обновлении данных произошла ошибка!')
    // }

    window.addEventListener('load', load)
    // window.addEventListener('focus', focus)

    return () => {
      window.removeEventListener('load', load)
      // window.removeEventListener('focus', focus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameRole])

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
