import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class NotificationService {
  // Email notification methods
  async sendSprintNotification(sprintId, type, recipients) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/notifications/sprint`,
        {
          sprintId,
          type, // 'start', 'end', 'review', 'retrospective'
          recipients,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to send sprint notification:', error);
      throw error;
    }
  }

  async sendStoryNotification(storyId, type, recipients) {
    try {
      const response = await axios.post(`${API_BASE_URL}/notifications/story`, {
        storyId,
        type, // 'assigned', 'completed', 'blocked'
        recipients,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send story notification:', error);
      throw error;
    }
  }

  // In-app notification methods
  async getNotifications(userId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/user/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/user/${userId}/read-all`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Feedback collection methods
  async submitFeedback(feedbackData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/feedback`,
        feedbackData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  async getFeedback(sprintId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/feedback/sprint/${sprintId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      throw error;
    }
  }
}

export default new NotificationService();
