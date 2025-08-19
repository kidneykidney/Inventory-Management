# Agile Development Framework

This directory contains the complete Agile development framework for the Electronics and Office Components Lending System project.

## Quick Start

### 1. Initialize Your First Sprint
```bash
npm run agile:init
```

### 2. Add User Stories
```bash
npm run agile:add-story
```

### 3. Start Sprint
```bash
npm run agile:start-sprint
```

### 4. Track Progress
```bash
npm run agile:report
npm run agile:burndown
```

## Directory Structure

```
.kiro/agile/
├── README.md                # This file
├── config.json             # Project configuration
├── backlog.json            # Product backlog and epics
├── development.md          # Development guidelines
├── sprints/                # Sprint data
│   ├── sprint-template.json
│   ├── sprint-001.json
│   └── sprint-002.json
└── scripts/                # Automation scripts
    ├── init-sprint.js
    ├── start-sprint.js
    ├── add-story.js
    ├── update-story.js
    ├── generate-report.js
    └── generate-burndown.js
```

## Available Commands

### Sprint Management
- `npm run agile:init` - Initialize a new sprint
- `npm run agile:start-sprint` - Start the current sprint
- `npm run agile:end-sprint` - End current sprint (to be implemented)

### Story Management
- `npm run agile:add-story` - Add new user story interactively
- `npm run agile:update-story <story-id> <status>` - Update story status

### Reporting
- `npm run agile:report` - Generate comprehensive project report
- `npm run agile:burndown` - Generate burndown chart for current sprint

### Development
- `npm run dev` - Start development environment
- `npm run test:unit` - Run unit tests with coverage
- `npm run lint` - Run code linting (to be configured)
- `npm run format` - Format code (to be configured)

## Story Status Flow

```
backlog → todo → in-progress → review → done
```

## Epic Categories

1. **Foundation & Core Setup** - Basic infrastructure and authentication
2. **Electronics & Office Components Management** - Product catalog and specifications
3. **Lending & Borrowing System** - Core lending functionality
4. **Advanced Search & Filtering** - Search and discovery features
5. **Email Notification System** - Automated reminders and notifications
6. **Analytics & Production Readiness** - Reporting and optimization

## Sprint Planning Guidelines

- **Sprint Duration**: 2 weeks (14 days)
- **Team Capacity**: 40 story points per sprint
- **Story Point Scale**: 1, 2, 3, 5, 8, 13, 21
- **Sprint Goal**: Each sprint should have a clear, achievable goal

## Definition of Ready

Before a story can be included in a sprint:
- [ ] Acceptance criteria defined
- [ ] Story points estimated
- [ ] Dependencies identified
- [ ] Technical approach agreed upon

## Definition of Done

Before a story can be marked as complete:
- [ ] Code written and reviewed
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Acceptance criteria verified
- [ ] Documentation updated

## Best Practices

1. **Daily Updates**: Update story status daily using `npm run agile:update-story`
2. **Regular Reports**: Generate reports weekly to track progress
3. **Burndown Tracking**: Check burndown chart daily during active sprints
4. **Retrospectives**: Conduct retrospectives at the end of each sprint
5. **Continuous Improvement**: Use retrospective action items to improve process

## Integration with Development Workflow

This Agile framework integrates with the existing development workflow:

- **Git Branches**: Use `feature/sprint-X-story-Y` naming convention
- **Commit Messages**: Include story ID in commit messages
- **Pull Requests**: Link PRs to story IDs
- **Testing**: Align test coverage with Definition of Done
- **Code Review**: Include story acceptance criteria in review checklist

## Customization

The framework can be customized by editing:
- `config.json` - Project settings and team configuration
- `backlog.json` - Epics and stories
- `development.md` - Development guidelines and processes

## Support

For questions or issues with the Agile framework:
1. Check the development guidelines in `development.md`
2. Review the configuration in `config.json`
3. Generate a report to see current project status
4. Update story statuses to keep tracking accurate