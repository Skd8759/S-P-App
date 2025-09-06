const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Slot = require('../models/Slot');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all available slots
// @route   GET /api/slots
// @access  Public
router.get('/', [
  query('date').optional().isISO8601().withMessage('Date must be in ISO format'),
  query('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
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

    const { date, gender, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    if (gender) {
      filter.gender = gender;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get slots
    const slots = await Slot.find(filter)
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Slot.countDocuments(filter);

    res.json({
      success: true,
      data: {
        slots,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching slots'
    });
  }
});

// @desc    Get slot by ID
// @route   GET /api/slots/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    res.json({
      success: true,
      data: { slot }
    });
  } catch (error) {
    console.error('Get slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching slot'
    });
  }
});

// @desc    Create new slot (Admin only)
// @route   POST /api/slots
// @access  Private (Admin)
router.post('/', [
  protect,
  authorize('admin'),
  body('date').isISO8601().withMessage('Date must be in ISO format'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('maxCapacity').optional().isInt({ min: 1, max: 100 }).withMessage('Max capacity must be between 1 and 100'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description cannot be more than 200 characters'),
  body('isRaisingCourt').optional().isBoolean().withMessage('isRaisingCourt must be a boolean'),
  body('raisingCourtCapacity').optional().isInt({ min: 1, max: 50 }).withMessage('Raising court capacity must be between 1 and 50')
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

    const {
      date,
      startTime,
      endTime,
      gender,
      maxCapacity = 40,
      description,
      isRaisingCourt = false,
      raisingCourtCapacity = 10
    } = req.body;

    // Check if slot already exists for the same date and time
    const existingSlot = await Slot.findOne({
      date: new Date(date),
      startTime,
      endTime,
      gender
    });

    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: 'A slot already exists for this date, time, and gender'
      });
    }

    // Create slot
    const slot = await Slot.create({
      date: new Date(date),
      startTime,
      endTime,
      gender,
      maxCapacity,
      description,
      isRaisingCourt,
      raisingCourtCapacity
    });

    res.status(201).json({
      success: true,
      message: 'Slot created successfully',
      data: { slot }
    });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating slot'
    });
  }
});

// @desc    Update slot (Admin only)
// @route   PUT /api/slots/:id
// @access  Private (Admin)
router.put('/:id', [
  protect,
  authorize('admin'),
  body('date').optional().isISO8601().withMessage('Date must be in ISO format'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('maxCapacity').optional().isInt({ min: 1, max: 100 }).withMessage('Max capacity must be between 1 and 100'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description cannot be more than 200 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isRaisingCourt').optional().isBoolean().withMessage('isRaisingCourt must be a boolean'),
  body('raisingCourtCapacity').optional().isInt({ min: 1, max: 50 }).withMessage('Raising court capacity must be between 1 and 50')
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

    const slot = await Slot.findById(req.params.id);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    // Update slot
    const updatedSlot = await Slot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Slot updated successfully',
      data: { slot: updatedSlot }
    });
  } catch (error) {
    console.error('Update slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating slot'
    });
  }
});

// @desc    Delete slot (Admin only)
// @route   DELETE /api/slots/:id
// @access  Private (Admin)
router.delete('/:id', [protect, authorize('admin')], async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    // Check if slot has bookings
    if (slot.currentBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete slot with existing bookings. Please deactivate instead.'
      });
    }

    await Slot.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Slot deleted successfully'
    });
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting slot'
    });
  }
});

// @desc    Get slots for a specific date range
// @route   GET /api/slots/date-range
// @access  Public
router.get('/date-range', [
  query('startDate').isISO8601().withMessage('Start date must be in ISO format'),
  query('endDate').isISO8601().withMessage('End date must be in ISO format'),
  query('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female')
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

    const { startDate, endDate, gender } = req.query;
    
    // Build filter object
    const filter = { 
      isActive: true,
      date: { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      }
    };
    
    if (gender) {
      filter.gender = gender;
    }

    // Get slots
    const slots = await Slot.find(filter)
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      data: { slots }
    });
  } catch (error) {
    console.error('Get slots by date range error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching slots by date range'
    });
  }
});

// @desc    Get available slots for booking
// @route   GET /api/slots/available
// @access  Public
router.get('/available', [
  query('date').isISO8601().withMessage('Date must be in ISO format'),
  query('gender').isIn(['male', 'female']).withMessage('Gender must be male or female')
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

    const { date, gender } = req.query;
    
    // Build filter for available slots
    const filter = { 
      isActive: true,
      gender,
      date: new Date(date),
      $expr: { $lt: ['$currentBookings', '$maxCapacity'] }
    };

    // Get available slots
    const slots = await Slot.find(filter)
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: { slots }
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available slots'
    });
  }
});

module.exports = router;
