# Sprint Planning API Documentation

This document describes the sprint planning API endpoints and services implemented for task 3.2.

## Overview

The sprint planning API provides comprehensive functionality for:

- Sprint CRUD operations
- Sprint planning algorithms for story selection
- Velocity calculation and burndown chart data generation
- Sprint capacity management and story allocation
- Integration tests for sprint planning workflows

## API Endpoints

### Sprint Management

#### GET /api/v1/sprints

Get all sprints with optional filtering and metrics.

**Query Parameters:**

- `status` (optional): Filter by sprint status (planning, active, review, complete)
- `limit` (optional): Limit number of results

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "sprint-uuid",
      "number": 1,
      "startDate": "2024-01-15",
      "endDate": "2024-01-29",
      "goal": "Complete sprint planning features",
      "status": "planning",
      "capacity": 20,
      "storyCount": 5,
      "totalStoryPoints": 18,
      "completedStoryPoints": 0
    }
  ]
}
```

#### GET /api/v1/sprints/:id

Get detailed sprint information with metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "sprintInfo": {
      "id": "sprint-uuid",
      "number": 1,
      "goal": "Complete sprint planning features",
      "status": "planning",
      "capacity": 20
    },
    "storyMetrics": {
      "totalStories": 5,
      "totalStoryPoints": 18,
      "storiesByStatus": {
        "todo": 3,
        "in-progress": 1,
        "review": 1,
        "done": 0
      }
    },
    "capacityMetrics": {
      "allocatedPoints": 18,
      "remainingCapacity": 2,
      "utilizationRate": 90
    }
  }
}
```

#### POST /api/v1/sprints

Create a new sprint.

**Request Body:**

```json
{
  "number": 2,
  "startDate": "2024-02-01",
  "endDate": "2024-02-15",
  "goal": "Implement user authentication",
  "capacity": 25
}
```

#### PUT /api/v1/sprints/:id

Update an existing sprint.

#### DELETE /api/v1/sprints/:id

Delete a sprint (only if no stories are assigned).

### Sprint Lifecycle Management

#### POST /api/v1/sprints/:id/start

Start a sprint (changes status from planning to active).

**Response:**

```json
{
  "success": true,
  "message": "Sprint started successfully",
  "data": {
    "id": "sprint-uuid",
    "status": "active"
  }
}
```

#### POST /api/v1/sprints/:id/complete

Complete a sprint (changes status to complete and calculates final velocity).

**Response:**

```json
{
  "success": true,
  "message": "Sprint completed successfully",
  "data": {
    "id": "sprint-uuid",
    "status": "complete",
    "finalVelocity": 15,
    "completedStories": 4,
    "totalStories": 5
  }
}
```

### Sprint Planning Algorithms

#### GET /api/v1/sprints/planning/velocity

Get team velocity for planning purposes.

**Query Parameters:**

- `sprintCount` (optional): Number of recent sprints to consider (default: 3)

**Response:**

```json
{
  "success": true,
  "data": {
    "averageVelocity": 17,
    "basedOnSprints": 3
  }
}
```

#### POST /api/v1/sprints/planning/recommend

Get recommended stories for sprint planning.

**Request Body:**

```json
{
  "capacity": 20,
  "excludeStoryIds": ["story-uuid-1", "story-uuid-2"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "recommendedStories": [
      {
        "id": "story-uuid",
        "title": "User login functionality",
        "storyPoints": 5,
        "priority": "high"
      }
    ],
    "totalStoryPoints": 18,
    "remainingCapacity": 2,
    "capacityUtilization": 90,
    "priorityDistribution": {
      "high": 2,
      "medium": 2,
      "low": 1
    },
    "alternativeStories": []
  }
}
```

#### POST /api/v1/sprints/planning/validate-capacity

Validate sprint capacity against team velocity.

**Request Body:**

```json
{
  "capacity": 25,
  "teamSize": 5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "riskLevel": "medium",
    "averageVelocity": 17,
    "velocityPerPerson": 3,
    "capacityPerPerson": 5,
    "recommendations": [
      "Capacity is slightly above average velocity",
      "Monitor progress closely during sprint"
    ]
  }
}
```

### Story Allocation

#### POST /api/v1/sprints/:id/allocate

Allocate stories to a sprint.

**Request Body:**

```json
{
  "storyIds": ["story-uuid-1", "story-uuid-2"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Stories allocated successfully",
  "allocatedStories": [
    {
      "storyId": "story-uuid-1",
      "title": "User login",
      "storyPoints": 5,
      "allocated": true
    }
  ],
  "totalPoints": 13,
  "capacity": 20,
  "remainingCapacity": 7,
  "utilizationRate": 65
}
```

#### DELETE /api/v1/sprints/:id/stories/:storyId

Remove a story from a sprint.

#### GET /api/v1/sprints/:id/stories

Get all stories in a sprint, grouped by status.

### Burndown Chart Data

#### GET /api/v1/sprints/:id/burndown

Generate burndown chart data for a sprint.

**Response:**

```json
{
  "success": true,
  "data": {
    "sprintId": "sprint-uuid",
    "totalStoryPoints": 20,
    "completedStoryPoints": 8,
    "remainingStoryPoints": 12,
    "workingDays": 10,
    "daysElapsed": 4,
    "burndownData": [
      {
        "date": "2024-01-15",
        "idealRemaining": 20,
        "actualRemaining": null
      },
      {
        "date": "2024-01-16",
        "idealRemaining": 18,
        "actualRemaining": null
      }
    ],
    "currentProgress": {
      "idealRemaining": 12,
      "actualRemaining": 12,
      "isOnTrack": true,
      "variance": 0
    },
    "completionRate": 40
  }
}
```

## Sprint Planning Service

The `SprintPlanningService` class provides the core algorithms and calculations:

### Key Methods

#### calculateVelocity(sprintCount = 3)

Calculates team velocity based on completed sprints.

#### getRecommendedStories(capacity, excludeStoryIds = [])

Uses a greedy algorithm to recommend stories that fit within capacity, prioritizing by:

1. Priority (high > medium > low)
2. Story points (smaller first for better fit)

#### validateSprintCapacity(capacity, teamSize = 5)

Validates proposed capacity against historical velocity and provides risk assessment.

#### generateBurndownData(sprintId)

Generates comprehensive burndown chart data including:

- Ideal burndown line
- Current progress tracking
- Working days calculation (excludes weekends)
- Completion rate and variance analysis

#### allocateStoriesToSprint(sprintId, storyIds)

Allocates stories to sprint with capacity validation and overflow handling.

## Algorithm Details

### Story Recommendation Algorithm

1. Filter available stories (status = 'backlog', not in current sprint)
2. Sort by priority (high first), then by story points (ascending)
3. Use greedy selection to fit stories within capacity
4. Calculate utilization metrics and priority distribution
5. Provide alternative suggestions for remaining capacity

### Capacity Validation Algorithm

1. Calculate average velocity from recent completed sprints
2. Compare proposed capacity to historical velocity
3. Assess risk level based on capacity ratio:
   - > 130% of velocity: High risk
   - 110-130% of velocity: Medium risk
   - < 110% of velocity: Low risk
4. Provide specific recommendations based on team size and capacity

### Burndown Calculation Algorithm

1. Calculate total working days (excluding weekends)
2. Generate ideal burndown line (linear decrease)
3. Track actual progress based on completed stories
4. Calculate variance and on-track status
5. Provide completion rate and progress metrics

## Error Handling

All endpoints include comprehensive error handling:

- Input validation with detailed error messages
- Database error handling with appropriate HTTP status codes
- Business logic validation (e.g., capacity overflow, sprint conflicts)
- Graceful degradation when historical data is unavailable

## Integration with Existing System

The sprint planning API integrates seamlessly with the existing agile system:

- Uses existing Epic and UserStory models
- Extends Sprint model with additional methods
- Maintains consistency with existing validation middleware
- Follows established API response patterns

## Testing

Comprehensive integration tests cover:

- All CRUD operations
- Sprint planning algorithms
- Story allocation workflows
- Burndown chart generation
- Error scenarios and edge cases
- Service method unit tests

The implementation satisfies all requirements from task 3.2:
✅ Create API endpoints for sprint CRUD operations
✅ Implement sprint planning algorithms for story selection
✅ Add velocity calculation and burndown chart data generation
✅ Create services for sprint capacity management and story allocation
✅ Write integration tests for sprint planning workflows
