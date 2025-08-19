import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { useThemeContext } from '../utils/ThemeContext';
import { logger } from '../utils/logger';

/**
 * SettingsPage component for application settings
 * Allows configuring app appearance, notifications, etc.
 * @returns {JSX.Element} SettingsPage component
 */
const SettingsPage = () => {
  // Get theme context
  const { darkMode, toggleTheme } = useThemeContext();

  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    lowStockThreshold: 5,
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    autoLogout: 30,
  });

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  /**
   * Handle settings change
   * @param {string} name - Setting name
   * @param {any} value - Setting value
   */
  const handleSettingChange = (name, value) => {
    logger.debug(`Setting "${name}" changed to:`, value);
    setSettings({
      ...settings,
      [name]: value,
    });
  };

  /**
   * Handle switch toggle
   * @param {Event} event - Change event
   */
  const handleSwitchChange = event => {
    const { name, checked } = event.target;
    handleSettingChange(name, checked);
  };

  /**
   * Handle form input change
   * @param {Event} event - Change event
   */
  const handleInputChange = event => {
    const { name, value } = event.target;
    handleSettingChange(name, value);
  };

  /**
   * Save settings
   */
  const handleSaveSettings = () => {
    logger.info('Saving settings', settings);

    // In a real app, would save to backend
    // apiService.saveSettings(settings)

    setAlert({
      open: true,
      message: 'Settings saved successfully',
      severity: 'success',
    });
  };

  /**
   * Close alert
   */
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  /**
   * Handle theme toggle
   */
  const handleThemeToggle = () => {
    logger.info(`Theme mode switched to ${darkMode ? 'light' : 'dark'}`);
    toggleTheme();
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Appearance Settings */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, backgroundColor: 'primary.main' }}>
              <Typography variant='h6' sx={{ color: 'white' }}>
                Appearance
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={handleThemeToggle}
                    name='darkMode'
                    color='primary'
                  />
                }
                label='Dark Mode'
              />

              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id='language-label'>Language</InputLabel>
                  <Select
                    labelId='language-label'
                    id='language'
                    name='language'
                    value={settings.language}
                    label='Language'
                    onChange={handleInputChange}
                  >
                    <MenuItem value='en'>English</MenuItem>
                    <MenuItem value='hi'>Hindi</MenuItem>
                    <MenuItem value='ta'>Tamil</MenuItem>
                    <MenuItem value='te'>Telugu</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id='currency-label'>Currency</InputLabel>
                  <Select
                    labelId='currency-label'
                    id='currency'
                    name='currency'
                    value={settings.currency}
                    label='Currency'
                    onChange={handleInputChange}
                  >
                    <MenuItem value='INR'>Indian Rupee (₹)</MenuItem>
                    <MenuItem value='USD'>US Dollar ($)</MenuItem>
                    <MenuItem value='EUR'>Euro (€)</MenuItem>
                    <MenuItem value='GBP'>British Pound (£)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id='date-format-label'>Date Format</InputLabel>
                  <Select
                    labelId='date-format-label'
                    id='dateFormat'
                    name='dateFormat'
                    value={settings.dateFormat}
                    label='Date Format'
                    onChange={handleInputChange}
                  >
                    <MenuItem value='DD/MM/YYYY'>DD/MM/YYYY</MenuItem>
                    <MenuItem value='MM/DD/YYYY'>MM/DD/YYYY</MenuItem>
                    <MenuItem value='YYYY-MM-DD'>YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, backgroundColor: 'primary.main' }}>
              <Typography variant='h6' sx={{ color: 'white' }}>
                Notifications
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={handleSwitchChange}
                    name='notifications'
                    color='primary'
                  />
                }
                label='Enable Notifications'
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailAlerts}
                    onChange={handleSwitchChange}
                    name='emailAlerts'
                    color='primary'
                  />
                }
                label='Email Alerts'
              />

              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label='Low Stock Threshold'
                  name='lowStockThreshold'
                  type='number'
                  value={settings.lowStockThreshold}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Items with quantity below this threshold will be marked as 'Low Stock'"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, backgroundColor: 'primary.main' }}>
              <Typography variant='h6' sx={{ color: 'white' }}>
                Security
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                label='Auto Logout (minutes)'
                name='autoLogout'
                type='number'
                value={settings.autoLogout}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
                helperText='Set to 0 to disable auto logout'
              />

              <Box sx={{ mt: 3 }}>
                <Button variant='outlined' color='primary' sx={{ mr: 2 }}>
                  Change Password
                </Button>

                <Button variant='outlined' color='error'>
                  Reset to Defaults
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 2,
              backgroundColor: 'info.light',
              color: 'info.contrastText',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InfoOutlinedIcon sx={{ mr: 1 }} />
                <Typography variant='h6'>System Information</Typography>
              </Box>
              <Typography variant='body2'>Version: 1.0.0</Typography>
              <Typography variant='body2'>Database: MySQL</Typography>
              <Typography variant='body2'>Last Backup: Never</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant='contained'
          color='primary'
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          size='large'
        >
          Save Settings
        </Button>
      </Box>

      {/* Alert message */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant='filled'
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
