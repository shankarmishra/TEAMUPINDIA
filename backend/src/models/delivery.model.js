const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryPartner: {
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    companyName: { type: String, required: true }
  },
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'Returned'],
    default: 'Pending'
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date
  },
  deliveryAttempts: [{
    attemptDate: Date,
    status: String,
    notes: String
  }],
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
deliverySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery; 