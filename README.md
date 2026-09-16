# Mart Connect Now

Mart Connect Now is a full-stack marketplace platform connecting **customers, retailers, and wholesalers**. It provides role-based dashboards, product management, order tracking, inventory management, reviews, and location-based product discovery.

## Features

- Role-based authentication for customers, retailers, and wholesalers
- Product listing and inventory management
- Product search and filtering
- Shopping cart and order placement
- Real-time order status updates
- Product ratings and reviews
- Location-based seller discovery
- Stock tracking and automatic inventory updates
- Separate dashboards for different user roles

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Realtime

### Deployment

- Vercel

## Project Structure

```text
mart-connect-now/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── integrations/
│   └── lib/
├── supabase/
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/RishiP2006/mart-connect-now.git
```

### 2. Navigate to the project directory

```bash
cd mart-connect-now
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

## Key Functionality

### Customers

Customers can:

- Browse available products
- Search and filter products
- Find nearby sellers
- Add products to their cart
- Place orders
- Track order status
- View previous orders
- Submit product ratings and reviews

### Retailers

Retailers can:

- Add and manage products
- Update product prices
- Manage inventory
- Set product availability
- View incoming orders
- Update order status

### Wholesalers

Wholesalers can:

- Manage product listings
- Maintain stock information
- Handle marketplace orders
- Supply products to retailers

## Database

The application uses **PostgreSQL through Supabase** to manage:

- Users
- Products
- Orders
- Inventory
- Reviews
- Seller information

Supabase **Row Level Security (RLS)** is used to control access to database records based on user roles.

## Real-Time Updates

**Supabase Realtime** is used to provide real-time order updates, allowing users to see changes in order status without manually refreshing the application.

## Location-Based Discovery

The platform supports location-based product and seller discovery, helping customers find products available from nearby retailers.

## Future Improvements

- Personalized product recommendations
- Advanced seller analytics
- Payment gateway integration
- Push notifications
- Improved map-based seller discovery
- Better retailer-wholesaler communication

## Author

**Rishi P**

GitHub: [RishiP2006](https://github.com/RishiP2006)
