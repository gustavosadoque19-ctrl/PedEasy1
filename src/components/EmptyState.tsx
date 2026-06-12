import { Box, Typography } from '@mui/material'
import InboxIcon from '@mui/icons-material/Inbox'

interface Props {
  message?: string
}

export function EmptyState({ message = 'Nenhum registro encontrado' }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1 }}>
      <InboxIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography variant="body1" color="text.secondary">{message}</Typography>
    </Box>
  )
}
