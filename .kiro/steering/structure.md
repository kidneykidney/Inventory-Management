# Project Structure

## Root Level Organization
```
inventory-management-system/
├── public/              # Static files (index.html, manifest.json)
├── src/                 # React frontend source code
├── server/              # Node.js backend source code
├── .env                 # Environment variables
├── package.json         # Root package.json (manages both frontend and backend)
└── README.md            # Project documentation
```

## Frontend Structure (`src/`)
```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Dashboard, Navbar, Sidebar)
│   └── ErrorBoundary.js # Error handling component
├── pages/              # Page-level components (one per route)
├── api/                # API service functions and HTTP client setup
├── utils/              # Utility functions and contexts
│   ├── ThemeContext.js # Theme management (light/dark mode)
│   ├── logger.js       # Client-side logging utility
│   └── currencyFormatter.js # Currency formatting utilities
├── styles/             # Global CSS styles
├── App.js              # Main application component with routing
└── index.js            # React application entry point
```

## Backend Structure (`server/`)
```
server/
├── config/             # Configuration files
│   ├── config.js       # Application configuration
│   └── database.js     # Database connection setup
├── routes/             # Express route handlers (API endpoints)
├── utils/              # Server utilities
│   └── logger.js       # Server-side logging (Winston)
├── server.js           # Express server entry point
└── package.json        # Backend-specific dependencies
```

## Key Architectural Patterns

### Frontend Patterns
- **Component-based architecture**: Reusable components in `components/`, page-specific components in `pages/`
- **Context API**: Theme management via `ThemeContext.js`
- **Error boundaries**: Global error handling with `ErrorBoundary.js`
- **Centralized routing**: All routes defined in `App.js`
- **API abstraction**: HTTP calls centralized in `src/api/`

### Backend Patterns
- **MVC-like structure**: Routes handle HTTP logic, separate config and utilities
- **Middleware-first**: Security, logging, and rate limiting as Express middleware
- **Configuration management**: Environment-based config in `server/config/`
- **Structured logging**: Winston logger for server-side logging
- **API versioning**: Routes prefixed with `/api/v1`

### File Naming Conventions
- **React components**: PascalCase (e.g., `InventoryPage.js`, `ErrorBoundary.js`)
- **Utilities**: camelCase (e.g., `logger.js`, `currencyFormatter.js`)
- **Configuration**: lowercase (e.g., `config.js`, `database.js`)
- **Pages**: Descriptive names ending with "Page" (e.g., `LoginPage.js`)

### Import/Export Patterns
- **Default exports**: For main components and utilities
- **Named exports**: For multiple utilities from same file (e.g., logger functions)
- **Relative imports**: Used consistently throughout the codebase