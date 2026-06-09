# Phase 8 — Admin & Platform Operations

## Overview
Complete admin panel implementation for platform management, user moderation, restaurant/rider oversight, issue resolution, and promotional campaign management.

---

## Implementation Status

### ✅ Completed Components:
1. **AdminContext** - Authentication and state management
2. **AdminLogin** - Admin authentication page
3. **AdminDashboard** - Platform overview with metrics

### 🔄 In Progress:
4. Users Management (with ban/unban)
5. Restaurants Management
6. Riders Management
7. Orders/Issues Moderation (with refund UI)
8. Promos & Campaigns Manager
9. AdminLayout
10. Routing integration

---

## Admin Dashboard Features

### Platform Metrics Display:
- **Total Users**: 1,247 customers
- **Total Restaurants**: 156 active
- **Active Riders**: 89 online
- **Total Orders**: 5,634 lifetime
- **Today's Revenue**: $12,847.50
- **Active Orders**: 42 in progress
- **Pending Refunds**: 8 awaiting review
- **Flagged Issues**: 3 requiring attention

### Flagged Issues:
- Payment disputes
- Quality complaints
- Rider misconduct reports
- Priority levels (High, Medium, Low)

### Recent Activity Feed:
- New orders
- Customer issues
- Restaurant registrations
- Refund requests
- Rider milestones

---

## Demo Credentials

```
Email: admin@fooddelivery.com
Password: admin123
```

---

## Planned Features

### 1. Users Management
**Location**: `/admin/users`

**Features:**
- List all users with search and filters
- View user profile and order history
- Ban/Unban user accounts
- View reported issues by user
- Reset user passwords
- View user activity logs

**Moderation Actions:**
- Ban user (with reason)
- Unban user
- Suspend temporarily
- View ban history
- Send warnings

---

### 2. Restaurants Management
**Location**: `/admin/restaurants`

**Features:**
- List all restaurants with filters
- Approve/Reject new restaurant applications
- Suspend/Unsuspend restaurants
- View restaurant performance metrics
- Review customer complaints
- Manage restaurant documents

**Moderation Actions:**
- Approve registration
- Suspend operations
- Flag for quality review
- View compliance status

---

### 3. Riders Management
**Location**: `/admin/riders`

**Features:**
- List all riders with status
- Approve/Reject rider applications
- Suspend/Unsuspend riders
- View delivery performance
- Review customer feedback
- Verify documents

**Moderation Actions:**
- Approve application
- Suspend account
- Review complaints
- View performance metrics

---

### 4. Orders & Issues Moderation
**Location**: `/admin/issues`

**Features:**
- List all flagged issues
- Filter by type (payment, quality, behavior)
- Review order disputes
- **Refund Management UI:**
  - Approve refund requests
  - Partial/Full refund options
  - Add refund notes
  - Track refund status

**Issue Types:**
- Payment disputes
- Missing items
- Quality complaints
- Delivery issues
- Rider behavior
- Restaurant problems

**Refund UI:**
```javascript
{
  orderId: '12345',
  amount: 40.76,
  requestedAmount: 40.76,
  reason: 'Food never arrived',
  status: 'pending',
  customerName: 'John Doe',
  actions: ['approve_full', 'approve_partial', 'deny']
}
```

---

### 5. Promos & Campaigns Manager
**Location**: `/admin/promos`

**Features:**
- Create new promo codes
- Set discount type (percentage, fixed amount)
- Schedule start/end dates
- Set usage limits
- Target specific users/restaurants
- Track promo performance

**Promo Code Structure:**
```javascript
{
  code: 'WELCOME20',
  type: 'percentage', // or 'fixed'
  value: 20, // 20% or $20
  minOrder: 15.00,
  maxDiscount: 10.00,
  usageLimit: 100,
  usedCount: 0,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'active',
  targetUsers: 'all', // or 'new', 'specific'
  description: '20% off for new customers'
}
```

**Campaign Features:**
- Create seasonal promotions
- Flash sales
- Restaurant-specific promos
- First-order discounts
- Referral bonuses
- Loyalty rewards

**Acceptance Criteria:**
✅ Promotions appear on customer UI when active
✅ Discount applies at checkout
✅ Usage tracking and limits enforced
✅ Expiration dates respected

---

## File Structure

```
src/
├── pages/
│   └── admin/
│       ├── AdminLogin.jsx           (authentication)
│       ├── AdminDashboard.jsx       (platform overview)
│       ├── AdminUsers.jsx           (user management + ban/unban)
│       ├── AdminRestaurants.jsx     (restaurant management)
│       ├── AdminRiders.jsx          (rider management)
│       ├── AdminIssues.jsx          (issues + refund UI)
│       └── AdminPromos.jsx          (promo & campaign manager)
├── components/
│   └── AdminLayout.jsx              (admin navigation)
├── context/
│   └── AdminContext.jsx             (admin state)
└── App.jsx                          (routing)
```

---

## Routes

```
/admin/login           → AdminLogin
/admin/dashboard       → AdminDashboard
/admin/users           → AdminUsers (moderation)
/admin/restaurants     → AdminRestaurants
/admin/riders          → AdminRiders
/admin/issues          → AdminIssues (refunds)
/admin/promos          → AdminPromos (campaigns)
```

---

## Acceptance Criteria

| Feature | Status | Notes |
|---------|--------|-------|
| Admin dashboard overview | ✅ Complete | Shows platform metrics |
| View user/restaurant/rider counts | ✅ Complete | Real-time statistics |
| Filter platform data | ✅ Complete | By time range |
| Flagged issues display | ✅ Complete | Priority-based sorting |
| Manage users | 🔄 In Progress | Ban/unban functionality |
| Refund UI | 🔄 In Progress | Approve/deny with notes |
| Create promo codes | 🔄 In Progress | Full campaign manager |
| Schedule promotions | 🔄 In Progress | Date-based activation |
| Promotions appear on customer UI | 🔄 In Progress | Auto-apply at checkout |
| Simulate moderation actions | 🔄 In Progress | Mock API calls |

---

## Integration with Customer UI

### Promo Code Application:
When a promo is active, it will:
1. Appear in customer checkout page
2. Show "Apply Promo Code" input field
3. Validate code against active promotions
4. Calculate discount (percentage or fixed)
5. Apply to order total
6. Show savings breakdown

### Example Checkout Flow:
```
Subtotal: $50.00
Promo (WELCOME20): -$10.00
Delivery Fee: $2.99
Tax: $3.20
-------------------
Total: $46.19
You saved $10.00!
```

---

## Mock Data Examples

### Users:
```javascript
{
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+63 917 123 4567',
  status: 'active', // active, banned, suspended
  joinDate: '2024-01-15',
  totalOrders: 24,
  totalSpent: 487.50,
  lastOrder: '2 days ago',
  issues: 0,
  banReason: null
}
```

### Flagged Issues:
```javascript
{
  id: 1,
  type: 'payment',
  title: 'Double charge dispute',
  description: 'Customer claims charged twice',
  orderId: '12340',
  userId: 15,
  priority: 'high',
  status: 'pending',
  createdAt: '30 min ago',
  assignedTo: null
}
```

### Promo Codes:
```javascript
{
  id: 1,
  code: 'NEWYEAR2024',
  type: 'percentage',
  value: 25,
  minOrder: 20.00,
  maxDiscount: 15.00,
  usageLimit: 500,
  usedCount: 127,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  status: 'active'
}
```

---

## Future Enhancements

### Advanced Analytics:
- Revenue charts and trends
- User growth metrics
- Restaurant performance rankings
- Rider efficiency scores
- Peak hours analysis
- Geographic heatmaps

### Advanced Moderation:
- Automated flagging (AI/ML)
- Bulk actions
- Advanced filters
- Export reports
- Email notifications
- Activity logs

### Campaign Features:
- A/B testing
- Targeted push notifications
- Email campaigns
- SMS marketing
- Loyalty programs
- Referral tracking

### Compliance & Security:
- Audit logs
- Permission roles
- Two-factor authentication
- IP restrictions
- Data export (GDPR)
- Automated backups

---

## Technical Implementation Notes

### State Management:
- AdminContext for authentication
- Local state for moderation actions
- Mock API calls with setTimeout
- LocalStorage for persistence

### UI Patterns:
- Card-based metrics display
- Table views with pagination
- Modal dialogs for actions
- Toast notifications for feedback
- Confirmation dialogs for destructive actions

### Search & Filters:
- Real-time search
- Multiple filter criteria
- Date range selectors
- Status filters
- Export functionality

---

## Summary

Phase 8 provides a comprehensive admin panel for platform operations:
- ✅ **Dashboard**: Complete platform overview
- 🔄 **Moderation Tools**: User/restaurant/rider management
- 🔄 **Issue Resolution**: Refund UI and dispute handling
- 🔄 **Campaign Manager**: Promo code creation and scheduling

The admin panel gives platform operators full control over user management, quality assurance, issue resolution, and promotional campaigns.
