import React, { useState, useEffect } from 'react';
import { AlertTriangle, Code, Clock, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

/**
 * Technical Debt Dashboard component for tracking and managing technical debt
 */
const TechnicalDebtDashboard = () => {
  const [technicalDebtItems, setTechnicalDebtItems] = useState([
    {
      id: 1,
      title: 'Migrate Material-UI to Shadcn UI',
      description: 'Replace remaining Material-UI components with modern Shadcn UI components',
      category: 'UI Framework',
      priority: 'high',
      effort: 8,
      impact: 'high',
      status: 'in-progress',
      assignee: 'Frontend Team',
      createdDate: '2024-01-15',
      dueDate: '2024-02-15',
      tags: ['ui', 'migration', 'modernization'],
      relatedFiles: [
        'src/pages/InventoryPage.js',
        'src/components/layout/Navbar.js',
        'src/components/layout/Sidebar.js'
      ]
    },
    {
      id: 2,
      title: 'Implement proper error handling in API routes',
      description: 'Add comprehensive error handling and logging to all API endpoints',
      category: 'Backend',
      priority: 'medium',
      effort: 5,
      impact: 'medium',
      status: 'todo',
      assignee: 'Backend Team',
      createdDate: '2024-01-20',
      dueDate: '2024-03-01',
      tags: ['error-handling', 'api', 'reliability'],
      relatedFiles: [
        'server/routes/inventory.js',
        'server/routes/products.js',
        'server/routes/orders.js'
      ]
    },
    {
      id: 3,
      title: 'Add comprehensive unit tests for utility functions',
      description: 'Increase test coverage for utility functions to meet 80% threshold',
      category: 'Testing',
      priority: 'medium',
      effort: 6,
      impact: 'medium',
      status: 'todo',
      assignee: 'QA Team',
      createdDate: '2024-01-25',
      dueDate: '2024-02-28',
      tags: ['testing', 'coverage', 'quality'],
      relatedFiles: [
        'src/utils/currencyFormatter.js',
        'src/utils/logger.js',
        'src/utils/performanceTracker.js'
      ]
    },
    {
      id: 4,
      title: 'Optimize database queries for better performance',
      description: 'Review and optimize slow database queries identified in performance monitoring',
      category: 'Performance',
      priority: 'high',
      effort: 4,
      impact: 'high',
      status: 'todo',
      assignee: 'Backend Team',
      createdDate: '2024-02-01',
      dueDate: '2024-02-20',
      tags: ['performance', 'database', 'optimization'],
      relatedFiles: [
        'server/models/agileModels.js',
        'server/models/userModels.js'
      ]
    }
  ]);

  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Calculate metrics
  const metrics = {
    totalItems: technicalDebtItems.length,
    highPriorityItems: technicalDebtItems.filter(item => item.priority === 'high').length,
    inProgressItems: technicalDebtItems.filter(item => item.status === 'in-progress').length,
    completedItems: technicalDebtItems.filter(item => item.status === 'completed').length,
    totalEffort: technicalDebtItems.reduce((sum, item) => sum + item.effort, 0),
    averageAge: Math.round(
      technicalDebtItems.reduce((sum, item) => {
        const age = Math.floor((new Date() - new Date(item.createdDate)) / (1000 * 60 * 60 * 24));
        return sum + age;
      }, 0) / technicalDebtItems.length
    )
  };

  // Filter items
  const filteredItems = technicalDebtItems.filter(item => {
    const matchesCategory = filterCategory === '' || item.category === filterCategory;
    const matchesPriority = filterPriority === '' || item.priority === filterPriority;
    const matchesStatus = filterStatus === '' || item.status === filterStatus;
    return matchesCategory && matchesPriority && matchesStatus;
  });

  // Get unique categories
  const categories = [...new Set(technicalDebtItems.map(item => item.category))];

  // Priority colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'todo': return 'outline';
      default: return 'outline';
    }
  };

  // Calculate completion percentage
  const completionPercentage = Math.round((metrics.completedItems / metrics.totalItems) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technical Debt Management</h1>
          <p className="text-muted-foreground">Track and manage technical debt across the codebase</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Technical Debt
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalEffort} story points total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.highPriorityItems}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.inProgressItems}</div>
            <p className="text-xs text-muted-foreground">
              Currently being addressed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
            <Progress value={completionPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Technical Debt Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Debt Items</CardTitle>
          <CardDescription>
            {filteredItems.length} items found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Effort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{item.effort}</span>
                      <span className="text-xs text-muted-foreground">SP</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status)}>
                      {item.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.assignee}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Debt by Category</CardTitle>
            <CardDescription>Distribution of technical debt across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map(category => {
                const categoryItems = technicalDebtItems.filter(item => item.category === category);
                const percentage = Math.round((categoryItems.length / technicalDebtItems.length) * 100);
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{category}</span>
                      <span>{categoryItems.length} items ({percentage}%)</span>
                    </div>
                    <Progress value={percentage} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Technical debt items by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['high', 'medium', 'low'].map(priority => {
                const priorityItems = technicalDebtItems.filter(item => item.priority === priority);
                const percentage = Math.round((priorityItems.length / technicalDebtItems.length) * 100);
                
                return (
                  <div key={priority} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{priority} Priority</span>
                      <span>{priorityItems.length} items ({percentage}%)</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={priority === 'high' ? 'bg-red-100' : priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicalDebtDashboard;