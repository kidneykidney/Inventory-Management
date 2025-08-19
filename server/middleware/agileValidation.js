// Middleware for validating Agile-related requests

const validateEpic = (req, res, next) => {
  const { title, description, businessValue, status, priority } = req.body;
  const errors = [];

  // Title validation
  if (!title || typeof title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (title.length < 5 || title.length > 200) {
    errors.push('Title must be between 5 and 200 characters');
  }

  // Description validation
  if (!description || typeof description !== 'string') {
    errors.push('Description is required and must be a string');
  } else if (description.length < 30 || description.length > 2000) {
    errors.push('Description must be between 30 and 2000 characters');
  }

  // Business value validation
  if (!businessValue || typeof businessValue !== 'string') {
    errors.push('Business value is required and must be a string');
  } else if (businessValue.length < 20 || businessValue.length > 500) {
    errors.push('Business value must be between 20 and 500 characters');
  }

  // Status validation
  if (status && !['planned', 'in-progress', 'complete'].includes(status)) {
    errors.push('Status must be one of: planned, in-progress, complete');
  }

  // Priority validation
  if (priority && !['high', 'medium', 'low'].includes(priority)) {
    errors.push('Priority must be one of: high, medium, low');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

const validateUserStory = (req, res, next) => {
  const {
    title,
    description,
    acceptanceCriteria,
    storyPoints,
    priority,
    status,
    tags,
  } = req.body;
  const errors = [];

  // Title validation
  if (!title || typeof title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (title.length < 5 || title.length > 150) {
    errors.push('Title must be between 5 and 150 characters');
  }

  // Description validation
  if (!description || typeof description !== 'string') {
    errors.push('Description is required and must be a string');
  } else if (description.length < 20 || description.length > 1000) {
    errors.push('Description must be between 20 and 1000 characters');
  }

  // Acceptance criteria validation
  if (!acceptanceCriteria || !Array.isArray(acceptanceCriteria)) {
    errors.push('Acceptance criteria is required and must be an array');
  } else {
    if (acceptanceCriteria.length === 0) {
      errors.push('At least one acceptance criterion is required');
    } else if (acceptanceCriteria.length > 10) {
      errors.push('Maximum 10 acceptance criteria allowed');
    }

    acceptanceCriteria.forEach((criterion, index) => {
      if (typeof criterion !== 'string' || criterion.length < 10) {
        errors.push(
          `Acceptance criterion ${index + 1} must be at least 10 characters`
        );
      }
    });
  }

  // Story points validation
  const validStoryPoints = [1, 2, 3, 5, 8, 13, 21];
  if (storyPoints === undefined || storyPoints === null) {
    errors.push('Story points are required');
  } else if (!validStoryPoints.includes(storyPoints)) {
    errors.push(
      'Story points must be a valid Fibonacci number (1, 2, 3, 5, 8, 13, 21)'
    );
  }

  // Priority validation
  if (priority && !['high', 'medium', 'low'].includes(priority)) {
    errors.push('Priority must be one of: high, medium, low');
  }

  // Status validation
  if (
    status &&
    !['backlog', 'todo', 'in-progress', 'review', 'done'].includes(status)
  ) {
    errors.push(
      'Status must be one of: backlog, todo, in-progress, review, done'
    );
  }

  // Tags validation
  if (tags && Array.isArray(tags)) {
    if (tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }
    tags.forEach((tag, index) => {
      if (typeof tag !== 'string' || tag.length < 2) {
        errors.push(`Tag ${index + 1} must be at least 2 characters`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

const validateSprint = (req, res, next) => {
  const { number, startDate, endDate, goal, capacity, status } = req.body;
  const errors = [];

  // Sprint number validation
  if (!number || typeof number !== 'number' || number < 1) {
    errors.push('Sprint number is required and must be a positive integer');
  }

  // Start date validation
  if (!startDate) {
    errors.push('Start date is required');
  } else {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      errors.push('Start date must be a valid date');
    }
  }

  // End date validation
  if (!endDate) {
    errors.push('End date is required');
  } else {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      errors.push('End date must be a valid date');
    } else if (startDate) {
      const start = new Date(startDate);
      if (end <= start) {
        errors.push('End date must be after start date');
      }

      // Check sprint duration (1-4 weeks)
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 7 || diffDays > 28) {
        errors.push('Sprint duration must be between 1 and 4 weeks');
      }
    }
  }

  // Goal validation
  if (!goal || typeof goal !== 'string') {
    errors.push('Sprint goal is required and must be a string');
  } else if (goal.length < 10 || goal.length > 300) {
    errors.push('Sprint goal must be between 10 and 300 characters');
  }

  // Capacity validation
  if (!capacity || typeof capacity !== 'number' || capacity < 1) {
    errors.push('Team capacity is required and must be a positive number');
  }

  // Status validation
  if (
    status &&
    !['planning', 'active', 'review', 'complete'].includes(status)
  ) {
    errors.push('Status must be one of: planning, active, review, complete');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

const validatePriorityUpdate = (req, res, next) => {
  const { priorities } = req.body;
  const errors = [];

  if (!priorities || !Array.isArray(priorities)) {
    errors.push('Priorities array is required');
  } else {
    priorities.forEach((item, index) => {
      if (!item.id || typeof item.id !== 'string') {
        errors.push(`Priority item ${index + 1} must have a valid ID`);
      }
      if (
        !item.priority ||
        !['high', 'medium', 'low'].includes(item.priority)
      ) {
        errors.push(
          `Priority item ${index + 1} must have a valid priority (high, medium, low)`
        );
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Priority validation failed',
      errors,
    });
  }

  next();
};

const validateStoryPointEstimate = (req, res, next) => {
  const { storyId, estimates, finalEstimate, confidence } = req.body;
  const errors = [];
  const validStoryPoints = [1, 2, 3, 5, 8, 13, 21];

  // Story ID validation
  if (!storyId || typeof storyId !== 'string') {
    errors.push('Story ID is required and must be a string');
  }

  // Estimates validation
  if (!estimates || !Array.isArray(estimates)) {
    errors.push('Estimates array is required');
  } else {
    if (estimates.length === 0) {
      errors.push('At least one estimate is required');
    } else if (estimates.length > 10) {
      errors.push('Maximum 10 estimates allowed');
    }

    estimates.forEach((estimate, index) => {
      if (!validStoryPoints.includes(estimate)) {
        errors.push(`Estimate ${index + 1} must be a valid Fibonacci number`);
      }
    });
  }

  // Final estimate validation
  if (
    finalEstimate === undefined ||
    !validStoryPoints.includes(finalEstimate)
  ) {
    errors.push('Final estimate must be a valid Fibonacci number');
  }

  // Confidence validation
  if (confidence && !['low', 'medium', 'high'].includes(confidence)) {
    errors.push('Confidence must be one of: low, medium, high');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Story point estimate validation failed',
      errors,
    });
  }

  next();
};

module.exports = {
  validateEpic,
  validateUserStory,
  validateSprint,
  validatePriorityUpdate,
  validateStoryPointEstimate,
};
