import useGameStore, { useGameDispatch } from '../store/gameStore.ts'
import GameApiService from '../service/GameApiService.ts'
import useAppStore, { useAppDispatch, useAppSelector } from '../store/appStore.ts'
import scss from './modules/Board.module.scss'

const Text = ({ gameRole }: { gameRole: string }) => {
  return (
    <p>{gameRole === 'server'
      ? 'Ожидание подключения второго игрока...'
      : 'Ожидание начала игры первым игроком...'
    }</p>
  )
}

const Board = () => {
  const { gameRole, isStarted, isMyStep, board, offline } = useGameStore()
  const { myId, gameId, isConnected } = useAppSelector('myId', 'gameId', 'isConnected')
  const appDispatch = useAppDispatch()
  const gameDispatch = useGameDispatch()
  const pushAlert = useAppStore(s => s.pushAlert)

  async function onBoardClick(r: number, c: number) {
    if (offline) {
      pushAlert('warning', 'Опонент по игре вышел из сети')
      return
    }

    if (!isMyStep) {
      pushAlert('warning', 'Дождитесь пока сходит соперник')
      return
    }

    if (!myId || !gameId) {
      pushAlert('error', 'Ошибка клиента, нет myId или gameId')
      return
    }

    if (board?.[r]?.[c] !== null) return

    await GameApiService.boardStep(r, c, myId, gameId)
  }

  function getCeilText(val: null | 0 | 1) {
    switch (val) {
      case null:
        return ''
      case 0:
        return 'o'
      case 1:
        return 'x'
    }
  }

  async function cancelGame() {
    if (!myId || !gameId) return
    await GameApiService.cancelGame(myId, gameId)

    appDispatch({ gameId: null, isInGame: false })
    gameDispatch({ gameRole: null, board: null, isMyStep: false, isStarted: false })
  }

  if (!gameRole) return null

  return (
    <div className="text-center text-lg-left">
      {!isStarted ? (
          <>
            <Text gameRole={gameRole}/>
            <input
              type="button"
              value="Отмена"
              className="btn btn-secondary"
              disabled={!isConnected}
              onClick={cancelGame}
            />
          </>
        )
        : (
          <>
            <div className={scss.board}>
              {board !== null
                ? board?.map((row, r) => (
                  <div className={scss.boardRow} key={r}>
                    {row.map((ceil, c) => (
                      <span
                        className={scss.boardCeil}
                        onClick={() => onBoardClick(r, c)}
                        key={c}
                      >{getCeilText(ceil)}</span>
                    ))}
                  </div>
                ))
                : (
                  <p className="text-danger">Ошибка игры, не удалось отрисовать доску!</p>
                )}
            </div>

            <div>
              <p className={scss.text}>
                {isMyStep ? 'Ваш ход' : 'Ход соперника'}
              </p>

              {offline && (
                <span className="small text-danger">Опонент не в сети</span>
              )}
            </div>
          </>
        )}
    </div>
  )
}

export default Board
