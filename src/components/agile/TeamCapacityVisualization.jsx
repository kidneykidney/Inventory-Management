import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { 
  Users, 
  Clock, 
  Target,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';

/**
 * Team Capacity Visualization Component
 * Displays team capacity with progress bars and avatar groups
 */
const TeamCapacityVisualization = ({ data, sprint }) => {
  if (!data || !data.teamMembers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Team Capacity
          </CardTitle>
          <CardDescription>Team workload and capacity visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-32 text-muted-foreground'>
            No team capacity data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const { teamMembers, totalCapacity, totalAllocated, utilizationRate } = data;

  // Calculate team statistics
  const availableCapacity = totalCapacity - totalAllocated;
  const isOverAllocated = totalAllocated > totalCapacity;
  const utilizationPercentage = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

  // Get utilization status
  const getUtilizationStatus = () => {
    if (utilizationPercentage > 100) {
      return {
        status: 'over-allocated',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: AlertCircle,
        label: 'Over-allocated',
      };
    } else if (utilizationPercentage >= 85) {
      return {
        status: 'optimal',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: CheckCircle,
        label: 'Optimal',
      };
    } else if (utilizationPercentage >= 70) {
      return {
        status: 'good',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: Target,
        label: 'Good',
      };
    } else {
      return {
        status: 'under-utilized',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: Clock,
        label: 'Under-utilized',
      };
    }
  };

  const utilizationStatus = getUtilizationStatus();
  const StatusIcon = utilizationStatus.icon;

  // Get member utilization color
  const getMemberUtilizationColor = (allocated, capacity) => {
    const percentage = capacity > 0 ? (allocated / capacity) * 100 : 0;
    if (percentage > 100) return 'bg-red-500';
    if (percentage >= 85) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  // Get member status
  const getMemberStatus = (allocated, capacity) => {
    const percentage = capacity > 0 ? (allocated / capacity) * 100 : 0;
    if (percentage > 100) return 'Over-allocated';
    if (percentage >= 85) return 'Optimal';
    if (percentage >= 70) return 'Good';
    return 'Available';
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Team Capacity
            </CardTitle>
            <CardDescription>
              Sprint {sprint?.number} team workload and capacity visualization
            </CardDescription>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${utilizationStatus.bgColor}`}>
            <StatusIcon className={`h-4 w-4 ${utilizationStatus.color}`} />
            <div className='text-sm'>
              <div className={`font-medium ${utilizationStatus.color}`}>
                {utilizationStatus.label}
              </div>
              <div className='text-xs text-muted-foreground'>
                {Math.round(utilizationPercentage)}% Utilized
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Overall Team Capacity */}
        <div className='space-y-4'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-semibold'>Overall Team Capacity</h3>
            <Badge 
              className={
                isOverAllocated 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }
            >
              {totalAllocated}/{totalCapacity} hours
            </Badge>
          </div>
          
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Capacity Utilization</span>
              <span className='font-medium'>{Math.round(utilizationPercentage)}%</span>
            </div>
            <Progress 
              value={Math.min(utilizationPercentage, 100)} 
              className='h-3'
              indicatorClassName={
                isOverAllocated 
                  ? 'bg-red-500' 
                  : utilizationPercentage >= 85 
                    ? 'bg-green-500' 
                    : 'bg-blue-500'
              }
            />
            {isOverAllocated && (
              <div className='text-xs text-red-600 flex items-center gap-1'>
                <AlertCircle className='h-3 w-3' />
                Team is over-allocated by {totalAllocated - totalCapacity} hours
              </div>
            )}
          </div>

          <div className='grid grid-cols-3 gap-4 pt-2'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>{totalCapacity}</div>
              <div className='text-sm text-muted-foreground'>Total Capacity</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>{totalAllocated}</div>
              <div className='text-sm text-muted-foreground'>Allocated</div>
            </div>
            <div className='text-center'>
              <div className={`text-2xl font-bold ${isOverAllocated ? 'text-red-600' : 'text-orange-600'}`}>
                {isOverAllocated ? 0 : availableCapacity}
              </div>
              <div className='text-sm text-muted-foreground'>Available</div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Team Members</h3>
          
          {/* Avatar Group Overview */}
          <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
            <div className='flex -space-x-2'>
              {teamMembers.slice(0, 6).map((member, index) => (
                <Avatar key={member.id} className='border-2 border-white'>
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className='text-xs'>
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {teamMembers.length > 6 && (
                <div className='flex items-center justify-center w-10 h-10 bg-gray-200 border-2 border-white rounded-full text-xs font-medium'>
                  +{teamMembers.length - 6}
                </div>
              )}
            </div>
            <div>
              <div className='font-medium'>{teamMembers.length} Team Members</div>
              <div className='text-sm text-muted-foreground'>
                Average utilization: {Math.round(utilizationPercentage)}%
              </div>
            </div>
          </div>

          {/* Individual Member Capacity */}
          <div className='space-y-3'>
            {teamMembers.map((member) => {
              const memberUtilization = member.capacity > 0 
                ? (member.allocated / member.capacity) * 100 
                : 0;
              const isOverAllocatedMember = member.allocated > member.capacity;
              
              return (
                <div key={member.id} className='p-4 border rounded-lg space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium'>{member.name}</div>
                        <div className='text-sm text-muted-foreground'>{member.role}</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <Badge 
                        className={
                          isOverAllocatedMember
                            ? 'bg-red-100 text-red-800'
                            : memberUtilization >= 85
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {getMemberStatus(member.allocated, member.capacity)}
                      </Badge>
                      <div className='text-sm text-muted-foreground mt-1'>
                        {member.allocated}/{member.capacity}h
                      </div>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Capacity</span>
                      <span className='font-medium'>{Math.round(memberUtilization)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(memberUtilization, 100)} 
                      className='h-2'
                      indicatorClassName={getMemberUtilizationColor(member.allocated, member.capacity)}
                    />
                    {isOverAllocatedMember && (
                      <div className='text-xs text-red-600 flex items-center gap-1'>
                        <AlertCircle className='h-3 w-3' />
                        Over-allocated by {member.allocated - member.capacity} hours
                      </div>
                    )}
                  </div>

                  {/* Member's assigned stories */}
                  {member.assignedStories && member.assignedStories.length > 0 && (
                    <div className='pt-2 border-t'>
                      <div className='text-sm font-medium mb-2'>
                        Assigned Stories ({member.assignedStories.length})
                      </div>
                      <div className='flex flex-wrap gap-1'>
                        {member.assignedStories.slice(0, 3).map((story) => (
                          <Badge key={story.id} variant='outline' className='text-xs'>
                            {story.title.length > 20 
                              ? `${story.title.substring(0, 20)}...` 
                              : story.title
                            }
                          </Badge>
                        ))}
                        {member.assignedStories.length > 3 && (
                          <Badge variant='outline' className='text-xs'>
                            +{member.assignedStories.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Capacity Planning Insights */}
        <div className='p-4 bg-blue-50 rounded-lg'>
          <h4 className='font-medium text-blue-900 mb-2'>Capacity Planning Insights</h4>
          <div className='space-y-1 text-sm text-blue-800'>
            {isOverAllocated && (
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-4 w-4 text-red-600' />
                <span>Consider redistributing work or extending sprint timeline</span>
              </div>
            )}
            {utilizationPercentage < 70 && (
              <div className='flex items-center gap-2'>
                <Target className='h-4 w-4 text-orange-600' />
                <span>Team has additional capacity for more work</span>
              </div>
            )}
            {utilizationPercentage >= 85 && utilizationPercentage <= 100 && (
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>Team capacity is optimally utilized</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCapacityVisualization;