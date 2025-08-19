import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

/**
 * Code Quality Metrics Dashboard component
 */
const CodeQualityMetrics = () => {
  const [qualityMetrics, setQualityMetrics] = useState({
    testCoverage: {
      overall: 65.4,
      frontend: 72.1,
      backend: 58.7,
      target: 80,
      trend: 'up',
      change: 5.2
    },
    codeComplexity: {
      average: 3.2,
      high: 12,
      medium: 34,
      low: 156,
      target: 2.5,
      trend: 'down',
      change: -0.3
    },
    technicalDebt: {
      ratio: 15.2,
      hours: 240,
      trend: 'down',
      change: -2.1
    },
    codeSmells: {
      total: 89,
      critical: 3,
      major: 15,
      minor: 71,
      trend: 'down',
      change: -12
    },
    duplicatedCode: {
      percentage: 4.2,
      lines: 1250,
      blocks: 23,
      trend: 'up',
      change: 0.8
    },
    maintainabilityIndex: {
      score: 78.5,
      excellent: 45,
      good: 89,
      poor: 18,
      trend: 'up',
      change: 3.2
    }
  });

  const [fileMetrics, setFileMetrics] = useState([
    {
      file: 'src/pages/InventoryPage.js',
      coverage: 45.2,
      complexity: 8.5,
      codeSmells: 12,
      duplicatedLines: 45,
      maintainability: 62.3,
      status: 'needs-attention'
    },
    {
      file: 'src/components/agile/BacklogManagement.jsx',
      coverage: 89.1,
      complexity: 2.1,
      codeSmells: 2,
      duplicatedLines: 0,
      maintainability: 91.2,
      status: 'excellent'
    },
    {
      file: 'server/routes/lending.js',
      coverage: 95.5,
      complexity: 1.8,
      codeSmells: 1,
      duplicatedLines: 0,
      maintainability: 94.7,
      status: 'excellent'
    },
    {
      file: 'src/utils/performanceTracker.js',
      coverage: 25.8,
      complexity: 6.2,
      codeSmells: 8,
      duplicatedLines: 23,
      maintainability: 58.9,
      status: 'needs-attention'
    },
    {
      file: 'server/models/agileModels.js',
      coverage: 78.3,
      complexity: 3.4,
      codeSmells: 4,
      duplicatedLines: 12,
      maintainability: 82.1,
      status: 'good'
    }
  ]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'needs-attention': return 'destructive';
      default: return 'outline';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend, change) => {
    if (trend === 'up') {
      return <TrendingUp className={`h-4 w-4 ${change > 0 ? 'text-green-600' : 'text-red-600'}`} />;
    } else {
      return <TrendingDown className={`h-4 w-4 ${change < 0 ? 'text-green-600' : 'text-red-600'}`} />;
    }
  };

  // Get coverage color
  const getCoverageColor = (coverage, target = 80) => {
    if (coverage >= target) return 'text-green-600';
    if (coverage >= target * 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Code Quality Metrics</h1>
        <p className="text-muted-foreground">Monitor code quality and technical health indicators</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Test Coverage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
            <div className="flex items-center gap-2">
              {getTrendIcon(qualityMetrics.testCoverage.trend, qualityMetrics.testCoverage.change)}
              <span className="text-xs text-muted-foreground">
                {qualityMetrics.testCoverage.change > 0 ? '+' : ''}{qualityMetrics.testCoverage.change}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.testCoverage.overall}%</div>
            <Progress 
              value={qualityMetrics.testCoverage.overall} 
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Target: {qualityMetrics.testCoverage.target}%</span>
              <span className={getCoverageColor(qualityMetrics.testCoverage.overall, qualityMetrics.testCoverage.target)}>
                {qualityMetrics.testCoverage.overall >= qualityMetrics.testCoverage.target ? 'On Target' : 'Below Target'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Code Complexity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Complexity</CardTitle>
            <div className="flex items-center gap-2">
              {getTrendIcon(qualityMetrics.codeComplexity.trend, qualityMetrics.codeComplexity.change)}
              <span className="text-xs text-muted-foreground">
                {qualityMetrics.codeComplexity.change > 0 ? '+' : ''}{qualityMetrics.codeComplexity.change}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.codeComplexity.average}</div>
            <div className="text-xs text-muted-foreground mt-1">Average cyclomatic complexity</div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-red-600">High: {qualityMetrics.codeComplexity.high}</span>
              <span className="text-yellow-600">Medium: {qualityMetrics.codeComplexity.medium}</span>
              <span className="text-green-600">Low: {qualityMetrics.codeComplexity.low}</span>
            </div>
          </CardContent>
        </Card>

        {/* Technical Debt */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Technical Debt</CardTitle>
            <div className="flex items-center gap-2">
              {getTrendIcon(qualityMetrics.technicalDebt.trend, qualityMetrics.technicalDebt.change)}
              <span className="text-xs text-muted-foreground">
                {qualityMetrics.technicalDebt.change > 0 ? '+' : ''}{qualityMetrics.technicalDebt.change}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.technicalDebt.ratio}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {qualityMetrics.technicalDebt.hours} hours estimated
            </div>
            <Progress 
              value={qualityMetrics.technicalDebt.ratio} 
              className="mt-2 bg-red-100"
            />
          </CardContent>
        </Card>

        {/* Code Smells */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Smells</CardTitle>
            <div className="flex items-center gap-2">
              {getTrendIcon(qualityMetrics.codeSmells.trend, qualityMetrics.codeSmells.change)}
              <span className="text-xs text-muted-foreground">
                {qualityMetrics.codeSmells.change > 0 ? '+' : ''}{qualityMetrics.codeSmells.change}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.codeSmells.total}</div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-red-600">Critical: {qualityMetrics.codeSmells.critical}</span>
              <span className="text-yellow-600">Major: {qualityMetrics.codeSmells.major}</span>
              <span className="text-blue-600">Minor: {qualityMetrics.codeSmells.minor}</span>
            </div>
          </CardContent>
        </Card>

        {/* Duplicated Code */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicated Code</CardTitle>
            <div className="flex items-center gap-2">
              {getTrendIcon(qualityMetrics.duplicatedCode.trend, qualityMetrics.duplicatedCode.change)}
              <span className="text-xs text-muted-foreground">
                {qualityMetrics.duplicatedCode.change > 0 ? '+' : ''}{qualityMetrics.duplicatedCode.change}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.duplicatedCode.percentage}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {qualityMetrics.duplicatedCode.lines} lines in {qualityMetrics.duplicatedCode.blocks} blocks
            </div>
            <Progress 
              value={qualityMetrics.duplicatedCode.percentage} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Maintainability Index */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintainability</CardTitle>
            <div className="flex items-center gap-2">
              {getTrendIcon(qualityMetrics.maintainabilityIndex.trend, qualityMetrics.maintainabilityIndex.change)}
              <span className="text-xs text-muted-foreground">
                {qualityMetrics.maintainabilityIndex.change > 0 ? '+' : ''}{qualityMetrics.maintainabilityIndex.change}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.maintainabilityIndex.score}</div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-green-600">Excellent: {qualityMetrics.maintainabilityIndex.excellent}</span>
              <span className="text-blue-600">Good: {qualityMetrics.maintainabilityIndex.good}</span>
              <span className="text-red-600">Poor: {qualityMetrics.maintainabilityIndex.poor}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Test Coverage Breakdown</CardTitle>
          <CardDescription>Coverage metrics by component type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Frontend Components</span>
                <span className={getCoverageColor(qualityMetrics.testCoverage.frontend)}>
                  {qualityMetrics.testCoverage.frontend}%
                </span>
              </div>
              <Progress value={qualityMetrics.testCoverage.frontend} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Backend Services</span>
                <span className={getCoverageColor(qualityMetrics.testCoverage.backend)}>
                  {qualityMetrics.testCoverage.backend}%
                </span>
              </div>
              <Progress value={qualityMetrics.testCoverage.backend} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File-Level Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>File-Level Quality Metrics</CardTitle>
          <CardDescription>Quality metrics for individual files</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Complexity</TableHead>
                <TableHead>Code Smells</TableHead>
                <TableHead>Duplicated Lines</TableHead>
                <TableHead>Maintainability</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fileMetrics.map((file, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="font-mono text-sm">{file.file}</div>
                  </TableCell>
                  <TableCell>
                    <span className={getCoverageColor(file.coverage)}>
                      {file.coverage}%
                    </span>
                  </TableCell>
                  <TableCell>{file.complexity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {file.codeSmells > 5 && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                      {file.codeSmells}
                    </div>
                  </TableCell>
                  <TableCell>{file.duplicatedLines}</TableCell>
                  <TableCell>
                    <span className={getCoverageColor(file.maintainability)}>
                      {file.maintainability}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(file.status)}>
                      {file.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeQualityMetrics;