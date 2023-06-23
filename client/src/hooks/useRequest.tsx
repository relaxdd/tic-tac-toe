import { useState } from 'react'

type UseRequest = [() => Promise<boolean>, boolean, string | null]

const useRequest = (callback: () => void): UseRequest => {
  const [isLoading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetching = async () => {
    setError(null)
    setLoading(true)

    try {
      await callback()
      return true
    } catch (e) {
      const err = e as Error
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  return [fetching, isLoading, error]
}

export default useRequest