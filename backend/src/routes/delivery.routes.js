const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const deliveryController = require('../controllers/delivery.controller');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const validateDelivery = [
  body('order').isMongoId().withMessage('Valid order ID is required'),
  body('deliveryPartner').isObject().withMessage('Delivery partner details are required'),
  body('deliveryPartner.name').trim().notEmpty().withMessage('Partner name is required'),
  body('deliveryPartner.contactNumber').trim().notEmpty().withMessage('Partner contact number is required'),
  body('deliveryPartner.companyName').trim().notEmpty().withMessage('Partner company name is required'),
  body('trackingNumber').trim().notEmpty().withMessage('Tracking number is required'),
  body('expectedDeliveryDate').isISO8601().toDate().withMessage('Valid expected delivery date is required')
];

// Routes
router.post('/', 
  protect, 
  authorize(['admin']), 
  validateDelivery, 
  deliveryController.createDelivery
);

router.get('/', 
  protect, 
  authorize(['admin']), 
  deliveryController.getAllDeliveries
);

router.get('/order/:orderId', 
  protect, 
  deliveryController.getDeliveriesByOrder
);

router.get('/track/:trackingNumber', 
  deliveryController.trackDelivery
);

router.get('/:id', 
  protect, 
  deliveryController.getDeliveryById
);

router.patch('/:id/status', 
  protect, 
  authorize(['admin']),
  body('status').isIn(['Pending', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'Returned']).withMessage('Invalid status'),
  body('notes').optional().trim().notEmpty().withMessage('Notes cannot be empty if provided'),
  deliveryController.updateDeliveryStatus
);

module.exports = router; 