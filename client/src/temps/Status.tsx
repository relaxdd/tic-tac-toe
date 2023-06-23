import scss from './modules/Status.module.scss'
import useAppStore from '../store/appStore.ts'

const Status = () => {
  const connected = useAppStore(s => s.isConnected)

  return (
    <div className={scss.statusWrapper}>
      <span className={scss.statusText}>Status</span>
      <div className={`${scss.statusPing} ${connected ? scss.statusPing_connected : ''}`}></div>
    </div>
  )
}

export default Status