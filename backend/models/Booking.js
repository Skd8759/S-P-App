const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: [true, 'Slot is required']
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'confirmed'
  },
  isRaisingCourt: {
    type: Boolean,
    default: false
  },
  bookingType: {
    type: String,
    enum: ['swimming', 'raising-court'],
    default: 'swimming'
  },
  // Additional information
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot be more than 200 characters']
  },
  // Check-in/out tracking
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  },
  checkedOutAt: {
    type: Date
  },
  // Cancellation details
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  // QR code for check-in
  qrCode: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
bookingSchema.index({ user: 1, bookingDate: 1 });
bookingSchema.index({ slot: 1, bookingDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ qrCode: 1 });

// Virtual for booking duration
bookingSchema.virtual('duration').get(function() {
  if (this.checkedInAt && this.checkedOutAt) {
    return this.checkedOutAt - this.checkedInAt;
  }
  return null;
});

// Method to generate QR code
bookingSchema.methods.generateQRCode = function() {
  const qrData = {
    bookingId: this._id,
    userId: this.user,
    slotId: this.slot,
    timestamp: Date.now()
  };
  this.qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');
  return this.qrCode;
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const slotDate = new Date(this.bookingDate);
  const hoursUntilSlot = (slotDate - now) / (1000 * 60 * 60);
  
  // Can cancel up to 2 hours before the slot
  return hoursUntilSlot > 2 && this.status === 'confirmed';
};

// Pre-save middleware to generate QR code
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.qrCode) {
    this.generateQRCode();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
