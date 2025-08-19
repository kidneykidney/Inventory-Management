import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { Eye, Edit, Plus, Save, X } from 'lucide-react';

const EmailTemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  const templateTypes = [
    { value: 'lending_confirmation', label: 'Lending Confirmation' },
    { value: 'return_reminder', label: 'Return Reminder' },
    { value: 'overdue_notice', label: 'Overdue Notice' },
    { value: 'return_confirmation', label: 'Return Confirmation' },
    { value: 'lending_request_approval', label: 'Lending Request Approval' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    subject: '',
    html_content: '',
    text_content: '',
    is_active: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('inventory_auth_token');
      const response = await fetch('/api/v1/admin/email-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content,
      is_active: template.is_active
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      type: '',
      subject: '',
      html_content: '',
      text_content: '',
      is_active: true
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('inventory_auth_token');
      const url = selectedTemplate 
        ? `/api/v1/admin/email-templates/${selectedTemplate.id}`
        : '/api/v1/admin/email-templates';
      
      const method = selectedTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Template ${selectedTemplate ? 'updated' : 'created'} successfully`
        });
        setIsEditing(false);
        setIsCreating(false);
        fetchTemplates();
      } else {
        throw new Error(`Failed to ${selectedTemplate ? 'update' : 'create'} template`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${selectedTemplate ? 'update' : 'create'} template`,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedTemplate(null);
    setFormData({
      name: '',
      type: '',
      subject: '',
      html_content: '',
      text_content: '',
      is_active: true
    });
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTypeLabel = (type) => {
    const typeObj = templateTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
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

  if (isEditing || isCreating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {isCreating ? 'Create Email Template' : 'Edit Email Template'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Enter template name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Template Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleFormChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template type" />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleFormChange('subject', e.target.value)}
              placeholder="Enter email subject (use {{variables}} for dynamic content)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="html_content">HTML Content</Label>
            <Textarea
              id="html_content"
              value={formData.html_content}
              onChange={(e) => handleFormChange('html_content', e.target.value)}
              placeholder="Enter HTML email content"
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text_content">Text Content</Label>
            <Textarea
              id="text_content"
              value={formData.text_content}
              onChange={(e) => handleFormChange('text_content', e.target.value)}
              placeholder="Enter plain text email content"
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleFormChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active Template</Label>
          </div>

          <Alert>
            <AlertDescription>
              Available variables: {`{borrowerName}`}, {`{productName}`}, {`{lendDate}`}, {`{dueDate}`}, {`{returnDate}`}, {`{condition}`}, {`{lendingId}`}, {`{daysUntilDue}`}, {`{daysOverdue}`}, {`{approverName}`}
            </AlertDescription>
          </Alert>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Email Templates</CardTitle>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No email templates found. Create your first template to get started.
              </div>
            ) : (
              templates.map(template => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {getTypeLabel(template.type)}
                      </p>
                      <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                        {template.subject}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Subject:</Label>
                <p className="font-mono bg-gray-50 p-2 rounded">{selectedTemplate.subject}</p>
              </div>
              <div>
                <Label>HTML Content:</Label>
                <div 
                  className="border rounded p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content }}
                />
              </div>
              <div>
                <Label>Text Content:</Label>
                <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
                  {selectedTemplate.text_content}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplateManagement;