interface Window {
  umami?: {
    track: (event: string, props?: Record<string, unknown>) => void
  }
}
