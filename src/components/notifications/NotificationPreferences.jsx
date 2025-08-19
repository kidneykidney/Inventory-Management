import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    reminder_enabled: true,
    overdue_enabled: true,
    confirmation_enabled: true,
    reminder_days_before: 3
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('inventory_auth_token');
      const response = await fetch('/api/v1/email-notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
      } else {
        throw new Error('Failed to fetch preferences');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('inventory_auth_token');
      const response = await fetch('/api/v1/email-notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Notification preferences updated successfully'
        });
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            Configure your email notification preferences for lending activities.
            These settings control when and how you receive email notifications.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_enabled">Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Enable or disable all email notifications
              </p>
            </div>
            <Switch
              id="email_enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handlePreferenceChange('email_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminder_enabled">Return Reminders</Label>
              <p className="text-sm text-gray-500">
                Receive reminders before items are due
              </p>
            </div>
            <Switch
              id="reminder_enabled"
              checked={preferences.reminder_enabled}
              onCheckedChange={(checked) => handlePreferenceChange('reminder_enabled', checked)}
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="overdue_enabled">Overdue Notices</Label>
              <p className="text-sm text-gray-500">
                Receive notifications when items are overdue
              </p>
            </div>
            <Switch
              id="overdue_enabled"
              checked={preferences.overdue_enabled}
              onCheckedChange={(checked) => handlePreferenceChange('overdue_enabled', checked)}
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="confirmation_enabled">Confirmations</Label>
              <p className="text-sm text-gray-500">
                Receive confirmations for lending and return activities
              </p>
            </div>
            <Switch
              id="confirmation_enabled"
              checked={preferences.confirmation_enabled}
              onCheckedChange={(checked) => handlePreferenceChange('confirmation_enabled', checked)}
              disabled={!preferences.email_enabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder_days_before">Reminder Days Before Due Date</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="reminder_days_before"
                type="number"
                min="1"
                max="30"
                value={preferences.reminder_days_before}
                onChange={(e) => handlePreferenceChange('reminder_days_before', parseInt(e.target.value))}
                disabled={!preferences.email_enabled || !preferences.reminder_enabled}
                className="w-20"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
            <p className="text-sm text-gray-500">
              How many days before the due date should we send reminder emails?
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="min-w-[100px]"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;