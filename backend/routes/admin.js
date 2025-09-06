const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });

    // Get slot statistics
    const totalSlots = await Slot.countDocuments();
    const activeSlots = await Slot.countDocuments({ isActive: true });

    // Get booking statistics
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await Booking.countDocuments({
      bookingDate: { $gte: today, $lt: tomorrow }
    });

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate('slot', 'date startTime endTime gender')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get booking trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers
        },
        slots: {
          total: totalSlots,
          active: activeSlots
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
          today: todayBookings
        },
        recentBookings,
        bookingTrends
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('isEmailVerified').optional().isBoolean().withMessage('isEmailVerified must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10, role, isActive, isEmailVerified } = req.query;

    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified === 'true';

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users
    const users = await User.find(filter)
      .select('-password -emailVerificationOTP -emailVerificationExpires -resetPasswordOTP -resetPasswordExpires')
      .populate('bookings')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationOTP -emailVerificationExpires -resetPasswordOTP -resetPasswordExpires')
      .populate({
        path: 'bookings',
        populate: {
          path: 'slot',
          select: 'date startTime endTime gender'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
router.put('/users/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isEmailVerified').optional().isBoolean().withMessage('isEmailVerified must be a boolean'),
  body('profile.studentId').optional().trim().isLength({ min: 1, max: 20 }).withMessage('Student ID must be between 1 and 20 characters'),
  body('profile.department').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Department must be between 1 and 50 characters'),
  body('profile.phone').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationOTP -emailVerificationExpires -resetPasswordOTP -resetPasswordExpires');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active bookings
    const activeBookings = await Booking.countDocuments({
      user: req.params.id,
      status: 'confirmed'
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active bookings. Please cancel all bookings first.'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (Admin)
router.get('/bookings', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['confirmed', 'cancelled', 'completed', 'no-show']).withMessage('Invalid status'),
  query('date').optional().isISO8601().withMessage('Date must be in ISO format')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10, status, date } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.bookingDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bookings
    const bookings = await Booking.find(filter)
      .populate('user', 'name email profile')
      .populate('slot', 'date startTime endTime gender maxCapacity isRaisingCourt raisingCourtCapacity')
      .sort({ bookingDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    });
  }
});

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private (Admin)
router.put('/bookings/:id/status', [
  body('status').isIn(['confirmed', 'cancelled', 'completed', 'no-show']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 200 }).withMessage('Notes cannot be more than 200 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, notes } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking status
    booking.status = status;
    if (notes) booking.notes = notes;
    
    if (status === 'cancelled' && !booking.cancelledAt) {
      booking.cancelledAt = new Date();
    }
    
    if (status === 'completed' && !booking.checkedOutAt) {
      booking.checkedOutAt = new Date();
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking status'
    });
  }
});

// @desc    Create default slots for a date
// @route   POST /api/admin/slots/create-default
// @access  Private (Admin)
router.post('/slots/create-default', [
  body('date').isISO8601().withMessage('Date must be in ISO format')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date } = req.body;
    const slotDate = new Date(date);

    // Default slot configuration
    const defaultSlots = [
      { startTime: '05:00', endTime: '06:00', gender: 'male' },
      { startTime: '06:00', endTime: '07:00', gender: 'female' },
      { startTime: '07:00', endTime: '08:00', gender: 'male' },
      { startTime: '08:00', endTime: '09:00', gender: 'female' },
      { startTime: '16:00', endTime: '17:00', gender: 'male' },
      { startTime: '17:00', endTime: '19:00', gender: 'female' },
      { startTime: '19:00', endTime: '20:00', gender: 'male' }
    ];

    const createdSlots = [];

    for (const slotConfig of defaultSlots) {
      // Check if slot already exists
      const existingSlot = await Slot.findOne({
        date: slotDate,
        startTime: slotConfig.startTime,
        endTime: slotConfig.endTime,
        gender: slotConfig.gender
      });

      if (!existingSlot) {
        const slot = await Slot.create({
          date: slotDate,
          startTime: slotConfig.startTime,
          endTime: slotConfig.endTime,
          gender: slotConfig.gender,
          maxCapacity: 40,
          isRaisingCourt: true,
          raisingCourtCapacity: 10,
          description: 'Regular swimming pool slot'
        });
        createdSlots.push(slot);
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdSlots.length} slots for ${slotDate.toDateString()}`,
      data: { slots: createdSlots }
    });
  } catch (error) {
    console.error('Create default slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating default slots'
    });
  }
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
router.get('/analytics', [
  query('startDate').optional().isISO8601().withMessage('Start date must be in ISO format'),
  query('endDate').optional().isISO8601().withMessage('End date must be in ISO format')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    // Booking trends by date
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Booking status distribution
    const statusDistribution = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Gender distribution
    const genderDistribution = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'slots',
          localField: 'slot',
          foreignField: '_id',
          as: 'slotData'
        }
      },
      {
        $unwind: '$slotData'
      },
      {
        $group: {
          _id: '$slotData.gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Peak hours analysis
    const peakHours = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'slots',
          localField: 'slot',
          foreignField: '_id',
          as: 'slotData'
        }
      },
      {
        $unwind: '$slotData'
      },
      {
        $group: {
          _id: '$slotData.startTime',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: { start, end },
        bookingTrends,
        statusDistribution,
        genderDistribution,
        peakHours
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;
