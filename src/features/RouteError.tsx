import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { LogoMark } from '@/components/layout/Logo'

export function RouteError() {
  const err = useRouteError()
  const message = isRouteErrorResponse(err) ? `${err.status} ${err.statusText}` : err instanceof Error ? err.message : 'Unknown error'
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div>
        <LogoMark size={40} className="mx-auto" />
        <h1 className="mt-4 text-xl font-semibold">Something jammed in the extruder.</h1>
        <p className="mt-2 text-sm text-fg-muted">{message}</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg">Back to Explore</Link>
      </div>
    </div>
  )
}
