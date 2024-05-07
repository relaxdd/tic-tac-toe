import { FC, ReactNode, useEffect, useState } from 'react'
import useAppStore, { AlertTypes, IAlert, useAppDispatch } from '../store/appStore.ts'
import scss from './modules/Alert.module.scss'

type IAlertId = IAlert & { id: string };

interface AlertItemProps {
  value: IAlertId;
  onHide: (id: string) => void;
}

/* ========================================= */

const types: Record<AlertTypes, string> = {
  success: scss.success!,
  warning: scss.warning!,
  error: scss.error!,
}

const AlertItem: FC<AlertItemProps> = ({ value, onHide }) => {
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (closing || value.type === 'error') return
    const time = value.type === 'success' ? 6000 : 7000
    const tick = setTimeout(() => initHide(), time)

    return () => {
      clearTimeout(tick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing])

  function initHide() {
    setClosing(true)
    setTimeout(() => onHide(value.id), 500)
  }

  return (
    <div
      className={`${scss.alertItem} ${types[value.type]} ${closing ? scss.alertItem_closing : ''}`}
    >
      <span className={scss.alertItem_text}>{value.text}</span>
      <span className={scss.alertItem_close} onClick={initHide}>
        X
      </span>
    </div>
  )
}

/* ========================================= */

const Alerts = (): ReactNode => {
  const alerts = useAppStore(s => s.alerts)
  const dispatch = useAppDispatch()

  if (!alerts.length) return null

  function onHideHandler(id: string) {
    dispatch((prev) => ({ alerts: prev.alerts.filter((it) => it.id !== id) }))
  }

  return (
    <div className={scss.alertWrapper}>
      {alerts.map((it) => (
        <AlertItem value={it} onHide={onHideHandler} key={it.id}/>
      ))}
    </div>
  )
}

export default Alerts
