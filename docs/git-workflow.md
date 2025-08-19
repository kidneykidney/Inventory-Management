# Git Branch Naming Convention

## Branch Types

### Feature Branches
- **Format**: `feature/description-here`
- **Purpose**: New features or enhancements
- **Examples**: 
  - `feature/user-authentication`
  - `feature/inventory-dashboard`
  - `feature/story-estimation`

### Bug Fix Branches
- **Format**: `bugfix/description-here`
- **Purpose**: Bug fixes and issue resolution
- **Examples**:
  - `bugfix/login-validation-error`
  - `bugfix/chart-rendering-issue`

### Hotfix Branches
- **Format**: `hotfix/description-here`
- **Purpose**: Critical fixes that need immediate deployment
- **Examples**:
  - `hotfix/security-vulnerability`
  - `hotfix/data-corruption-fix`

### Release Branches
- **Format**: `release/version-number`
- **Purpose**: Preparing releases
- **Examples**:
  - `release/v1.0.0`
  - `release/v2.1.0`

## Branch Workflow

1. **Create branch from develop**: `git checkout develop && git pull && git checkout -b feature/your-feature`
2. **Work on your feature**: Make commits following conventional commit format
3. **Push branch**: `git push -u origin feature/your-feature`
4. **Create Pull Request**: Use the PR template to describe your changes
5. **Code Review**: Address feedback and make necessary changes
6. **Merge**: Once approved, merge into develop branch

## Protected Branches

- **main**: Production-ready code, requires 2 reviewers
- **develop**: Integration branch, requires 1 reviewer

## Commit Message Format

Follow conventional commits:
- `feat(scope): add new feature`
- `fix(scope): resolve bug`
- `docs: update documentation`
- `style: format code`
- `refactor: restructure code`
- `test: add tests`
- `chore: update dependencies`
