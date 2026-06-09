# Food Delivery Web App - Phase 0 Complete!

## What's Been Built

Phase 0 of your food delivery web app is now complete! Here's what's been created:

### 1. Project Shell & Routing ✅
- React + Vite project initialized
- React Router configured with the following routes:
  - `/` - Home page
  - `/restaurants` - Browse all restaurants
  - `/restaurant/:id` - Individual restaurant menu
  - `/cart` - Shopping cart
  - `/checkout` - Checkout (currently using Cart page)
  - `/orders` - Order tracking
  - `/profile` - User profile

### 2. UI System / Design Tokens ✅
- **Tailwind CSS** configured with custom design tokens
- **Color Palette:**
  - Primary (Red): Used for CTAs and branding
  - Secondary (Gray): Used for text and backgrounds
  - Success, Warning, Error colors
- **Typography:**
  - Font families: Inter (body), Poppins (headings)
  - Full type scale from xs to 5xl
- **Spacing, Border Radius, Shadows** - all customized

### 3. Reusable Components Library ✅
Located in `src/components/`:
- **Button** - Multiple variants (primary, secondary, outline, ghost) and sizes
- **Card** - Consistent card styling with optional hover effects
- **Header** - Navigation bar with logo, links, and cart icon
- **Footer** - Footer with links and social media
- **Modal** - Accessible modal component
- **Loader** - Loading spinner with full-screen option

### 4. Mock Data / API Layer ✅
- **Mock Data** (`src/data/mockData.js`):
  - 6 restaurants with details
  - 10+ menu items across restaurants
  - Sample orders with tracking info
  - User profiles
  - Categories

- **API Layer** (`src/services/api.js`):
  - Restaurant CRUD operations
  - Menu item queries
  - Order management
  - User profile handling
  - Search functionality
  - All endpoints simulate async behavior with delays

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Header.jsx
│   ├── Footer.jsx
│   ├── Modal.jsx
│   └── Loader.jsx
├── pages/            # Page components
│   ├── Home.jsx
│   ├── Restaurants.jsx
│   ├── Restaurant.jsx
│   ├── Cart.jsx
│   ├── OrderTracking.jsx
│   └── Profile.jsx
├── services/         # API layer
│   └── api.js
├── data/            # Mock data
│   └── mockData.js
├── assets/          # Images, icons, etc.
├── App.jsx          # Main app with routing
└── index.css        # Global styles with Tailwind
```

## Getting Started

### 1. Install Dependencies

Run this command in your terminal:

```bash
npm install
```

This will install:
- React & React DOM
- React Router DOM
- Tailwind CSS, PostCSS, Autoprefixer
- Vite and build tools

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is busy).

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## Features Working Out of the Box

1. **Home Page**: Hero section, search bar, categories, featured restaurants
2. **Restaurants**: Browse all restaurants, filter by category, search
3. **Restaurant Menu**: View menu items by category, add to cart modal
4. **Cart**: View cart items, adjust quantities, see order summary
5. **Order Tracking**: View active and past orders with status
6. **Profile**: View and edit user information, see order statistics

## Design System Usage

### Using Tailwind Classes

All components use Tailwind CSS classes. Examples:

```jsx
// Primary button color
<div className="bg-primary-600 text-white">

// Spacing
<div className="p-4 m-2">

// Custom container
<div className="container-custom">
```

### Using Custom Components

```jsx
import Button from './components/Button';
import Card from './components/Card';

<Button variant="primary" size="lg">Click Me</Button>
<Card hover>Content here</Card>
```

## Next Steps (Future Phases)

1. **Backend Integration**: Replace mock API with real backend
2. **Authentication**: Add user login/signup
3. **State Management**: Add Context API or Redux for cart/user state
4. **Payment Integration**: Add Stripe or PayPal
5. **Real-time Tracking**: WebSocket for live order tracking
6. **Image Uploads**: Add restaurant and food images
7. **Reviews & Ratings**: Allow users to rate restaurants
8. **Search & Filters**: Enhanced search with multiple filters

## Troubleshooting

### If npm install is stuck:
- Try `npm cache clean --force`
- Check your internet connection
- Try using `yarn install` instead

### If Tailwind styles aren't working:
- Make sure you ran `npm install`
- Check that `index.css` is imported in `main.jsx`
- Restart the dev server

### If routing doesn't work:
- Make sure all dependencies are installed
- Check browser console for errors

## Questions?

The codebase is fully commented and organized. Feel free to explore and modify as needed!
