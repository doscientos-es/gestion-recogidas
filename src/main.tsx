import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { queryClient, router } from '@/app/router'
import { AuthenticationGate } from '@/features/auth/ui/authentication-gate'
import { OperationsProvider } from '@/features/operations/application/operations-context'

import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) throw new Error('No se ha encontrado el elemento raíz de la aplicación.')

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthenticationGate>
        <OperationsProvider>
          <RouterProvider router={router} />
        </OperationsProvider>
      </AuthenticationGate>
    </QueryClientProvider>
  </StrictMode>,
)
