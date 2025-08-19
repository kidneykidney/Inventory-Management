import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { logger } from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our logger system
    logger.error('UI Error caught by ErrorBoundary:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
          }}
        >
          <Paper
            elevation={3}
            sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}
          >
            <Typography variant='h5' gutterBottom color='error'>
              Something went wrong
            </Typography>

            <Typography variant='body1' sx={{ mb: 3 }}>
              We're sorry, an error has occurred. Please try reloading the page.
            </Typography>

            <Button
              variant='contained'
              onClick={() => window.location.reload()}
              sx={{ mr: 2 }}
            >
              Reload Page
            </Button>

            <Button variant='outlined' onClick={() => window.history.back()}>
              Go Back
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
