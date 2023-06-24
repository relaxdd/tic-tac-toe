import { FormEvent, useRef, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { useAppDispatch, useAppSelector } from '../store/appStore.ts'
import GameService from '../service/GameService.ts'
import useRequest from '../hooks/useRequest.tsx'
import { lsGameKey, lsRoleKey } from '../vars.ts'
import { useGameDispatch } from '../store/gameStore.ts'

const Password = () => {
  const appDispatch = useAppDispatch()
  const gameDispatch = useGameDispatch()
  const { isVisible, myId } = useAppSelector('isVisible', 'myId')
  // const addAlert = useAppStore(s => s.addAlert)
  const [password, setPassword] = useState('')
  const ref = useRef<HTMLFormElement | null>(null)

  const [fetching, isLoading, error] = useRequest(async () => {
    if (!password) throw new Error('Введите пароль комнаты!')
    const gameId = localStorage.getItem(lsGameKey)
    if (!gameId || !myId) throw new Error('Непредвиденная ошибка клиента!')
    const result = await GameService.joinToGame(gameId, myId, password)
    if (!result.status) throw new Error(result.error)
  })

  function onCloseHandler() {
    appDispatch({ isVisible: false })
  }

  async function onJoinToGame(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const ok = await fetching()
    const gameId = localStorage.getItem(lsGameKey)

    if (ok) {
      gameDispatch({ gameRole: 'client' })
      appDispatch({ isInGame: true, gameId, isVisible: false })

      localStorage.setItem(lsRoleKey, 'client')
      localStorage.removeItem(lsGameKey)
    }
  }

  return (
    <Modal show={isVisible} backdrop="static" onHide={onCloseHandler}>
      <Modal.Header closeButton>
        <Modal.Title>Введите пароль</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form id="entry-password" ref={ref} onSubmit={onJoinToGame}>
          <input
            type="password"
            className="form-control"
            value={password}
            placeholder="Пароль комнаты"
            onChange={({ target }) => setPassword(target.value.trim())}
            required
          />

          {error && (
            <p className="small mt-2 mb-0 text-danger">{error}</p>
          )}
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCloseHandler} disabled={isLoading}>
          Отмена
        </Button>
        <Button type="submit" form="entry-password" variant="primary" disabled={isLoading}>
          Присоединиться
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default Password