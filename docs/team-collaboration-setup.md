# Team Collaboration Setup Guide

## Overview
This guide will help you set up a Git repository with proper branching strategy for a 3-person development team working on the same codebase.

## Branch Strategy for 3-Person Team

```
main (production-ready code)
├── develop (integration/testing branch)
├── feature/person1-feature-name (Developer 1's feature branch)
├── feature/person2-feature-name (Developer 2's feature branch)
└── feature/person3-feature-name (Developer 3's feature branch)
```

## Initial Repository Setup (Repository Owner)

### Step 1: Clone and Setup Base Repository
```bash
# Clone the repository
git clone https://github.com/kidneykidney/Inventory-Management.git
cd Inventory-Management

# Ensure you're on the main branch
git checkout main
git pull origin main
```

### Step 2: Create the Develop Branch
```bash
# Create and switch to develop branch
git checkout -b develop

# Push develop branch to remote
git push -u origin develop
```

### Step 3: Set Up Branch Protection (Repository Owner Only)
```bash
# Run the automated setup script
node scripts/setup-git-workflow.js
```

## Team Member Setup Instructions

### For Each Team Member:

#### Step 1: Clone the Repository
```bash
# Clone the repository
git clone https://github.com/kidneykidney/Inventory-Management.git
cd Inventory-Management
```

#### Step 2: Configure Git (First Time Only)
```bash
# Set your name and email
git config --global user.name "Your Full Name"
git config --global user.email "your.email@example.com"
```

#### Step 3: Create Your Personal Feature Branch
```bash
# Ensure you're up to date
git checkout develop
git pull origin develop

# Create your personal feature branch (replace 'yourname' and 'feature-description')
git checkout -b feature/yourname-feature-description

# Push your branch to remote
git push -u origin feature/yourname-feature-description
```

## Daily Workflow for Team Members

### Starting Work on a New Feature
```bash
# 1. Switch to develop and get latest changes
git checkout develop
git pull origin develop

# 2. Create a new feature branch from develop
git checkout -b feature/yourname-new-feature

# 3. Push your new branch to remote
git push -u origin feature/yourname-new-feature
```

### Making Changes and Commits
```bash
# 1. Make your changes
# 2. Stage your changes
git add .

# 3. Commit with conventional commit format
git commit -m "feat(component): add new functionality"

# 4. Push your changes
git push origin feature/yourname-new-feature
```

### Integrating Changes (Pull Request Workflow)
```bash
# 1. Ensure your branch is up to date with develop
git checkout develop
git pull origin develop
git checkout feature/yourname-new-feature
git merge develop

# 2. Push updated branch
git push origin feature/yourname-new-feature

# 3. Create Pull Request on GitHub:
#    - Source: feature/yourname-new-feature
#    - Target: develop
#    - Add team members as reviewers
```

### After Pull Request is Merged
```bash
# 1. Switch to develop and pull latest changes
git checkout develop
git pull origin develop

# 2. Delete your local feature branch (optional)
git branch -d feature/yourname-new-feature

# 3. Delete remote feature branch (optional)
git push origin --delete feature/yourname-new-feature
```

## Team Collaboration Best Practices

### 1. Communication
- Coordinate with team members before working on the same files
- Use descriptive branch names and commit messages
- Review each other's pull requests thoroughly

### 2. Branch Naming Convention
- **Format**: `feature/yourname-description`
- **Examples**: 
  - `feature/john-user-authentication`
  - `feature/sarah-inventory-dashboard`
  - `feature/mike-data-export`

### 3. Commit Message Format
Follow conventional commits:
- `feat(scope): add new feature`
- `fix(scope): resolve bug`
- `docs: update documentation`
- `style: format code`
- `refactor: restructure code`
- `test: add tests`

### 4. Pull Request Guidelines
- Create meaningful PR titles and descriptions
- Include screenshots for UI changes
- Link to related issues or stories
- Request reviews from team members
- Address feedback promptly

### 5. Merge Strategy
- Use "Squash and merge" for clean history
- Delete feature branches after merging
- Ensure all tests pass before merging

## Conflict Resolution

### When You Have Merge Conflicts:
```bash
# 1. Update develop branch
git checkout develop
git pull origin develop

# 2. Merge develop into your feature branch
git checkout feature/yourname-feature
git merge develop

# 3. Resolve conflicts in your editor
# 4. Stage resolved files
git add .

# 5. Complete the merge
git commit -m "resolve merge conflicts with develop"

# 6. Push updated branch
git push origin feature/yourname-feature
```

## Quick Reference Commands

### Essential Daily Commands
```bash
# Check current branch and status
git status
git branch

# Switch branches
git checkout branch-name

# Get latest changes
git pull origin branch-name

# Create and switch to new branch
git checkout -b new-branch-name

# Stage and commit changes
git add .
git commit -m "commit message"

# Push changes
git push origin branch-name

# View commit history
git log --oneline -10
```

### Emergency Commands
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes (be careful!)
git checkout -- filename
git reset --hard HEAD

# Stash current changes
git stash
git stash pop
```

## Troubleshooting

### Common Issues and Solutions

#### "Your branch is behind origin/develop"
```bash
git checkout develop
git pull origin develop
git checkout your-feature-branch
git merge develop
```

#### "Push rejected due to conflicts"
```bash
git pull origin your-feature-branch
# Resolve any conflicts
git push origin your-feature-branch
```

#### "Can't switch branches due to uncommitted changes"
```bash
# Option 1: Commit your changes
git add .
git commit -m "wip: save current progress"

# Option 2: Stash your changes
git stash
# ... switch branches and work ...
git stash pop
```

## Team Setup Checklist

### Repository Owner:
- [ ] Create `develop` branch from `main`
- [ ] Set up branch protection rules
- [ ] Add team members as collaborators
- [ ] Share repository URL with team

### Each Team Member:
- [ ] Clone the repository
- [ ] Configure Git with name and email
- [ ] Create personal feature branch
- [ ] Test push/pull workflow
- [ ] Set up development environment

### Team Coordination:
- [ ] Agree on branch naming conventions
- [ ] Set up code review process
- [ ] Establish communication channels
- [ ] Schedule regular sync meetings

## Support

If you encounter any issues:
1. Check this documentation first
2. Ask team members for help
3. Refer to the existing Git workflow documentation in `docs/git-workflow.md`
4. Use the automated scripts in the `scripts/` directory