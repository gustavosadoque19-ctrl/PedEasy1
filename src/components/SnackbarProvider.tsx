import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { Snackbar, Alert, type AlertColor } from '@mui/material'

interface SnackbarItem {
  id: number
  message: string
  severity: AlertColor
}

interface SnackbarContextType {
  enqueueSnackbar: (message: string, severity?: AlertColor) => void
  closeSnackbar: (id?: number) => void
}

const SnackbarContext = createContext<SnackbarContextType>({
  enqueueSnackbar: () => {},
  closeSnackbar: () => {},
})

// eslint-disable-next-line react-refresh/only-export-components
export function useSnackbar() {
  return useContext(SnackbarContext)
}

let nextId = 0

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarItem[]>([])

  const enqueueSnackbar = useCallback((message: string, severity: AlertColor = 'info') => {
    const id = ++nextId
    setItems(prev => [...prev, { id, message, severity }])
  }, [])

  const closeSnackbar = useCallback((id?: number) => {
    setItems(prev => id ? prev.filter(i => i.id !== id) : [])
  }, [])

  const handleClose = (id: number) => () => closeSnackbar(id)

  return (
    <SnackbarContext value={{ enqueueSnackbar, closeSnackbar }}>
      {children}
      {items.map(item => (
        <Snackbar key={item.id} open autoHideDuration={4000} onClose={handleClose(item.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert onClose={handleClose(item.id)} severity={item.severity} variant="filled" sx={{ width: '100%' }}>
            {item.message}
          </Alert>
        </Snackbar>
      ))}
    </SnackbarContext>
  )
}
