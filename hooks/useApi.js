'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Generic hook to handle API calls with loading and error states.
 * 
 * @param {Function} apiFunc The API function to call (e.g., getClubs)
 * @param {boolean} immediate Whether to run the call immediately on mount
 * @param {...any} initialArgs Initial arguments to pass to the apiFunc
 */
export default function useApi(apiFunc, immediate = true, ...initialArgs) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...runArgs) => {
    setLoading(true)
    setError(null)
    try {
      // Use function call arguments if provided, otherwise fall back to initial hook arguments
      const argsToUse = runArgs.length > 0 ? runArgs : initialArgs
      const response = await apiFunc(...argsToUse)
      setData(response.data)
      return response.data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunc]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    data,
    loading,
    error,
    execute,
    setData
  }
}
