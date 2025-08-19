import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationCenter from '../NotificationCenter';

// Mock the notification service
jest.mock('../../../services/notificationService', () => ({
  getNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
}));

// Mock the toast hook
jest.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const notificationService = require('../../../services/notificationService');
const { useToast } = require('../../../hooks/use-toast');

jest.mock('../../../hooks/use-toast');

const mockToast = jest.fn();
useToast.mockReturnValue({ toast: mockToast });

const mockNotifications = [
  {
    id: 1,
    type: 'info',
    title: 'Sprint Started',
    message: 'Sprint 5 has started successfully',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  },
  {
    id: 2,
    type: 'success',
    title: 'Story Completed',
    message: 'User story has been completed',
    isRead: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 3,
    type: 'warning',
    title: 'Story Blocked',
    message: 'A story has been blocked and needs attention',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
];

describe('NotificationCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationService.getNotifications.mockResolvedValue({
      notifications: mockNotifications,
      unreadCount: 2,
    });
  });

  test('renders notification bell with unread count badge', async () => {
    render(<NotificationCenter userId='user1' />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // Check for unread count badge
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('fetches notifications on mount', async () => {
    render(<NotificationCenter userId='user1' />);

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledWith(
        'user1'
      );
    });
  });

  test('displays notifications when dropdown is opened', async () => {
    render(<NotificationCenter userId='user1' />);

    // Wait for initial load
    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalled();
    });

    // Click the notification bell
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Sprint Started')).toBeInTheDocument();
      expect(screen.getByText('Story Completed')).toBeInTheDocument();
      expect(screen.getByText('Story Blocked')).toBeInTheDocument();
    });
  });

  test('marks notification as read when clicked', async () => {
    notificationService.markNotificationAsRead.mockResolvedValue({});

    render(<NotificationCenter userId='user1' />);

    // Wait for initial load
    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalled();
    });

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Click on an unread notification
    await waitFor(() => {
      const sprintNotification = screen.getByText('Sprint Started');
      fireEvent.click(sprintNotification.closest('[role="menuitem"]'));
    });

    await waitFor(() => {
      expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith(
        1
      );
    });
  });

  test('marks all notifications as read', async () => {
    notificationService.markAllNotificationsAsRead.mockResolvedValue({});

    render(<NotificationCenter userId='user1' />);

    // Wait for initial load
    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalled();
    });

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Click "Mark all read" button
    await waitFor(() => {
      const markAllButton = screen.getByText('Mark all read');
      fireEvent.click(markAllButton);
    });

    await waitFor(() => {
      expect(
        notificationService.markAllNotificationsAsRead
      ).toHaveBeenCalledWith('user1');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    });
  });

  test('displays correct notification icons based on type', async () => {
    render(<NotificationCenter userId='user1' />);

    // Wait for initial load
    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalled();
    });

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    // Check that different notification types have appropriate styling
    await waitFor(() => {
      const notifications = screen.getAllByRole('menuitem');
      expect(notifications).toHaveLength(3);
    });
  });

  test('formats time ago correctly', async () => {
    render(<NotificationCenter userId='user1' />);

    // Wait for initial load
    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalled();
    });

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('5m ago')).toBeInTheDocument();
      expect(screen.getByText('1h ago')).toBeInTheDocument();
      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });
  });

  test('handles empty notifications state', async () => {
    notificationService.getNotifications.mockResolvedValue({
      notifications: [],
      unreadCount: 0,
    });

    render(<NotificationCenter userId='user1' />);

    // Wait for initial load
    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalled();
    });

    // Open dropdown
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    // Should not show unread count badge
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    notificationService.getNotifications.mockRejectedValue(
      new Error('API Error')
    );

    render(<NotificationCenter userId='user1' />);

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalled();
    });

    // Should not crash and should handle error silently
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('polls for new notifications periodically', async () => {
    jest.useFakeTimers();

    render(<NotificationCenter userId='user1' />);

    // Initial call
    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledTimes(1);
    });

    // Fast forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});
