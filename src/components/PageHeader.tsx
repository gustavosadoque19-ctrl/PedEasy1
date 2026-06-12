import { Box, Typography, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

interface Props {
  title: string
  onNew?: () => void
  newLabel?: string
  children?: React.ReactNode
}

export function PageHeader({ title, onNew, newLabel = 'Novo', children }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
      <Typography variant="h5">{title}</Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {children}
        {onNew && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onNew}>
            {newLabel}
          </Button>
        )}
      </Box>
    </Box>
  )
}
