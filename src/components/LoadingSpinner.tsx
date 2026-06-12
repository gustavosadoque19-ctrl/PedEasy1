import { Box, CircularProgress } from '@mui/material'

interface Props {
  minHeight?: number
}

export function LoadingSpinner({ minHeight = 300 }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight }}>
      <CircularProgress size={32} />
    </Box>
  )
}
