import { ReactNode } from 'react'
import scss from './modules/App.module.scss'
import useAppStore from '../store/appStore.ts'

const Wrapper = ({ children }: { children: ReactNode }) => {
  const players = useAppStore(s => s.players)

  return (
    <div className="container-lg">
      <div className="row">
        <div className="col-12 col-lg-8">
          <h3 className={scss.appTitle}>Tic Tac Toe</h3>

          <div className="row flex-column-reverse justify-content-lg-between flex-lg-row">
            <div className="col-12 col-lg-3">
              <span className={scss.appLeftText}>Всего в сети: {players}</span>
            </div>
            <div className="col-12 col-lg-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wrapper
