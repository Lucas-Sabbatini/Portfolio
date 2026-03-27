export function useAnalytics() {
  const track = (event: string, props?: Record<string, unknown>) => {
    window.umami?.track(event, props)
  }
  return { track }
}
