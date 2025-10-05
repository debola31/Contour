# Tour System Guide - CTM Manufacturing Management System

## Overview
The CTM application now includes a comprehensive guided tour system that helps first-time users understand the platform's features. The tour system consists of:
1. **Initial Website Tour** - Shown once when a user first logs in
2. **Page-Specific Tours** - Triggered the first time a user visits each dashboard page

## Features

### 🎯 Smart Tour Triggering
- **Initial Tour**: Automatically starts 500ms after first login
- **Page Tours**: Automatically start 300ms after first visit to each page
- **One-Time Only**: Tours are tracked and never shown again once completed
- **Skippable**: Users can skip any tour at any time
- **Persistent**: Tour completion is saved in localStorage

### 🎨 Visual Tour Components
- **Overlay**: Dark overlay highlights the current element
- **Tooltip**: Clean white tooltip with arrow pointing to element
- **Navigation**: Back, Skip, and Next/Finish buttons
- **Progress**: "X of Y" step counter
- **Close Button**: X button to exit tour

### 📍 Tour Locations

#### Initial Website Tour (4 steps)
Covers the basics for all new users:
1. Welcome message
2. Sidebar navigation
3. Logo/collapse functionality
4. User information menu

#### Page-Specific Tours (13 tours)
Each dashboard page has its own tour:

**For All Roles:**
1. **Dashboard Home** (3 steps) - Key metrics, recent activity, charts
2. **Work Orders** (3 steps) - Create, search/filter, list
3. **Customers** (3 steps) - Add customer, search, table management
4. **Operators** (3 steps) - Performance metrics, badges, operator details
5. **Inventory** (3 steps) - Add material, low stock alerts, inventory table
6. **Invoices** (2 steps) - Filter, table management
7. **Shipping** (2 steps) - Filter, shipment tracking
8. **Transactions** (2 steps) - Filter by type, audit trail
9. **Insights** (3 steps) - Trend charts, status distribution, inventory charts

**Owner/Salesperson Only:**
10. **Personnel** (3 steps) - Add personnel, role filter, management

**Owner Only:**
11. **Templates** (4 steps) - Create template, templates library, workflow viewer, visual editor
12. **Admin** (3 steps) - System stats, live station monitor, recent orders

**Operator Only:**
13. **Station Work** (4 steps) - Scan work order, select station, current step, complete work

## Technical Implementation

### Components

#### `Tour.tsx` - Core Tour Component
```typescript
interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}
```

**Features:**
- Dynamic positioning based on target element
- Auto-adjusting tooltip placement
- Arrow pointing to target element
- Responsive to window resize and scroll
- Highlights target element with box shadow

#### `TourProvider.tsx` - Tour Management
Wraps the dashboard layout and:
- Detects first-time users
- Triggers initial tour after login
- Triggers page tours on first visit
- Manages tour state and completion
- Prevents tour overlap

### Configuration

#### `tours.ts` - Tour Definitions
All tours are defined in `/src/config/tours.ts`:
```typescript
export const initialTour: TourStep[] = [ ... ];
export const dashboardHomeTour: TourStep[] = [ ... ];
// ... 12 more page-specific tours

export const tourIds = {
  initial: 'initial-tour',
  dashboardHome: 'dashboard-home-tour',
  // ... etc
};

export const pageTours: Record<string, { id: string; steps: TourStep[] }> = {
  '/dashboard': { id: tourIds.dashboardHome, steps: dashboardHomeTour },
  // ... etc
};
```

### State Management

#### Zustand Store
Added to `/src/store/useStore.ts`:
```typescript
// State
completedTours: string[]

// Actions
completeTour: (tourId: string) => void
isTourCompleted: (tourId: string) => boolean
resetTours: () => void
```

#### AppState Type
Added to `/src/types/index.ts`:
```typescript
export interface AppState {
  // ... existing fields
  completedTours: string[];
}
```

### Data Attributes

Key UI elements have `data-tour` attributes for tour targeting:

**Sidebar:**
- `data-tour="sidebar"` - The sidebar navigation
- `data-tour="logo"` - Logo/brand area

**Header:**
- `data-tour="user-info"` - User menu

**Page-Specific** (examples, need to be added to each page):
- `data-tour="stats-cards"` - Dashboard statistics
- `data-tour="new-work-order"` - Create work order button
- `data-tour="search-filter"` - Search/filter controls
- etc.

## Adding Tours to New Pages

### Step 1: Define the Tour
In `/src/config/tours.ts`:
```typescript
export const myNewPageTour: TourStep[] = [
  {
    target: '[data-tour="some-element"]',
    title: 'Feature Name',
    content: 'Description of what this feature does.',
    placement: 'bottom',
  },
  // ... more steps
];
```

### Step 2: Add Tour ID
```typescript
export const tourIds = {
  // ... existing
  myNewPage: 'my-new-page-tour',
};
```

### Step 3: Map Page Path to Tour
```typescript
export const pageTours: Record<string, { id: string; steps: TourStep[] }> = {
  // ... existing
  '/dashboard/my-new-page': { id: tourIds.myNewPage, steps: myNewPageTour },
};
```

### Step 4: Add Data Attributes
In your page component:
```tsx
<button data-tour="some-element">Click Me</button>
<div data-tour="another-element">Content</div>
```

## Customization

### Styling
The tour uses Tailwind CSS classes. Modify `Tour.tsx` to change:
- Tooltip background color: `bg-white`
- Overlay opacity: `bg-black/50`
- Button colors: `bg-[#4682B4]`
- Shadow/highlight effect: `.tour-highlight` class

### Timing
Adjust delays in `TourProvider.tsx`:
```typescript
// Initial tour delay
setTimeout(() => { ... }, 500); // 500ms

// Page tour delay
setTimeout(() => { ... }, 300); // 300ms
```

### Placement Logic
The `Tour.tsx` component automatically calculates tooltip position based on:
- Target element location
- Tooltip size
- Placement preference ('top', 'bottom', 'left', 'right')
- Screen boundaries

## User Experience Flow

### First-Time User Journey

1. **Login** → Initial tour starts (4 steps covering basics)
2. **Click "Work Orders" in sidebar** → Work Orders tour starts (3 steps)
3. **Click "Customers"** → Customers tour starts (3 steps)
4. ... and so on for each new page visited

### Returning User
- No tours shown (all marked as completed)
- Clean, uninterrupted experience

### Resetting Tours
Users can reset tours (if you add a UI button for it):
```typescript
const resetTours = useStore((state) => state.resetTours);
resetTours(); // Clears all completed tours
```

## Best Practices

### Writing Tour Content
1. **Be Concise**: Keep titles short (3-5 words), content to 1-2 sentences
2. **Focus on Value**: Explain WHAT and WHY, not just HOW
3. **Logical Order**: Start with overview, then dive into specifics
4. **Action-Oriented**: Use verbs (Create, View, Track, Manage)

### Choosing Tour Elements
1. **Primary Actions**: Buttons users will click frequently
2. **Key Information**: Important stats or data displays
3. **Navigation**: Where to find things
4. **Workflows**: Multi-step processes

### Placement Tips
- **Top**: For elements at the bottom of viewport
- **Bottom**: For elements at the top (headers, toolbars)
- **Left**: For elements on the right side (sidebars, panels)
- **Right**: For elements on the left side (main content)

## Troubleshooting

### Tour Not Appearing
1. Check that `data-tour` attribute exists on target element
2. Verify element is visible when tour starts
3. Check browser console for errors
4. Ensure tour ID is not in `completedTours` (check localStorage)

### Tooltip Positioning Wrong
1. Element might not be rendered when position is calculated
2. Try increasing delay in `TourProvider.tsx`
3. Check if element has correct dimensions (not 0x0)

### Tour Triggering Multiple Times
1. Tour completion might not be saving
2. Check localStorage for `contour-erp-storage` key
3. Verify `completeTour()` is being called on finish/skip

### Element Not Highlighting
1. Element might have `z-index` preventing highlight
2. Check if element is in a modal or overlay
3. Verify `.tour-highlight` CSS is loading correctly

## Development Tips

### Testing Tours Locally
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Login to trigger tours again

### Preview Specific Tour
```typescript
// In browser console
localStorage.removeItem('contour-erp-storage');
// Or remove specific tour:
const store = JSON.parse(localStorage.getItem('contour-erp-storage'));
store.state.completedTours = store.state.completedTours.filter(id => id !== 'dashboard-home-tour');
localStorage.setItem('contour-erp-storage', JSON.stringify(store));
```

### Debug Mode
Add console logs to `TourProvider.tsx`:
```typescript
console.log('Current tour:', currentTour);
console.log('Completed tours:', completedTours);
console.log('Should run:', !isTourCompleted(tourId));
```

## Future Enhancements

### Potential Improvements
- [ ] Add "Next time" button (postpone tour to next session)
- [ ] Progress dots instead of "X of Y" text
- [ ] Smooth transitions between steps
- [ ] Keyboard navigation (arrow keys, ESC to skip)
- [ ] Tour analytics (track which steps users skip)
- [ ] Video/GIF support in tour steps
- [ ] "Show me again" button in settings
- [ ] Tour search/index in help menu
- [ ] Multi-language support
- [ ] Conditional tours based on user role

### API Considerations
For a backend version:
- Store completed tours in user profile
- Track tour engagement metrics
- A/B test different tour content
- Update tours without redeploying
- Role-specific tour variations

## Performance

### Bundle Size Impact
- **Tour.tsx**: ~2KB
- **TourProvider.tsx**: ~1KB
- **tours.ts**: ~8KB (13 tours × ~25 steps)
- **Total**: ~11KB added to bundle

### Runtime Performance
- Minimal overhead when no tour is active
- DOM queries only during active tour
- Event listeners cleaned up on tour completion
- No re-renders of main app during tours

## Accessibility

### Current Status
The tour system has basic accessibility but could be improved:

**Implemented:**
- Semantic HTML (buttons, divs with proper roles)
- Keyboard accessible (Tab to navigate buttons)
- Screen reader friendly (text content)

**To Improve:**
- Add ARIA labels and roles
- Announce tour steps to screen readers
- Ensure focus management
- Support high contrast mode
- Add keyboard shortcuts (ESC, arrow keys)

## Summary

The tour system provides:
✅ Automatic onboarding for new users
✅ Context-aware help for each page
✅ Persistent tour completion tracking
✅ Clean, non-intrusive design
✅ Easy to extend and customize
✅ Zero dependencies (custom React 19 implementation)

Users get a smooth introduction to the platform without overwhelming them, and tours only appear once, ensuring returning users have an uninterrupted experience.
