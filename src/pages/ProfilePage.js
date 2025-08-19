import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Grid,
  Divider,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { logger } from '../utils/logger';

/**
 * ProfilePage component for user profile management
 * Allows viewing and editing user profile information
 * @returns {JSX.Element} ProfilePage component
 */
const ProfilePage = () => {
  // Demo user data
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 9876543210',
    role: 'Inventory Manager',
    department: 'Operations',
    joinDate: '2022-05-15',
    address: 'Whitefield, Bangalore, Karnataka, India - 560066',
  });

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...userData });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  /**
   * Handle field change in edit mode
   * @param {Event} e - Input change event
   */
  const handleChange = e => {
    const { name, value } = e.target;
    logger.debug('Profile field changed', { field: name, value });
    setEditedData({
      ...editedData,
      [name]: value,
    });
  };

  /**
   * Enable edit mode
   */
  const handleEdit = () => {
    logger.info('Profile edit mode enabled');
    setIsEditing(true);
    setEditedData({ ...userData });
  };

  /**
   * Save profile changes
   */
  const handleSave = () => {
    logger.info('Profile data saved', editedData);
    setUserData({ ...editedData });
    setIsEditing(false);

    // Show success message
    setSnackbar({
      open: true,
      message: 'Profile updated successfully',
      severity: 'success',
    });
  };

  /**
   * Cancel edit mode without saving
   */
  const handleCancel = () => {
    logger.info('Profile edit cancelled');
    setIsEditing(false);
    setEditedData({ ...userData });
  };

  /**
   * Close snackbar alert
   */
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Log component mount
  useEffect(() => {
    logger.info('ProfilePage component mounted');

    // In a real app, would fetch user data from API
    // Example: fetchUserProfile(userId)

    return () => {
      logger.info('ProfilePage component unmounted');
    };
  }, []);

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        User Profile
      </Typography>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Profile Header */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 3,
          }}
        >
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2rem',
            }}
          >
            {userData.name
              .split(' ')
              .map(n => n[0])
              .join('')}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant='h5' gutterBottom>
              {userData.name}
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              {userData.role}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {userData.department}
            </Typography>
          </Box>

          {!isEditing ? (
            <IconButton
              color='primary'
              onClick={handleEdit}
              sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}
            >
              <EditIcon />
            </IconButton>
          ) : (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignSelf: { xs: 'center', sm: 'flex-start' },
              }}
            >
              <IconButton color='primary' onClick={handleSave}>
                <SaveIcon />
              </IconButton>
              <IconButton color='error' onClick={handleCancel}>
                <CancelIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Profile Details */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Full Name'
                name='name'
                value={isEditing ? editedData.name : userData.name}
                onChange={handleChange}
                disabled={!isEditing}
                margin='normal'
                variant={isEditing ? 'outlined' : 'filled'}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Email Address'
                name='email'
                value={isEditing ? editedData.email : userData.email}
                onChange={handleChange}
                disabled={!isEditing}
                margin='normal'
                variant={isEditing ? 'outlined' : 'filled'}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Phone Number'
                name='phone'
                value={isEditing ? editedData.phone : userData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                margin='normal'
                variant={isEditing ? 'outlined' : 'filled'}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Department'
                name='department'
                value={isEditing ? editedData.department : userData.department}
                onChange={handleChange}
                disabled={!isEditing}
                margin='normal'
                variant={isEditing ? 'outlined' : 'filled'}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Role'
                name='role'
                value={isEditing ? editedData.role : userData.role}
                onChange={handleChange}
                disabled={!isEditing}
                margin='normal'
                variant={isEditing ? 'outlined' : 'filled'}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Join Date'
                name='joinDate'
                type='date'
                value={isEditing ? editedData.joinDate : userData.joinDate}
                onChange={handleChange}
                disabled={!isEditing}
                margin='normal'
                variant={isEditing ? 'outlined' : 'filled'}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Address'
                name='address'
                multiline
                rows={3}
                value={isEditing ? editedData.address : userData.address}
                onChange={handleChange}
                disabled={!isEditing}
                margin='normal'
                variant={isEditing ? 'outlined' : 'filled'}
                InputProps={{
                  readOnly: !isEditing,
                }}
              />
            </Grid>
          </Grid>

          {isEditing && (
            <Box
              sx={{
                mt: 3,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
              }}
            >
              <Button variant='outlined' color='error' onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant='contained' color='primary' onClick={handleSave}>
                Save Changes
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Success/Error notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant='filled'
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
