import { Component } from 'react'
import { Box, Typography, Button } from '@mui/material'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2, p: 4 }}>
          <Typography variant="h5" color="error">Algo deu errado</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, textAlign: 'center' }}>
            {this.state.error?.message || 'Erro inesperado ao renderizar esta página.'}
          </Typography>
          <Button variant="contained" onClick={this.handleRetry}>Tentar novamente</Button>
        </Box>
      )
    }

    return this.props.children
  }
}
