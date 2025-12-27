# Components Organization

This directory contains all reusable React components organized by category.

## Folder Structure

```
components/
├── layout/          # Layout components (Navbar, Footer, etc.)
│   └── Navbar.tsx   # Glassmorphic navigation bar
│
├── sections/        # Page section components
│   └── Hero.tsx     # Hero section with gradient background
│
├── ClientProviders.tsx  # Client-side providers wrapper
├── ConfirmModal.tsx     # Confirmation modal component
├── JobStatusBadge.tsx   # Status badge for jobs
├── LoadingProgress.tsx  # Loading progress indicator
├── Navigation.tsx       # Legacy navigation (to be deprecated)
├── ThreeViewer.tsx      # 3D model viewer component
└── UserSync.tsx         # User synchronization component
```

## Component Categories

### Layout Components (`/layout`)
Components that define the overall structure and navigation of pages:
- **Navbar.tsx**: Main navigation bar with glassmorphism effects, responsive design, and dropdown menus

### Section Components (`/sections`)
Reusable page sections that can be composed to build pages:
- **Hero.tsx**: Landing page hero section with promotional content and CTA

### Utility Components
Standalone components for specific functionality:
- **ClientProviders.tsx**: Wraps children with client-side providers
- **ConfirmModal.tsx**: Reusable confirmation dialog
- **JobStatusBadge.tsx**: Display job status with appropriate styling
- **LoadingProgress.tsx**: Progress indicator for loading states
- **ThreeViewer.tsx**: 3D model visualization using Three.js
- **UserSync.tsx**: Handles user data synchronization

## Design System

### Fonts
- **Primary**: DM Sans (body text, UI elements)
- **Secondary**: Playfair Display (headings, decorative text)

### Color Palette
- Blue gradient theme for hero sections
- Dark theme with glassmorphism for UI components
- White/light theme for authenticated areas

### Effects
- Glassmorphism: `backdrop-blur-*` with semi-transparent backgrounds
- Smooth transitions and hover effects
- Responsive design across all breakpoints

## Usage Guidelines

1. **Import from this directory**: Always import components using the alias `@/components`
2. **Maintain organization**: Place new components in appropriate subdirectories
3. **Keep it modular**: Each component should be self-contained and reusable
4. **Document props**: Add JSDoc comments for component props
5. **Use TypeScript**: All components should be typed




