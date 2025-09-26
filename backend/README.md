# SOMBANGO Backend API

Backend API for SOMBANGO e-commerce platform built with Node.js, Express, and MySQL.

## Features

- User authentication with JWT
- Role-based access control (Buyer, Seller, SuperAdmin)
- Product management
- Order management
- Shopping cart
- Wishlist
- Reviews and ratings
- Shop management
- Advertisement system
- Admin dashboard
- API documentation with Swagger

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn

### Steps

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd sombango-backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your database credentials and other settings.

4. Set up the database
   - Create a MySQL database named `sombango`
   - Import the database schema from `app.sql`
   - Run the initialization script
     ```bash
     node init-db.js
     ```

5. Start the server
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

6. Access the API documentation
   Open your browser and navigate to `http://localhost:3000/api-docs`

## API Documentation

The API documentation is available at `/api-docs` when the server is running. It provides interactive documentation for all endpoints.

## Project Structure

```
sombango-backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── authController.js     # Authentication controller
│   ├── buyerController.js    # Buyer functionality controller
│   ├── sellerController.js   # Seller functionality controller
│   ├── adController.js       # Advertisement controller
│   └── adminController.js    # Admin functionality controller
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── buyerRoutes.js       # Buyer routes
│   ├── sellerRoutes.js      # Seller routes
│   ├── adRoutes.js          # Advertisement routes
│   └── adminRoutes.js       # Admin routes
├── uploads/                 # File uploads directory
├── .env                     # Environment variables
├── app.sql                  # Database schema
├── init-db.js               # Database initialization script
├── package.json             # Project dependencies
├── server.js                # Main server file
└── README.md                # This file
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Buyer

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `GET /api/buyer/cart` - Get user's cart
- `POST /api/buyer/cart` - Add item to cart
- `PUT /api/buyer/cart/:itemId` - Update cart item
- `DELETE /api/buyer/cart/:itemId` - Remove item from cart
- `POST /api/buyer/orders` - Create order
- `GET /api/buyer/orders` - Get user's orders
- `GET /api/buyer/orders/:id` - Get order details
- `POST /api/buyer/wishlist` - Add product to wishlist
- `GET /api/buyer/wishlist` - Get user's wishlist
- `DELETE /api/buyer/wishlist/:productId` - Remove product from wishlist
- `POST /api/buyer/products/:productId/reviews` - Add product review
- `GET /api/products/:productId/reviews` - Get product reviews

### Seller

- `POST /api/seller/shops` - Create a new shop
- `GET /api/seller/shops` - Get seller's shops
- `GET /api/seller/shops/:id` - Get shop details
- `PUT /api/seller/shops/:id` - Update shop
- `POST /api/seller/shops/:shopId/products` - Create a new product
- `GET /api/seller/shops/:shopId/products` - Get shop's products
- `GET /api/seller/shops/:shopId/products/:productId` - Get product details
- `PUT /api/seller/shops/:shopId/products/:productId` - Update product
- `DELETE /api/seller/shops/:shopId/products/:productId` - Delete product
- `GET /api/seller/shops/:shopId/orders` - Get shop's orders
- `GET /api/seller/shops/:shopId/orders/:orderId` - Get order details
- `PUT /api/seller/shops/:shopId/orders/:orderId` - Update order status
- `GET /api/seller/shops/:shopId/stats` - Get shop statistics
- `GET /api/seller/shops/:shopId/categories` - Get shop categories

### Advertisement

- `POST /api/seller/ads` - Create a new ad
- `GET /api/seller/ads` - Get seller's ads
- `GET /api/ads/:id` - Get ad details
- `PUT /api/seller/ads/:id` - Update ad
- `DELETE /api/seller/ads/:id` - Delete ad
- `GET /api/ads` - Get active ads
- `GET /api/admin/ads` - Get all ads (SuperAdmin)
- `PUT /api/admin/ads/:id/approve` - Approve ad (SuperAdmin)
- `PUT /api/admin/ads/:id/reject` - Reject ad (SuperAdmin)
- `POST /api/admin/ads` - Create official ad (SuperAdmin)
- `GET /api/ads/stats` - Get ad statistics

### Admin

- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/shops` - Get all shops
- `GET /api/admin/shops/:id` - Get shop details
- `PUT /api/admin/shops/:id` - Update shop
- `DELETE /api/admin/shops/:id` - Delete shop
- `GET /api/admin/reports` - Get all reports
- `GET /api/admin/reports/:id` - Get report details
- `PUT /api/admin/reports/:id` - Update report status
- `GET /api/admin/platform-stats` - Get platform statistics
- `PUT /api/admin/platform-stats` - Update platform statistics

## Default SuperAdmin

After running the initialization script, a default superadmin user will be created with the following credentials:

- Email: admin@sombango.com
- Password: admin123

## Environment Variables

The following environment variables can be configured in the `.env` file:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sombango

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# OTP Configuration
OTP_EXPIRES_MINUTES=15

# Email Configuration (for OTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# File Upload Configuration
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=5242880
```

## Security Features

- JWT token authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting
- Helmet for security headers
- CORS configuration
- Input validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.