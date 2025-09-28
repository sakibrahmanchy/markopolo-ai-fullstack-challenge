# PulseHub Frontend

A React + TypeScript frontend for the PulseHub multi-channel marketing platform.

## Features

- **Authentication**: JWT-based login/logout with automatic token refresh
- **Data Sources Management**: Connect and manage GTM, Facebook Pixel, and Shopify integrations
- **OAuth Integration**: Secure OAuth 2.0 flows for third-party services
- **Redux State Management**: RTK Query for efficient API state management
- **Protected Routes**: Route protection with authentication guards
- **Responsive Design**: Tailwind CSS for modern, responsive UI

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Redux Toolkit** with RTK Query for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for HTTP requests

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on `http://localhost:5900`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update the `.env` file with your backend API URL:
```env
VITE_API_URL=http://localhost:5900
```

Make sure your backend server is running before starting the frontend.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ConnectDataSource.tsx
│   ├── DataSourcesList.tsx
│   ├── LoginForm.tsx
│   └── ProtectedRoute.tsx
├── pages/              # Page components
│   └── Dashboard.tsx
├── store/              # Redux store configuration
│   ├── api/            # RTK Query API definitions
│   │   ├── authApi.ts
│   │   ├── dataSourcesApi.ts
│   │   └── oauthApi.ts
│   ├── slices/         # Redux slices
│   │   └── authSlice.ts
│   └── index.ts        # Store configuration
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

## Key Features

### Authentication Flow

1. **Login**: Users authenticate with email/password
2. **Token Management**: JWT tokens stored in Redux state and localStorage
3. **Auto Refresh**: Automatic token refresh on API calls
4. **Protected Routes**: Routes require authentication

### Data Sources Integration

1. **OAuth Connections**: Secure OAuth 2.0 flows for:
   - Google Tag Manager
   - Facebook Pixel
   - Shopify
2. **Connection Management**: View, test, and manage connected data sources
3. **Real-time Updates**: RTK Query provides real-time data synchronization

### State Management

- **Redux Toolkit**: Modern Redux with less boilerplate
- **RTK Query**: Efficient data fetching and caching
- **TypeScript**: Full type safety throughout the application

## API Integration

The frontend integrates with the following backend endpoints:

- **Authentication**: `/auth/*`
- **Data Sources**: `/data-sources/*`
- **OAuth**: `/oauth/*`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for code formatting
- Tailwind CSS for consistent styling

## Deployment

The frontend builds to static files in the `dist/` directory and can be deployed to any static hosting service like Vercel, Netlify, or AWS S3.

## Contributing

1. Follow TypeScript best practices
2. Use RTK Query for all API calls
3. Maintain type safety throughout
4. Follow the existing component structure
5. Test OAuth flows thoroughly