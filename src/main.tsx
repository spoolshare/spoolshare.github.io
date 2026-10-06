import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { router } from './App'
import { ToastProvider } from '@/components/ui/Toast'
import { InventoryPanelProvider } from '@/components/filament/InventoryPanel'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <InventoryPanelProvider>
        <RouterProvider router={router} />
      </InventoryPanelProvider>
    </ToastProvider>
  </StrictMode>,
)
