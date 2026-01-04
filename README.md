# Hydrilla Frontend

Next.js frontend application for the Hydrilla 3D Generation Platform. Provides a modern web interface for generating 3D models from text prompts or images.

## Overview

This is the user-facing web application built with Next.js, React, and TypeScript. It provides:
- User authentication via Clerk
- 3D model generation interface (text-to-3D and image-to-3D)
- Job library/history
- 3D model viewer
- Real-time job status updates

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **3D Rendering**: Three.js
- **State Management**: SWR (for data fetching)
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── layout.tsx          # Root layout
│   ├── generate/           # 3D generation page
│   ├── library/            # Job library/history
│   ├── viewer/             # 3D model viewer
│   ├── sign-in/            # Clerk sign-in page
│   ├── sign-up/            # Clerk sign-up page
│   └── ...                 # Other pages (careers, team, etc.)
├── components/             # React components
│   ├── layout/             # Layout components (Navbar, Footer)
│   ├── sections/           # Page sections (Hero, etc.)
│   ├── ThreeViewer.tsx     # 3D model viewer component
│   ├── PromptBox.tsx       # Text prompt input
│   ├── JobStatusBadge.tsx # Job status display
│   └── ...
├── lib/
│   └── api.ts             # API client functions
├── public/                 # Static assets
│   ├── images/            # Image assets
│   └── videos/            # Video assets
├── middleware.ts           # Next.js middleware (Clerk)
├── package.json
├── tsconfig.json
├── tailwind.config.ts      # Tailwind CSS configuration
└── next.config.js         # Next.js configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Clerk account for authentication
- Backend API running (see backend README)
- Python API server running (see main README)

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
   NEXT_PUBLIC_API_URL=https://api.hydrilla.co
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

### Running Locally

**Development mode:**
```bash
npm run dev
```

Application will start on `http://localhost:3000`

**Production build:**
```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API URL (Node.js backend)
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Python API URL (GPU server)
NEXT_PUBLIC_API_URL=https://api.hydrilla.co

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Key Features

### 1. Authentication
- Sign up / Sign in via Clerk
- Protected routes
- User profile management

### 2. 3D Generation
- **Text-to-3D**: Generate 3D models from text prompts
- **Image-to-3D**: Generate 3D models from uploaded images
- Preview image generation before 3D generation
- Real-time progress tracking

### 3. Job Library
- View all generated jobs
- Filter by status
- Rename jobs
- Delete jobs
- View job details

### 4. 3D Viewer
- Interactive 3D model viewer (Three.js)
- Rotate, zoom, pan controls
- Download 3D models (.glb format)

### 5. Queue Information
- Real-time queue position
- Estimated wait time
- Jobs ahead in queue

## Pages

### `/` - Home Page
Landing page with hero section, features, and call-to-action.

### `/generate` - Generation Page
Main interface for generating 3D models:
- Text prompt input
- Image upload
- Preview generation
- 3D generation trigger
- Progress tracking

### `/library` - Job Library
View all user's generated jobs:
- Job list with status
- Filter and search
- Job actions (view, rename, delete)

### `/viewer` - 3D Viewer
Standalone 3D model viewer page.

### `/sign-in` - Sign In
Clerk authentication sign-in page.

### `/sign-up` - Sign Up
Clerk authentication sign-up page.

## API Integration

The frontend uses the API client in `lib/api.ts` to communicate with:

1. **Node.js Backend** (`NEXT_PUBLIC_BACKEND_URL`)
   - Authentication
   - Job management
   - File uploads
   - User data

2. **Python Backend** (`NEXT_PUBLIC_API_URL`)
   - Preview image generation
   - Direct API calls (when needed)

### Key API Functions

```typescript
// Generate preview image
generatePreviewImage(prompt: string)

// Submit text-to-3D job
submitTextTo3D(prompt: string)

// Submit image-to-3D job
submitImageTo3D(imageUrl: string)

// Get job status
fetchStatus(jobId: string)

// Get user's job history
fetchHistory()

// Upload image
uploadImage(file: File)
```

See `lib/api.ts` for complete API client implementation.

## Components

### Layout Components
- **Navbar**: Main navigation with auth state
- **Footer**: Site footer
- **ConditionalNavbar**: Navbar with conditional rendering

### Feature Components
- **ThreeViewer**: 3D model viewer (Three.js)
- **PromptBox**: Text input for prompts
- **JobStatusBadge**: Status indicator for jobs
- **LoadingProgress**: Progress indicator
- **UserSync**: Syncs user data on mount

### Page Sections
- **Hero**: Landing page hero section
- **VideoBackground**: Video background component

## Styling

Uses **Tailwind CSS** for styling:
- Utility-first CSS framework
- Responsive design
- Custom theme configuration in `tailwind.config.ts`

## Authentication Flow

1. User clicks "Sign In" or "Get Started"
2. Redirected to Clerk sign-in/sign-up page
3. After authentication, Clerk redirects back
4. Frontend receives JWT token
5. Token included in API requests via `Authorization` header
6. Backend validates token and extracts user_id

## State Management

- **SWR**: For server state (jobs, status)
- **React State**: For local component state
- **Clerk**: For authentication state

## Deployment

### Vercel Deployment

1. **Connect repository to Vercel**
2. **Set environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_BACKEND_URL`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

```bash
npm run build
# Deploy .next/ directory to your server
```

## Development

### Project Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Component-based architecture
- Tailwind CSS for styling

## Troubleshooting

### Build Errors

- Check Node.js version (18+ required)
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### API Connection Issues

- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Check backend server is running
- Verify CORS is configured on backend

### Authentication Issues

- Verify Clerk keys are correct
- Check Clerk dashboard for webhook configuration
- Verify redirect URLs in Clerk dashboard

### 3D Viewer Not Loading

- Check browser console for errors
- Verify GLB file URL is accessible
- Check Three.js compatibility with browser

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic with Next.js
- **Static Generation**: Where possible
- **SWR Caching**: Reduces API calls

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Backend README](../backend/README.md) - Backend documentation
- [System Architecture](../SYSTEM_ARCHITECTURE.md) - System overview
- [Environment Variables Guide](../ENVIRONMENT_VARIABLES.md) - Env var guide

## License

Private - Hydrilla Platform
