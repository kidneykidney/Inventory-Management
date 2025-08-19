# Agile Development Environment Setup

## Development Workflow

### Branch Strategy
```
main (production-ready code)
├── develop (integration branch)
├── feature/sprint-X-story-Y (individual features)
├── hotfix/critical-bug-fix (emergency fixes)
└── release/sprint-X (release preparation)
```

### Story Development Process
1. Create feature branch from develop: `git checkout -b feature/sprint-1-story-001`
2. Implement story with TDD approach
3. Run tests: `npm run test:unit`
4. Create pull request to develop branch
5. Code review and approval
6. Merge to develop branch
7. Integration testing
8. Release branch for sprint completion

### Daily Development Commands

#### Start Development Environment
```bash
npm run dev                 # Start both frontend and backend
npm run client             # Start only React frontend
npm run server             # Start only Node.js backend
```

#### Testing Commands
```bash
npm run test:unit          # Run unit tests with coverage
npm run test:integration   # Run integration tests (to be configured)
npm run test:e2e          # Run end-to-end tests (to be configured)
npm test                  # Run React tests in watch mode
```

#### Agile Workflow Commands
```bash
npm run agile:init         # Initialize new sprint
npm run agile:add-story    # Add new user story interactively
npm run agile:report       # Generate project status report
npm run agile:burndown     # Generate burndown chart data
```

#### Code Quality Commands
```bash
npm run lint              # Run code linting (to be configured)
npm run format            # Format code (to be configured)
```

## Definition of Ready (Story Level)
- [ ] Acceptance criteria defined
- [ ] Story points estimated
- [ ] Dependencies identified
- [ ] Technical approach agreed upon

## Definition of Done (Story Level)
- [ ] Code written and reviewed
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Acceptance criteria verified
- [ ] Documentation updated

## Sprint Ceremonies

### Sprint Planning (Every 2 weeks)
1. Review and prioritize backlog
2. Select stories for upcoming sprint
3. Estimate story points
4. Define sprint goal
5. Create sprint backlog

### Daily Standups (Daily)
1. What did I complete yesterday?
2. What will I work on today?
3. Are there any blockers?

### Sprint Review (End of sprint)
1. Demo completed features
2. Gather stakeholder feedback
3. Update product backlog

### Sprint Retrospective (End of sprint)
1. What went well?
2. What could be improved?
3. Action items for next sprint

## File Structure for Agile Management

```
.kiro/agile/
├── config.json              # Project configuration
├── backlog.json             # Product backlog and epics
├── development.md           # This file - development guidelines
├── sprints/                 # Sprint-specific files
│   ├── sprint-template.json # Template for new sprints
│   ├── sprint-001.json      # Sprint 1 data
│   └── sprint-002.json      # Sprint 2 data
└── scripts/                 # Automation scripts
    ├── init-sprint.js       # Initialize new sprint
    ├── add-story.js         # Add user story
    ├── update-story.js      # Update story status
    ├── generate-report.js   # Generate reports
    └── generate-burndown.js # Generate burndown data
```

## Story Naming Convention
- Branch: `feature/sprint-{number}-story-{id}`
- Commit: `feat(story-{id}): brief description`
- PR Title: `[Sprint {number}] Story {id}: {title}`

## Testing Strategy
- **Unit Tests (70%)**: Business logic, utility functions
- **Integration Tests (20%)**: API endpoints, database operations
- **E2E Tests (10%)**: Critical user journeys

## Code Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met (for UI changes)