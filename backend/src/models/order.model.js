const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Order must belong to a user']
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    }
  }],
  shippingAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required']
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cod'],
    default: 'cod'
  },
  paymentResult: {
    id: String,
    status: String,
    updateTime: String,
    emailAddress: String
  },
  itemsPrice: {
    type: Number,
    required: [true, 'Items price is required'],
    min: [0, 'Items price cannot be negative']
  },
  shippingPrice: {
    type: Number,
    required: [true, 'Shipping price is required'],
    min: [0, 'Shipping price cannot be negative']
  },
  taxPrice: {
    type: Number,
    required: [true, 'Tax price is required'],
    min: [0, 'Tax price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  status: {
    type: String,
    required: [true, 'Order status is required'],
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryInfo: {
    pickedUpAt: Date,
    deliveredAt: Date,
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'in_transit', 'delivered', 'failed'],
      default: 'pending'
    },
    notes: String
  },
  cancelReason: {
    type: String,
    enum: ['customer_request', 'payment_failed', 'out_of_stock', 'delivery_failed', 'other']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryAssigned: 1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ 'deliveryInfo.currentLocation': '2dsphere' });

// Virtual for order duration
orderSchema.virtual('duration').get(function() {
  if (!this.deliveryInfo.deliveredAt) return null;
  return Math.round((this.deliveryInfo.deliveredAt - this.createdAt) / (1000 * 60 * 60)); // Duration in hours
});

// Pre-save middleware to calculate total price
orderSchema.pre('save', function(next) {
  if (!this.isModified('items') && !this.isModified('shippingPrice') && !this.isModified('taxPrice')) {
    return next();
  }

  // Calculate items price
  this.itemsPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Calculate total price
  this.totalPrice = this.itemsPrice + this.shippingPrice + this.taxPrice;

  next();
});

module.exports = mongoose.model('Order', orderSchema); 