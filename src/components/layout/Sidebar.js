import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import CodeIcon from '@mui/icons-material/Code';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Lending System', icon: <HandshakeIcon />, path: '/lending' },
  { text: 'Products', icon: <CategoryIcon />, path: '/products' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/orders' },
  { text: 'Suppliers', icon: <PeopleIcon />, path: '/suppliers' },
  { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
  { text: 'Technical Debt', icon: <CodeIcon />, path: '/technical-debt' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <Drawer
      variant='permanent'
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        ['& .MuiDrawer-paper']: {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          // Add responsive styles
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '4px',
          },
        },
        display: { xs: 'none', sm: 'block' },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 8, p: 2 }}>
        <List
          sx={{
            '& .MuiListItem-root': {
              mb: 1,
              borderRadius: '12px',
              overflow: 'hidden',
            },
          }}
        >
          {menuItems.map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  minHeight: 48,
                  color: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    transform: 'translateX(4px)',
                    transition: 'all 0.3s ease',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.25)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 40,
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.2rem',
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      fontSize: '0.95rem',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider
          sx={{
            borderColor: 'rgba(255,255,255,0.2)',
            mt: 2,
            mx: 1,
          }}
        />
      </Box>
    </Drawer>
  );
};

export default Sidebar;
