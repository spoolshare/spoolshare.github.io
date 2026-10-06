import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { router } from './App'
import { ToastProvider } from '@/components/ui/Toast'
import { InventoryPanelProvider } from '@/components/filament/InventoryPanel'
import { api } from '@/lib/api'
import { invalidate } from '@/lib/hooks/useQuery'
import './styles/index.css'

// Refetch everything when the session changes (sign-in via email link, other tab, sign-out).
api.onAuthChange(() => invalidate())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <InventoryPanelProvider>
        <RouterProvider router={router} />
      </InventoryPanelProvider>
    </ToastProvider>
  </StrictMode>,
)
