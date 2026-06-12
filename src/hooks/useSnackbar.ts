import { useCallback } from 'react'
import { useSnackbar as useNotistack } from '../components/SnackbarProvider'

export function useSnackbar() {
  const { enqueueSnackbar, closeSnackbar } = useNotistack()

  const success = useCallback((message: string) => {
    enqueueSnackbar(message, 'success')
  }, [enqueueSnackbar])

  const error = useCallback((message: string) => {
    enqueueSnackbar(message, 'error')
  }, [enqueueSnackbar])

  const warning = useCallback((message: string) => {
    enqueueSnackbar(message, 'warning')
  }, [enqueueSnackbar])

  const info = useCallback((message: string) => {
    enqueueSnackbar(message, 'info')
  }, [enqueueSnackbar])

  return { success, error, warning, info, closeSnackbar }
}
