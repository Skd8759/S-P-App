const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { protect, requireEmailVerification } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../utils/emailService');

const router = express.Router();

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
router.post('/', [
  protect,
  requireEmailVerification,
  body('slotId').isMongoId().withMessage('Valid slot ID is required'),
  body('bookingDate').isISO8601().withMessage('Booking date must be in ISO format'),
  body('isRaisingCourt').optional().isBoolean().withMessage('isRaisingCourt must be a boolean'),
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

    const { slotId, bookingDate, isRaisingCourt = false, notes } = req.body;
    const userId = req.user._id;

    // Check if slot exists and is active
    const slot = await Slot.findById(slotId);
    if (!slot || !slot.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found or inactive'
      });
    }

    // Check if user is trying to book for the correct gender
    if (req.user.profile.gender && req.user.profile.gender !== slot.gender) {
      return res.status(400).json({
        success: false,
        message: `This slot is for ${slot.gender} only`
      });
    }

    // Check if slot is available
    if (isRaisingCourt) {
      if (!slot.isRaisingCourt || !slot.isRaisingCourtAvailable()) {
        return res.status(400).json({
          success: false,
          message: 'Raising court is not available for this slot'
        });
      }
    } else {
      if (!slot.isAvailable()) {
        return res.status(400).json({
          success: false,
          message: 'Slot is fully booked'
        });
      }
    }

    // Check if user already has a booking for this slot
    const existingBooking = await Booking.findOne({
      user: userId,
      slot: slotId,
      bookingDate: new Date(bookingDate),
      status: { $in: ['confirmed'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for this slot'
      });
    }

    // Check if booking date is not in the past
    const bookingDateObj = new Date(bookingDate);
    const now = new Date();
    if (bookingDateObj < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book slots in the past'
      });
    }

    // Create booking
    const booking = await Booking.create({
      user: userId,
      slot: slotId,
      bookingDate: bookingDateObj,
      isRaisingCourt,
      bookingType: isRaisingCourt ? 'raising-court' : 'swimming',
      notes
    });

    // Update slot booking count
    if (isRaisingCourt) {
      slot.raisingCourtBookings += 1;
    } else {
      slot.currentBookings += 1;
    }
    await slot.save();

    // Add booking to user's bookings array
    await User.findByIdAndUpdate(userId, {
      $push: { bookings: booking._id }
    });

    // Populate booking with slot details
    await booking.populate('slot', 'date startTime endTime gender maxCapacity isRaisingCourt raisingCourtCapacity');

    // Send confirmation email
    const emailResult = await sendBookingConfirmation(req.user.email, {
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      gender: slot.gender,
      isRaisingCourt,
      bookingId: booking._id
    });

    if (!emailResult.success) {
      console.error('Failed to send booking confirmation email:', emailResult.error);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating booking'
    });
  }
});

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', [
  protect,
  query('status').optional().isIn(['confirmed', 'cancelled', 'completed', 'no-show']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    // Build filter object
    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bookings
    const bookings = await Booking.find(filter)
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

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('slot', 'date startTime endTime gender maxCapacity isRaisingCourt raisingCourtCapacity')
      .populate('user', 'name email profile');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking'
    });
  }
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', [
  protect,
  body('reason').optional().isLength({ max: 200 }).withMessage('Cancellation reason cannot be more than 200 characters')
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

    const { reason } = req.body;
    const bookingId = req.params.id;
    const userId = req.user._id;

    // Find booking
    const booking = await Booking.findById(bookingId).populate('slot');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled. Cancellation is only allowed up to 2 hours before the slot.'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();

    // Update slot booking count
    const slot = booking.slot;
    if (booking.isRaisingCourt) {
      slot.raisingCourtBookings = Math.max(0, slot.raisingCourtBookings - 1);
    } else {
      slot.currentBookings = Math.max(0, slot.currentBookings - 1);
    }
    await slot.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking'
    });
  }
});

// @desc    Check in to booking
// @route   PUT /api/bookings/:id/checkin
// @access  Private
router.put('/:id/checkin', protect, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check in for this booking'
      });
    }

    // Check if booking is confirmed
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be checked in'
      });
    }

    // Check if already checked in
    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in'
      });
    }

    // Check if it's the right time to check in (within 30 minutes of slot start)
    const slot = await Slot.findById(booking.slot);
    const slotStartTime = new Date(booking.bookingDate);
    const [hours, minutes] = slot.startTime.split(':');
    slotStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const now = new Date();
    const timeDiff = slotStartTime - now;
    const thirtyMinutes = 30 * 60 * 1000;

    if (timeDiff > thirtyMinutes || timeDiff < -thirtyMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Check-in is only allowed within 30 minutes of slot start time'
      });
    }

    // Update booking
    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Checked in successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-in'
    });
  }
});

// @desc    Check out from booking
// @route   PUT /api/bookings/:id/checkout
// @access  Private
router.put('/:id/checkout', protect, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check out for this booking'
      });
    }

    // Check if checked in
    if (!booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Must check in before checking out'
      });
    }

    // Check if already checked out
    if (booking.checkedOutAt) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out'
      });
    }

    // Update booking
    booking.checkedOutAt = new Date();
    booking.status = 'completed';
    await booking.save();

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-out'
    });
  }
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats/overview
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get booking statistics
    const stats = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total bookings
    const totalBookings = await Booking.countDocuments({ user: userId });

    // Get upcoming bookings
    const upcomingBookings = await Booking.countDocuments({
      user: userId,
      status: 'confirmed',
      bookingDate: { $gte: new Date() }
    });

    res.json({
      success: true,
      data: {
        totalBookings,
        upcomingBookings,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking statistics'
    });
  }
});

module.exports = router;
