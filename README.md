# NITK Swimming Pool Booking System

A comprehensive web application for managing swimming pool bookings at NITK (National Institute of Technology Karnataka). Built with MERN stack (MongoDB, Express.js, React, Node.js).

## Features

### User Features
- **User Registration & Authentication**: NITK email verification with OTP
- **Slot Booking**: Book swimming pool slots with gender-specific timings
- **Booking Management**: View, cancel, and track booking history
- **Raising Court Booking**: Separate booking system for raising court
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Admin Features
- **Dashboard**: Comprehensive analytics and overview
- **User Management**: Manage user accounts and permissions
- **Slot Management**: Create and manage time slots
- **Booking Management**: Monitor and manage all bookings
- **Analytics**: Detailed insights and reporting

### Pool Timings
- **Morning Slots**: 5:00 AM - 9:00 AM (Alternating male/female)
- **Evening Slots**: 4:00 PM - 8:00 PM (Alternating male/female)
- **Capacity**: 40 people per slot (10 for raising court)
- **Duration**: 1 hour per slot

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Nodemailer** for email services
- **Bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Gmail account for email services

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nitk-swimming-pool-booking
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/nitk-swimming-pool

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure
JWT_EXPIRE=7d

# Email Configuration (using Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Node Environment
NODE_ENV=development

# Server Port
PORT=5000
```

### 5. Gmail Setup for Email Services

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in the `EMAIL_PASS` field

### 6. Database Setup

Make sure MongoDB is running on your system:
```bash
# Start MongoDB (if installed locally)
mongod
```

## Running the Application

### Development Mode

1. **Start the Backend Server**:
```bash
npm run server
```

2. **Start the Frontend Development Server** (in a new terminal):
```bash
npm run client
```

3. **Or run both simultaneously**:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production Build

1. **Build the Frontend**:
```bash
npm run build
```

2. **Start the Production Server**:
```bash
NODE_ENV=production npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Slots
- `GET /api/slots` - Get available slots
- `GET /api/slots/:id` - Get slot by ID
- `POST /api/slots` - Create slot (Admin)
- `PUT /api/slots/:id` - Update slot (Admin)
- `DELETE /api/slots/:id` - Delete slot (Admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `PUT /api/bookings/:id/checkin` - Check in
- `PUT /api/bookings/:id/checkout` - Check out

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/bookings` - Get all bookings
- `PUT /api/admin/bookings/:id/status` - Update booking status
- `GET /api/admin/analytics` - Get analytics data

## Project Structure

```
nitk-swimming-pool-booking/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Slot.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── slots.js
│   │   ├── bookings.js
│   │   └── admin.js
│   ├── utils/
│   │   └── emailService.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── package.json
└── README.md
```

## Key Features Implementation

### Authentication System
- JWT-based authentication
- NITK email validation
- OTP verification via email
- Password reset functionality
- Role-based access control (User/Admin)

### Booking System
- Real-time slot availability
- Gender-specific slot allocation
- Capacity management
- Booking cancellation (up to 2 hours before)
- Check-in/check-out system

### Admin Panel
- Comprehensive dashboard
- User management
- Slot creation and management
- Booking monitoring
- Analytics and reporting

### Email Integration
- Beautiful HTML email templates
- OTP delivery
- Booking confirmations
- Password reset notifications

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet.js for security headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Future Enhancements

- Mobile app development
- QR code integration for check-ins
- Advanced analytics dashboard
- Notification system
- Integration with NITK student management system
- Multi-language support
