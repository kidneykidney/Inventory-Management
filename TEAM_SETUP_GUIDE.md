# Quick Start Guide for 3-Person Team Repository Setup

## 🚀 Repository Owner: Complete Setup Instructions

### Step 1: Initial Repository Setup
```bash
# 1. Clone your repository (if not already done)
git clone https://github.com/kidneykidney/Inventory-Management.git
cd Inventory-Management

# 2. Create main branch (if not exists)
git checkout -b main
git push -u origin main

# 3. Create develop branch from main
git checkout -b develop
git push -u origin develop
```

### Step 2: Automated Team Setup
```bash
# Run the automated setup script
node scripts/setup-team-repository.js
```

**OR manually create branches:**

```bash
# Create feature branches for each team member
git checkout develop

# For Team Member 1 (replace 'member1' with actual name)
git checkout -b feature/member1-initial-setup
git push -u origin feature/member1-initial-setup

# For Team Member 2
git checkout develop
git checkout -b feature/member2-initial-setup
git push -u origin feature/member2-initial-setup

# For Team Member 3
git checkout develop
git checkout -b feature/member3-initial-setup
git push -u origin feature/member3-initial-setup

# Return to develop
git checkout develop
```

### Step 3: Set Up Repository Access
1. **Add team members as collaborators:**
   - Go to GitHub.com → Your Repository → Settings → Collaborators
   - Click "Add people" and invite your team members
   
2. **Set up branch protection rules:**
   - Go to Settings → Branches
   - Add protection rule for `main` branch:
     - ✅ Require pull request reviews before merging
     - ✅ Require 2 approving reviews
     - ✅ Dismiss stale reviews
   - Add protection rule for `develop` branch:
     - ✅ Require pull request reviews before merging
     - ✅ Require 1 approving review

## 👥 Team Members: Getting Started

### Step 1: Clone and Setup
```bash
# 1. Clone the repository
git clone https://github.com/kidneykidney/Inventory-Management.git
cd Inventory-Management

# 2. Configure your Git identity (first time only)
git config --global user.name "Your Full Name"
git config --global user.email "your.email@example.com"

# 3. Check available branches
git branch -a
```

### Step 2: Choose Your Working Branch
```bash
# Switch to your assigned feature branch
git checkout feature/yourname-initial-setup

# OR create a new feature branch for your work
git checkout develop
git pull origin develop
git checkout -b feature/yourname-your-feature
git push -u origin feature/yourname-your-feature
```

## 🔄 Daily Workflow for Team Members

### Starting New Work
```bash
# 1. Update develop branch
git checkout develop
git pull origin develop

# 2. Create new feature branch
git checkout -b feature/yourname-new-feature

# 3. Push new branch to remote
git push -u origin feature/yourname-new-feature
```

### Making Changes
```bash
# 1. Make your changes to files
# 2. Check what changed
git status
git diff

# 3. Stage changes
git add .

# 4. Commit with descriptive message
git commit -m "feat(component): add new functionality"

# 5. Push to your branch
git push origin feature/yourname-new-feature
```

### Creating Pull Request
1. **On GitHub:**
   - Navigate to your repository
   - Click "Compare & pull request" for your branch
   - Set base branch to `develop`
   - Add description of your changes
   - Request review from team members
   - Click "Create pull request"

2. **After review and approval:**
   - Merge the pull request
   - Delete the feature branch

### Staying Up to Date
```bash
# Before starting new work, always update develop
git checkout develop
git pull origin develop

# If working on existing branch, merge latest develop
git checkout your-feature-branch
git merge develop
```

## 🔧 Branch Structure Overview

```
main (production-ready code)
├── develop (integration branch - all features merge here)
├── feature/person1-feature-name (Individual feature work)
├── feature/person2-feature-name (Individual feature work)
└── feature/person3-feature-name (Individual feature work)
```

## 📋 Branch Naming Convention

- **Feature branches:** `feature/yourname-description`
- **Bug fixes:** `bugfix/yourname-description`  
- **Hotfixes:** `hotfix/yourname-description`

**Examples:**
- `feature/john-user-authentication`
- `feature/sarah-inventory-dashboard`
- `bugfix/mike-login-validation`

## 💡 Best Practices

### For Team Collaboration:
1. **Always work on feature branches** - never commit directly to `main` or `develop`
2. **Pull latest changes** before starting new work
3. **Use descriptive commit messages** following conventional commits
4. **Review each other's code** thoroughly
5. **Communicate** before working on the same files
6. **Test your changes** before creating pull requests

### Commit Message Format:
```
feat(scope): add new feature
fix(scope): resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

### Avoiding Conflicts:
1. **Coordinate work** - discuss who works on what
2. **Pull frequently** from develop branch
3. **Make small, focused commits**
4. **Merge develop into your branch** regularly

## 🆘 Troubleshooting Common Issues

### "Your branch is behind"
```bash
git checkout develop
git pull origin develop
git checkout your-feature-branch
git merge develop
```

### "Push rejected" 
```bash
git pull origin your-feature-branch
# Resolve any conflicts
git push origin your-feature-branch
```

### Undo last commit (keep changes)
```bash
git reset --soft HEAD~1
```

### Discard local changes
```bash
git checkout -- filename  # for specific file
git reset --hard HEAD      # for all files (be careful!)
```

## 📞 Getting Help

1. **Check documentation:**
   - `docs/team-collaboration-setup.md` - Detailed collaboration guide
   - `docs/git-workflow.md` - Git workflow documentation
   - `.kiro/agile/development.md` - Agile development guidelines

2. **Use available scripts:**
   - `scripts/setup-team-repository.js` - Automated setup
   - `scripts/create-story-branch.js` - Create structured feature branches

3. **Ask team members** for help when stuck

## ✅ Setup Checklist

### Repository Owner:
- [ ] Create `main` and `develop` branches
- [ ] Set up branch protection rules
- [ ] Add team members as collaborators
- [ ] Run setup script or create initial feature branches
- [ ] Share repository URL and this guide with team

### Each Team Member:
- [ ] Clone repository
- [ ] Configure Git identity
- [ ] Check out assigned/create feature branch
- [ ] Make test commit and push
- [ ] Verify can create pull requests

### Team:
- [ ] Agree on branch naming conventions
- [ ] Establish code review process
- [ ] Test the workflow with a small change
- [ ] Set up communication for coordination

---

**🎉 You're all set! Your team can now collaborate effectively on the same codebase.**