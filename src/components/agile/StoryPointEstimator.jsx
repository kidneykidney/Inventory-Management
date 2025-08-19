import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Zap, Clock, Users, AlertTriangle } from 'lucide-react';

const StoryPointEstimator = ({ onEstimate, currentEstimate = null }) => {
  const [selectedPoints, setSelectedPoints] = useState(currentEstimate);
  const [showGuidance, setShowGuidance] = useState(false);

  const fibonacciPoints = [
    {
      value: 1,
      label: '1',
      description: 'Very Simple',
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    {
      value: 2,
      label: '2',
      description: 'Simple',
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    {
      value: 3,
      label: '3',
      description: 'Medium',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    {
      value: 5,
      label: '5',
      description: 'Complex',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      value: 8,
      label: '8',
      description: 'Very Complex',
      color: 'bg-red-100 text-red-800 border-red-200',
    },
    {
      value: 13,
      label: '13',
      description: 'Extremely Complex',
      color: 'bg-red-100 text-red-800 border-red-200',
    },
    {
      value: 21,
      label: '21',
      description: 'Epic (Break Down)',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  ];

  const estimationFactors = [
    {
      icon: <Clock className='h-5 w-5' />,
      title: 'Time Complexity',
      description: 'How long will this take to implement?',
      levels: ['< 1 day', '1-2 days', '3-5 days', '1-2 weeks', '> 2 weeks'],
    },
    {
      icon: <Zap className='h-5 w-5' />,
      title: 'Technical Complexity',
      description: 'How technically challenging is this?',
      levels: ['Trivial', 'Simple', 'Moderate', 'Complex', 'Very Complex'],
    },
    {
      icon: <Users className='h-5 w-5' />,
      title: 'Team Knowledge',
      description: 'How familiar is the team with this area?',
      levels: ['Expert', 'Experienced', 'Some Knowledge', 'Limited', 'Unknown'],
    },
    {
      icon: <AlertTriangle className='h-5 w-5' />,
      title: 'Risk & Uncertainty',
      description: 'What are the unknowns and risks?',
      levels: ['None', 'Low', 'Medium', 'High', 'Very High'],
    },
  ];

  const handlePointSelection = points => {
    setSelectedPoints(points);
    if (onEstimate) {
      onEstimate(points);
    }
  };

  const getPointGuidance = points => {
    switch (points) {
      case 1:
        return {
          title: '1 Point - Very Simple',
          description: 'Quick fix, well-understood, minimal risk',
          examples: ['Fix typo', 'Update text', 'Simple configuration change'],
          timeEstimate: '< 1 day',
        };
      case 2:
        return {
          title: '2 Points - Simple',
          description: 'Straightforward implementation, low complexity',
          examples: [
            'Add validation',
            'Simple UI change',
            'Basic CRUD operation',
          ],
          timeEstimate: '1-2 days',
        };
      case 3:
        return {
          title: '3 Points - Medium',
          description: 'Moderate complexity, some unknowns',
          examples: ['New component', 'API integration', 'Database changes'],
          timeEstimate: '2-3 days',
        };
      case 5:
        return {
          title: '5 Points - Complex',
          description: 'Significant work, multiple components affected',
          examples: [
            'Feature with multiple screens',
            'Complex business logic',
            'Third-party integration',
          ],
          timeEstimate: '3-5 days',
        };
      case 8:
        return {
          title: '8 Points - Very Complex',
          description: 'Large feature, high complexity, significant unknowns',
          examples: ['Major feature', 'System redesign', 'Complex algorithm'],
          timeEstimate: '1-2 weeks',
        };
      case 13:
        return {
          title: '13 Points - Extremely Complex',
          description: 'Very large feature, many unknowns, high risk',
          examples: [
            'Major system overhaul',
            'New architecture',
            'Complex integration',
          ],
          timeEstimate: '2-3 weeks',
        };
      case 21:
        return {
          title: '21 Points - Epic Size',
          description: 'Too large for a single story - should be broken down',
          examples: ['Complete new module', 'Major system rewrite'],
          timeEstimate: '> 3 weeks',
          warning: 'Consider breaking this down into smaller stories',
        };
      default:
        return null;
    }
  };

  const selectedGuidance = selectedPoints
    ? getPointGuidance(selectedPoints)
    : null;

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5' />
            Story Point Estimation
          </CardTitle>
          <CardDescription>
            Select story points based on complexity, effort, and risk. Use the
            Fibonacci sequence for relative sizing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6'>
            {fibonacciPoints.map(point => (
              <Button
                key={point.value}
                variant={selectedPoints === point.value ? 'default' : 'outline'}
                className={`h-20 flex flex-col items-center justify-center ${
                  selectedPoints === point.value ? '' : 'hover:bg-gray-50'
                }`}
                onClick={() => handlePointSelection(point.value)}
              >
                <span className='text-2xl font-bold'>{point.label}</span>
                <span className='text-xs text-gray-600 mt-1'>
                  {point.description}
                </span>
              </Button>
            ))}
          </div>

          {selectedGuidance && (
            <Card className='bg-blue-50 border-blue-200'>
              <CardContent className='p-4'>
                <h4 className='font-semibold text-blue-900 mb-2'>
                  {selectedGuidance.title}
                </h4>
                <p className='text-blue-800 text-sm mb-3'>
                  {selectedGuidance.description}
                </p>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  <div>
                    <h5 className='font-medium text-blue-900 mb-1'>
                      Examples:
                    </h5>
                    <ul className='text-blue-700 space-y-1'>
                      {selectedGuidance.examples.map((example, index) => (
                        <li key={index} className='flex items-start'>
                          <span className='text-blue-400 mr-2'>•</span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className='font-medium text-blue-900 mb-1'>
                      Time Estimate:
                    </h5>
                    <p className='text-blue-700'>
                      {selectedGuidance.timeEstimate}
                    </p>
                    {selectedGuidance.warning && (
                      <div className='mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-xs'>
                        <AlertTriangle className='h-4 w-4 inline mr-1' />
                        {selectedGuidance.warning}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className='flex justify-between items-center mt-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowGuidance(!showGuidance)}
            >
              {showGuidance ? 'Hide' : 'Show'} Estimation Guide
            </Button>

            {selectedPoints && (
              <Badge className='text-sm'>
                Selected: {selectedPoints} story points
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {showGuidance && (
        <Card>
          <CardHeader>
            <CardTitle>Estimation Factors</CardTitle>
            <CardDescription>
              Consider these factors when estimating story points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {estimationFactors.map((factor, index) => (
                <div key={index} className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <div className='text-blue-600'>{factor.icon}</div>
                    <h4 className='font-semibold text-gray-900'>
                      {factor.title}
                    </h4>
                  </div>
                  <p className='text-sm text-gray-600'>{factor.description}</p>
                  <div className='flex flex-wrap gap-2'>
                    {factor.levels.map((level, levelIndex) => (
                      <Badge
                        key={levelIndex}
                        variant='outline'
                        className={`text-xs ${
                          levelIndex === 0
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : levelIndex === 1
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : levelIndex === 2
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : levelIndex === 3
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoryPointEstimator;
