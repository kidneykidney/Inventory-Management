# Technology Stack

## Frontend
- **React 18.2.0**: Main UI library with functional components and hooks
- **React Router DOM 6.15.0**: Client-side routing
- **Material-UI (MUI) 5.14.5**: Component library and design system
- **Chart.js 4.3.3** with **react-chartjs-2**: Data visualization
- **Formik 2.4.3** + **Yup 1.2.0**: Form handling and validation
- **Axios 1.4.0**: HTTP client for API calls
- **Date-fns 2.30.0**: Date manipulation utilities

## Backend
- **Node.js** with **Express 4.18.2**: Web server framework
- **MySQL2 3.6.0**: Database driver
- **JWT (jsonwebtoken 9.0.1)**: Authentication tokens
- **bcryptjs 2.4.3**: Password hashing
- **Winston 3.10.0**: Server-side logging
- **Helmet 7.0.0**: Security middleware
- **CORS 2.8.5**: Cross-origin resource sharing
- **Morgan 1.10.0**: HTTP request logging
- **Express Rate Limit 6.9.0**: API rate limiting

## Development Tools
- **Create React App**: Frontend build system
- **Nodemon 3.0.1**: Development server auto-restart
- **Concurrently 8.2.0**: Run multiple npm scripts simultaneously

## Common Commands

### Development
```bash
# Start both frontend and backend in development mode
npm run dev

# Start only the backend server with auto-restart
npm run server

# Start only the React frontend
npm run client
```

### Production
```bash
# Build React app for production
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run React tests
npm test
```

## Environment Configuration
- Uses `.env` files for environment variables
- Database configuration in `server/config/config.js`
- CORS and security settings configurable via environment variables