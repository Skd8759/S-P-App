const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time format (HH:MM)']
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Gender is required']
  },
  maxCapacity: {
    type: Number,
    required: [true, 'Maximum capacity is required'],
    default: 40
  },
  currentBookings: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  // For raising court (special slot)
  isRaisingCourt: {
    type: Boolean,
    default: false
  },
  raisingCourtCapacity: {
    type: Number,
    default: 10
  },
  raisingCourtBookings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
slotSchema.index({ date: 1, startTime: 1 });
slotSchema.index({ date: 1, gender: 1 });

// Virtual for available spots
slotSchema.virtual('availableSpots').get(function() {
  return this.maxCapacity - this.currentBookings;
});

// Virtual for raising court available spots
slotSchema.virtual('raisingCourtAvailableSpots').get(function() {
  return this.raisingCourtCapacity - this.raisingCourtBookings;
});

// Method to check if slot is available
slotSchema.methods.isAvailable = function() {
  return this.isActive && this.currentBookings < this.maxCapacity;
};

// Method to check if raising court is available
slotSchema.methods.isRaisingCourtAvailable = function() {
  return this.isActive && this.isRaisingCourt && this.raisingCourtBookings < this.raisingCourtCapacity;
};

module.exports = mongoose.model('Slot', slotSchema);
