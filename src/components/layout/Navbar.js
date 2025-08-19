import React from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useThemeContext } from '../../utils/ThemeContext';
import { logger } from '../../utils/logger';
import NotificationCenter from '../notifications/NotificationCenter';

/**
 * Navbar component for the application header
 * Contains app title, theme toggle, notifications, and user menu
 * @param {Object} props - Component props
 * @param {Function} props.onLogout - Logout function
 * @returns {JSX.Element} Navbar component
 */
const Navbar = ({ onLogout }) => {
  // Theme context for dark/light mode toggle
  const { darkMode, toggleTheme } = useThemeContext();

  // User menu anchor element
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  /**
   * Open user menu
   * @param {Event} event - Click event
   */
  const handleMenuClick = event => {
    logger.debug('User menu opened');
    setAnchorEl(event.currentTarget);
  };

  /**
   * Close user menu
   */
  const handleMenuClose = () => {
    logger.debug('User menu closed');
    setAnchorEl(null);
  };

  /**
   * Handle theme toggle
   */
  const handleThemeToggle = () => {
    logger.info(`Theme switched to ${darkMode ? 'light' : 'dark'} mode`);
    toggleTheme();
  };

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    logger.info('User logged out');
    handleMenuClose();
    onLogout();
  };

  return (
    <AppBar 
      position='static' 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <IconButton
          edge='start'
          color='inherit'
          aria-label='menu'
          sx={{ 
            mr: 2, 
            display: { sm: 'none' },
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        <Typography 
          variant='h6' 
          component='div' 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            fontSize: '1.3rem',
            background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}
        >
          Inventory Management System
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Theme toggle button */}
          <Tooltip
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <IconButton 
              color='inherit' 
              onClick={handleThemeToggle}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <NotificationCenter userId="current-user" />

          {/* User menu */}
          <Tooltip title='Account'>
            <IconButton
              color='inherit'
              onClick={handleMenuClick}
              aria-controls={open ? 'user-menu' : undefined}
              aria-haspopup='true'
              aria-expanded={open ? 'true' : undefined}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* User menu dropdown */}
        <Menu
          id='user-menu'
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: '12px',
              minWidth: '180px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.1)'
            },
            '& .MuiMenuItem-root': {
              borderRadius: '8px',
              margin: '4px 8px',
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.1)'
              }
            }
          }}
        >
          <MenuItem component={Link} to='/profile' onClick={handleMenuClose}>
            <ListItemIcon>
              <PersonIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>

          <MenuItem component={Link} to='/settings' onClick={handleMenuClose}>
            <ListItemIcon>
              <SettingsIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize='small' color='error' />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
