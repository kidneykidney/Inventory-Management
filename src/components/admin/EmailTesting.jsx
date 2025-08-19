import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { Send, Eye, TestTube, Mail } from 'lucide-react';

const EmailTesting = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [testData, setTestData] = useState({
    borrowerName: 'John Doe',
    productName: 'MacBook Pro 16"',
    lendDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    returnDate: new Date().toISOString().split('T')[0],
    condition: 'excellent',
    lendingId: 'LT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    daysUntilDue: 3,
    daysOverdue: 2,
    approverName: 'Admin User',
    productSpecs: 'M1 Pro, 16GB RAM, 512GB SSD'
  });
  const [testEmail, setTestEmail] = useState('');
  const [previewContent, setPreviewContent] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

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
        setTemplates(data.data.filter(template => template.is_active));
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

  const handleGeneratePreview = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Please select a template first',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('inventory_auth_token');
      const response = await fetch('/api/v1/admin/email-templates/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          data: testData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.data);
        setPreviewOpen(true);
      } else {
        throw new Error('Failed to generate preview');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate email preview',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      toast({
        title: 'Error',
        description: 'Please select a template and enter a test email address',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('inventory_auth_token');
      const response = await fetch('/api/v1/admin/email-templates/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          testEmail: testEmail,
          data: testData
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Test email sent successfully'
        });
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleTestDataChange = (field, value) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTemplateLabel = (template) => {
    const typeLabels = {
      lending_confirmation: 'Lending Confirmation',
      return_reminder: 'Return Reminder',
      overdue_notice: 'Overdue Notice',
      return_confirmation: 'Return Confirmation',
      lending_request_approval: 'Request Approval'
    };
    return `${template.name} (${typeLabels[template.type] || template.type})`;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Email Template Testing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Mail className="w-4 h-4" />
            <AlertDescription>
              Use this tool to test email templates with sample data. You can preview how emails will look 
              and send test emails to verify delivery and formatting.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Select Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template to test" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {getTemplateLabel(template)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address to receive test"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleGeneratePreview}
                  disabled={generating || !selectedTemplate}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {generating ? 'Generating...' : 'Preview'}
                </Button>
                <Button
                  onClick={handleSendTestEmail}
                  disabled={sending || !selectedTemplate || !testEmail}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
            </div>

            {/* Test Data */}
            <div className="space-y-4">
              <Label>Test Data</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="borrowerName" className="text-xs">Borrower Name</Label>
                    <Input
                      id="borrowerName"
                      value={testData.borrowerName}
                      onChange={(e) => handleTestDataChange('borrowerName', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productName" className="text-xs">Product Name</Label>
                    <Input
                      id="productName"
                      value={testData.productName}
                      onChange={(e) => handleTestDataChange('productName', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="lendDate" className="text-xs">Lend Date</Label>
                    <Input
                      id="lendDate"
                      type="date"
                      value={testData.lendDate}
                      onChange={(e) => handleTestDataChange('lendDate', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate" className="text-xs">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={testData.dueDate}
                      onChange={(e) => handleTestDataChange('dueDate', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="daysUntilDue" className="text-xs">Days Until Due</Label>
                    <Input
                      id="daysUntilDue"
                      type="number"
                      value={testData.daysUntilDue}
                      onChange={(e) => handleTestDataChange('daysUntilDue', parseInt(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="daysOverdue" className="text-xs">Days Overdue</Label>
                    <Input
                      id="daysOverdue"
                      type="number"
                      value={testData.daysOverdue}
                      onChange={(e) => handleTestDataChange('daysOverdue', parseInt(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition" className="text-xs">Condition</Label>
                    <Select value={testData.condition} onValueChange={(value) => handleTestDataChange('condition', value)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="productSpecs" className="text-xs">Product Specifications</Label>
                  <Textarea
                    id="productSpecs"
                    value={testData.productSpecs}
                    onChange={(e) => handleTestDataChange('productSpecs', e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="lendingId" className="text-xs">Lending ID</Label>
                    <Input
                      id="lendingId"
                      value={testData.lendingId}
                      onChange={(e) => handleTestDataChange('lendingId', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="approverName" className="text-xs">Approver Name</Label>
                    <Input
                      id="approverName"
                      value={testData.approverName}
                      onChange={(e) => handleTestDataChange('approverName', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          {previewContent && (
            <div className="space-y-4">
              <div>
                <Label>Subject:</Label>
                <p className="font-mono bg-gray-50 p-2 rounded">{previewContent.subject}</p>
              </div>
              <div>
                <Label>HTML Content:</Label>
                <div 
                  className="border rounded p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewContent.html }}
                />
              </div>
              <div>
                <Label>Text Content:</Label>
                <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {previewContent.text}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTesting;