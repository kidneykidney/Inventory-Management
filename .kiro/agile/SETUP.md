# Agile Development Setup Guide

This guide will help you set up the complete Agile development environment for the Electronics and Office Components Lending System.

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Git (v2.20 or higher)

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Git Hooks (Optional but Recommended)
```bash
npm run agile:setup-hooks
```

This will install pre-commit hooks that:
- Validate commit message format
- Run unit tests before commits
- Check branch naming conventions

### 3. Initialize Your First Sprint
```bash
npm run agile:init
```

This creates your first sprint with the proper structure and dates.

### 4. Verify Setup
```bash
npm run agile:report
```

You should see a project report with initialized epics and sprint structure.

## Development Workflow

### Starting Development
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run client    # React frontend only
npm run server    # Node.js backend only
```

### Working with Stories

#### Add a New Story
```bash
npm run agile:add-story
```

Follow the interactive prompts to create a user story with:
- Title and description
- Acceptance criteria
- Story points estimation
- Priority level
- Epic assignment

#### Update Story Status
```bash
npm run agile:update-story story-001 in-progress
```

Valid statuses: `backlog`, `todo`, `in-progress`, `review`, `done`

#### Start a Sprint
```bash
npm run agile:start-sprint
```

This activates the current sprint and begins burndown tracking.

### Branch Management

Create feature branches following the naming convention:
```bash
git checkout -b feature/sprint-1-story-001
```

### Commit Messages

Follow the conventional commit format:
```bash
git commit -m "feat(story-001): add user authentication system"
git commit -m "fix(story-002): resolve login validation issue"
git commit -m "docs(story-003): update API documentation"
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Testing

Run tests before committing:
```bash
npm run test:unit          # Unit tests with coverage
npm run test:integration   # Integration tests (to be configured)
npm run test:e2e          # End-to-end tests (to be configured)
```

## Monitoring Progress

### Generate Reports
```bash
npm run agile:report       # Comprehensive project status
npm run agile:burndown     # Sprint burndown chart
```

### Daily Workflow
1. Check current sprint status: `npm run agile:burndown`
2. Update story statuses: `npm run agile:update-story <id> <status>`
3. Work on assigned stories
4. Commit with proper message format
5. Update story status when complete

## Sprint Ceremonies

### Sprint Planning (Every 2 weeks)
1. Review backlog: `npm run agile:report`
2. Select stories for next sprint
3. Initialize new sprint: `npm run agile:init`
4. Start sprint: `npm run agile:start-sprint`

### Daily Standups
1. Check burndown: `npm run agile:burndown`
2. Update story statuses
3. Identify blockers

### Sprint Review
1. Demo completed features
2. Generate final report: `npm run agile:report`
3. Gather stakeholder feedback

### Sprint Retrospective
1. Review what went well
2. Identify improvements
3. Create action items for next sprint

## File Structure

```
.kiro/agile/
├── README.md              # Framework overview
├── SETUP.md              # This setup guide
├── config.json           # Project configuration
├── backlog.json          # Product backlog
├── development.md        # Development guidelines
├── sprints/              # Sprint data files
├── scripts/              # Automation scripts
└── git-hooks/            # Git workflow hooks
```

## Customization

### Project Configuration
Edit `.kiro/agile/config.json` to customize:
- Sprint duration
- Team capacity
- Story point scale
- Definition of Ready/Done

### Epic Management
Edit `.kiro/agile/backlog.json` to:
- Add new epics
- Modify epic priorities
- Update business value descriptions

### Development Guidelines
Edit `.kiro/agile/development.md` to:
- Update coding standards
- Modify review checklist
- Add team-specific processes

## Troubleshooting

### Common Issues

**Git hooks not working:**
```bash
npm run agile:setup-hooks
```

**Sprint not initializing:**
- Check that config.json exists
- Verify backlog.json is properly formatted

**Scripts not executable:**
```bash
chmod +x .kiro/agile/scripts/*.js
chmod +x .kiro/agile/git-hooks/*
```

**Tests failing:**
- Ensure all dependencies are installed: `npm install`
- Check test configuration in package.json

### Getting Help

1. Check the comprehensive README: `.kiro/agile/README.md`
2. Review development guidelines: `.kiro/agile/development.md`
3. Generate a status report: `npm run agile:report`
4. Verify configuration: `.kiro/agile/config.json`

## Next Steps

After setup is complete:

1. **Create Initial Stories**: Use `npm run agile:add-story` to populate your backlog
2. **Start First Sprint**: Initialize and start your first sprint
3. **Begin Development**: Create feature branches and start coding
4. **Track Progress**: Use daily reports and burndown charts
5. **Iterate**: Complete sprint cycles and continuously improve

The Agile framework is now ready to support your development process with proper tracking, automation, and quality controls.