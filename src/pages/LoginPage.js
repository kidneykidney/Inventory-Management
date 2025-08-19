import React from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InventoryIcon from '@mui/icons-material/Inventory';

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const LoginPage = ({ onLogin }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component='main' maxWidth='xs'>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <InventoryIcon
              sx={{ fontSize: 40, color: 'primary.main', mr: 1 }}
            />
            <Typography component='h1' variant='h4' sx={{ fontWeight: 'bold' }}>
              InvSys
            </Typography>
          </Box>

          <Typography component='h2' variant='h5' sx={{ mb: 3 }}>
            Sign in
          </Typography>

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={(values, { setSubmitting }) => {
              // In a real app, you would validate credentials with an API
              setTimeout(() => {
                onLogin();
                setSubmitting(false);
              }, 1000);
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form style={{ width: '100%' }}>
                <Field
                  as={TextField}
                  fullWidth
                  id='email'
                  name='email'
                  label='Email Address'
                  margin='normal'
                  variant='outlined'
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />

                <Field
                  as={TextField}
                  fullWidth
                  id='password'
                  name='password'
                  label='Password'
                  type={showPassword ? 'text' : 'password'}
                  margin='normal'
                  variant='outlined'
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          aria-label='toggle password visibility'
                          onClick={handleClickShowPassword}
                          edge='end'
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ mt: 1, mb: 2 }}>
                  <Link href='#' variant='body2'>
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type='submit'
                  fullWidth
                  variant='contained'
                  color='primary'
                  size='large'
                  disabled={isSubmitting}
                  sx={{ mt: 2, mb: 2 }}
                >
                  Sign In
                </Button>

                <Typography
                  variant='body2'
                  color='text.secondary'
                  align='center'
                >
                  For demo: Enter any email and password
                </Typography>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
