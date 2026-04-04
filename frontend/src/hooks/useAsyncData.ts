import { useState, useEffect, type DependencyList } from 'react'

/**
 * Generic hook for async data fetching with loading and error state.
 *
 * @example
 * const { data: posts, loading, error } = useAsyncData(fetchPosts, [])
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  initialData: T,
  deps: DependencyList = [],
): { data: T; loading: boolean; error: boolean } {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetcher()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
    // deps are passed by the caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
