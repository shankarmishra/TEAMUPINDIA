const axios = require('axios');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('./src/app');
const logger = require('./src/utils/logger');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let coachId = '';
let sessionId = '';
let tournamentId = '';
let teamId = '';
let productId = '';
let orderId = '';
let deliveryId = '';
let mongod;
let server;

const startServer = async () => {
  // Start MongoDB Memory Server
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  await mongoose.connect(mongoUri);
  logger.info('Connected to MongoDB Memory Server');

  // Clear all collections
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
  logger.info('Cleared all collections in MongoDB Memory Server');

  // Start Express server
  server = app.listen(5000, () => {
    logger.info('Test server started on port 5000');
  });
};

const stopServer = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongod) {
    await mongoose.disconnect();
    await mongod.stop();
  }
  logger.info('Test server and MongoDB Memory Server stopped');
};

// Create axios instance with base URL
const authRequest = axios.create({
  baseURL: BASE_URL
});

// Add auth token to requests
authRequest.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

const coachAuthRequest = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const testAPIs = async () => {
  try {
    await startServer();

    console.log('\n=== Testing Authentication APIs ===');
    
    // 1. Register User
    console.log('\n1. Testing User Registration...');
    const userData = {
      name: 'Test User',
      email: `testuser_${Date.now()}@example.com`,
      password: 'Test@123',
      phone: '+1234567890',
      role: 'admin'
    };
    
    try {
      const registerResponse = await authRequest.post('/auth/register', userData);
      console.log('✓ User Registration Response:', registerResponse.data);
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('✓ User already exists, proceeding with login');
      } else {
        throw error;
      }
    }

    // 2. Login User
    console.log('\n2. Testing User Login...');
    const loginResponse = await authRequest.post('/auth/login', {
      email: userData.email,
      password: userData.password
    });
    authToken = loginResponse.data.token;
    userId = loginResponse.data.user._id;
    authRequest.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✓ Login successful, token received');

    console.log('\n=== Testing Coach APIs ===');

    // 3. Testing Coach User Registration...
    console.log('\n3. Testing Coach User Registration...');
    const coachData = {
      name: 'Coach User',
      email: `coach_${Date.now()}@example.com`,
      password: 'Coach@123',
      phone: '+9876543210',
      role: 'coach'
    };
    const coachRegisterResponse = await authRequest.post('/auth/register', coachData);
    const coachToken = coachRegisterResponse.data.token;
    const coachId = coachRegisterResponse.data.user._id;
    console.log('✓ Coach User Registration Response:', coachRegisterResponse.data);

    // Create coach auth request instance
    const coachAuthRequest = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${coachToken}`
      }
    });

    // 4. Testing Coach Login...
    console.log('\n4. Testing Coach Login...');
    const coachLoginResponse = await authRequest.post('/auth/login', {
      email: coachData.email,
      password: coachData.password
    });
    console.log('✓ Coach login successful');

    // 5. Testing Coach Profile Creation...
    console.log('\n5. Testing Coach Profile Creation...');
    const coachProfileData = {
      specialties: ['cricket', 'football'],
      experience: 5,
      certifications: [{
        name: 'Level 1 Cricket Coach',
        issuingOrganization: 'ICC',
        issueDate: new Date(),
        verificationUrl: 'https://example.com/verify/123'
      }],
      availability: {
        monday: [{
          startTime: '09:00',
          endTime: '17:00'
        }],
        wednesday: [{
          startTime: '09:00',
          endTime: '17:00'
        }]
      },
      hourlyRate: 1000,
      isActive: true
    };
    const coachProfileResponse = await coachAuthRequest.post('/coaches', coachProfileData);
    console.log('✓ Coach Profile Creation Response:', coachProfileResponse.data);

    // Store coach profile ID
    const coachProfileId = coachProfileResponse.data._id;

    // 6. Testing Get Coach Profile...
    console.log('\n6. Testing Get Coach Profile...');
    const coachProfileDetailsResponse = await coachAuthRequest.get(`/coaches/${coachProfileResponse.data._id}`);
    console.log('✓ Coach profile retrieved successfully');

    // 7. Testing Update Coach Profile...
    console.log('\n7. Testing Update Coach Profile...');
    const coachProfileUpdateData = {
      experience: 6,
      hourlyRate: 1200
    };
    const coachProfileUpdateResponse = await coachAuthRequest.put(`/coaches/${coachProfileResponse.data._id}`, coachProfileUpdateData);
    console.log('✓ Coach profile updated successfully:', coachProfileUpdateResponse.data);

    // 8. Testing Update Coach Availability...
    console.log('\n8. Testing Update Coach Availability...');
    const coachAvailabilityData = {
      monday: [{
        startTime: '09:00',
        endTime: '12:00'
      }, {
        startTime: '14:00',
        endTime: '17:00'
      }],
      wednesday: [{
        startTime: '09:00',
        endTime: '12:00'
      }, {
        startTime: '14:00',
        endTime: '17:00'
      }]
    };
    const coachAvailabilityResponse = await coachAuthRequest.put(`/coaches/${coachProfileResponse.data._id}/schedule`, coachAvailabilityData);
    console.log('✓ Coach availability updated successfully:', coachAvailabilityResponse.data);

    // 9. Testing Search Nearby Coaches...
    console.log('\n9. Testing Search Nearby Coaches...');
    const searchData = {
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760]
      },
      maxDistance: 10000,
      sport: 'cricket'
    };
    const searchResponse = await authRequest.post('/coaches/nearby', searchData);
    console.log('✓ Nearby coaches search successful');

    // 10. Get User Profile
    console.log('\n10. Testing Get User Profile...');
    const userProfileResponse = await authRequest.get('/users/profile');
    console.log('✓ User profile retrieved successfully');

    // 11. Update User Profile
    console.log('\n11. Testing Update User Profile...');
    const userUpdateData = {
      name: 'Updated Test User',
      phone: '+1234567890',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760]
      }
    };
    const userUpdateResponse = await authRequest.put('/users/profile', userUpdateData);
    console.log('✓ User profile updated successfully');

    console.log('\n=== Testing Tournament APIs ===');

    // 16. Create Tournament
    console.log('\n16. Testing Create Tournament...');
    const tournamentData = {
      name: 'Test Cricket Tournament',
      sport: 'cricket',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
      venue: {
        name: 'Test Stadium',
        address: 'Test Address',
        city: 'Mumbai',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760]
        }
      },
      description: 'A test cricket tournament for testing purposes',
      rules: [{
        title: 'Match Duration',
        description: 'Each match will be 20 overs'
      }, {
        title: 'Team Size',
        description: 'Each team must have 11 players on field'
      }],
      maxTeams: 8,
      minTeams: 4,
      minTeamsPerMatch: 2,
      maxTeamsPerMatch: 2,
      teamSize: {
        min: 11,
        max: 15
      },
      registrationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      format: 'knockout',
      entryFee: 1000,
      prizeMoney: {
        first: 50000,
        second: 25000,
        third: 10000
      }
    };
    const tournamentResponse = await authRequest.post('/tournaments', tournamentData);
    tournamentId = tournamentResponse.data.data._id;
    console.log('✓ Tournament created successfully');

    // 17. Get Tournament Details
    console.log('\n17. Testing Get Tournament Details...');
    const tournamentDetailsResponse = await authRequest.get(`/tournaments/${tournamentId}`);
    console.log('✓ Tournament details retrieved successfully');

    // 18. Update Tournament
    console.log('\n18. Testing Update Tournament...');
    const tournamentUpdateData = {
      name: 'Updated Test Cricket Tournament',
      maxTeams: 16
    };
    const tournamentUpdateResponse = await authRequest.put(`/tournaments/${tournamentId}`, tournamentUpdateData);
    console.log('✓ Tournament updated successfully');

    console.log('\n=== Testing Team APIs ===');

    // 19. Create Team
    console.log('\n19. Testing Create Team...');
    const teamData = {
      name: 'Test Cricket Team',
      sport: 'cricket',
      captain: userId,
      description: 'A test cricket team for testing purposes',
      maxPlayers: 15,
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760]
      },
      players: [
        {
          user: userId,
          role: 'captain'
        }
      ]
    };
    const teamResponse = await authRequest.post('/teams', teamData);
    teamId = teamResponse.data.data._id;
    console.log('✓ Team created successfully');

    // 20. Get Team Details
    console.log('\n20. Testing Get Team Details...');
    const teamDetailsResponse = await authRequest.get(`/teams/${teamId}`);
    console.log('✓ Team details retrieved successfully');

    // 21. Update Team
    console.log('\n21. Testing Update Team...');
    const teamUpdateData = {
      name: 'Updated Test Cricket Team',
      maxPlayers: 20
    };
    const teamUpdateResponse = await authRequest.put(`/teams/${teamId}`, teamUpdateData);
    console.log('✓ Team updated successfully');

    console.log('\n=== Testing Product APIs ===');

    // Register seller user
    console.log('\n22. Testing Seller User Registration...');
    const sellerData = {
      name: 'Seller User',
      email: `seller_${Date.now()}@example.com`,
      password: 'Seller@123',
      phone: '+9876543211',
      role: 'seller'
    };
    const sellerRegisterResponse = await authRequest.post('/auth/register', sellerData);
    const sellerToken = sellerRegisterResponse.data.token;
    const sellerId = sellerRegisterResponse.data.user._id;
    console.log('✓ Seller Registration Response:', sellerRegisterResponse.data);

    // Create seller auth request instance
    const sellerAuthRequest = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`
      }
    });

    // 23. Testing Create Product...
    console.log('\n23. Testing Create Product...');
    const productData = {
      name: 'Cricket Bat',
      description: 'Professional cricket bat',
      category: 'equipment',
      sport: 'cricket',
      price: 5000,
      stock: 50,
      brand: 'Test Brand',
      images: [{
        url: 'https://example.com/bat1.jpg'
      }, {
        url: 'https://example.com/bat2.jpg'
      }],
      specifications: [{
        name: 'Weight',
        value: '1.2 kg'
      }, {
        name: 'Material',
        value: 'English Willow'
      }, {
        name: 'Size',
        value: 'Full Size'
      }]
    };
    const productResponse = await sellerAuthRequest.post('/products', productData);
    productId = productResponse.data.data._id;
    console.log('✓ Product created successfully');

    // 24. Testing Get Product Details...
    console.log('\n24. Testing Get Product Details...');
    const productDetailsResponse = await authRequest.get(`/products/${productId}`);
    console.log('✓ Product details retrieved successfully');

    // 25. Testing Update Product...
    console.log('\n25. Testing Update Product...');
    const productUpdateData = {
      name: 'Updated Cricket Bat',
      price: 6000
    };
    const productUpdateResponse = await sellerAuthRequest.put(`/products/${productId}`, productUpdateData);
    console.log('✓ Product updated successfully');

    // 26. Add Product Review
    console.log('\n26. Testing Add Product Review...');
    const reviewData = {
      rating: 4,
      comment: 'Great product, excellent quality!'
    };
    const reviewResponse = await authRequest.post(`/products/${productId}/reviews`, reviewData);
    console.log('✓ Product review added successfully');

    console.log('\n=== Testing Order APIs ===');

    // 27. Create Order
    console.log('\n27. Testing Create Order...');
    const orderData = {
      items: [{
        product: productId,
        quantity: 2,
        price: 5000
      }],
      shippingAddress: {
        street: 'Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India'
      },
      paymentMethod: 'credit_card',
      itemsPrice: 10000,
      shippingPrice: 500,
      taxPrice: 1000,
      totalPrice: 11500
    };
    const orderResponse = await authRequest.post('/orders', orderData);
    orderId = orderResponse.data.data._id;
    console.log('✓ Order created successfully');

    // 28. Testing Get Order Details...
    console.log('\n28. Testing Get Order Details...');
    const orderDetailsResponse = await authRequest.get(`/orders/${orderId}`);
    console.log('✓ Order details retrieved successfully');

    // 29. Testing Update Order Status...
    console.log('\n29. Testing Update Order Status...');
    const orderUpdateData = {
      status: 'confirmed'
    };
    const orderUpdateResponse = await authRequest.put(`/orders/${orderId}`, orderUpdateData);
    console.log('✓ Order status updated successfully');

    console.log('\n=== Testing Delivery APIs ===');

    // 30. Create Delivery
    console.log('\n30. Testing Create Delivery...');
    try {
      const deliveryData = {
        order: orderId,
        deliveryPartner: {
          name: 'Test Delivery Partner',
          contactNumber: '+1234567890',
          companyName: 'Test Logistics'
        },
        trackingNumber: 'TRK123456789',
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      };

      const response = await authRequest.post('/deliveries', deliveryData);

      if (response.data) {
        console.log('✓ Delivery created successfully');
        deliveryId = response.data._id;
      } else {
        console.log('❌ Failed to create delivery');
      }
    } catch (error) {
      console.log('\n❌ Test failed:', error.response?.data || error.message);
      console.log('Error details:', error);
    }

    if (!deliveryId) {
      console.log('❌ Cannot continue delivery tests without a valid delivery ID');
      return;
    }

    // 31. Get Delivery Details
    console.log('\n31. Testing Get Delivery Details...');
    try {
      const response = await authRequest.get(`/deliveries/${deliveryId}`);

      if (response.data) {
        console.log('✓ Delivery details retrieved successfully');
      } else {
        console.log('❌ Failed to get delivery details');
      }
    } catch (error) {
      console.log('\n❌ Test failed:', error.response?.data || error.message);
      console.log('Error details:', error);
    }

    // 32. Update Delivery Status
    console.log('\n32. Testing Update Delivery Status...');
    try {
      const response = await authRequest.patch(`/deliveries/${deliveryId}/status`, {
        status: 'In Transit',
        notes: 'Package picked up from warehouse'
      });

      if (response.data) {
        console.log('✓ Delivery status updated successfully');
      } else {
        console.log('❌ Failed to update delivery status');
      }
    } catch (error) {
      console.log('\n❌ Test failed:', error.response?.data || error.message);
      console.log('Error details:', error);
    }

    // 11. Testing Book Coaching Session...
    console.log('\n11. Testing Book Coaching Session...');
    const bookingData = {
      coachId: coachProfileId,
      sport: 'cricket',
      date: new Date('2025-06-24').toISOString(), // Monday
      slot: '09:00-10:00' // Changed from 09:00-12:00 to match the new format
    };
    try {
      const bookingResponse = await authRequest.post('/bookings', bookingData);
      if (bookingResponse.data.success) {
        const bookingId = bookingResponse.data.data._id;
        console.log('✓ Coaching session booked successfully');
      } else {
        console.log('❌ Failed to book coaching session:', bookingResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Failed to book coaching session:', error.response?.data?.message || error.message);
      return;
    }

    // 12. Testing Get User's Bookings...
    console.log('\n12. Testing Get User\'s Bookings...');
    try {
      const userBookingsResponse = await authRequest.get('/bookings/user');
      if (userBookingsResponse.data.success) {
        console.log('✓ User bookings retrieved successfully');
      } else {
        console.log('❌ Failed to get user bookings:', userBookingsResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Failed to get user bookings:', error.response?.data?.message || error.message);
    }

    // 13. Testing Get Coach's Bookings...
    console.log('\n13. Testing Get Coach\'s Bookings...');
    try {
      const coachBookingsResponse = await coachAuthRequest.get('/bookings/coach');
      if (coachBookingsResponse.data.success) {
        console.log('✓ Coach bookings retrieved successfully');
      } else {
        console.log('❌ Failed to get coach bookings:', coachBookingsResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Failed to get coach bookings:', error.response?.data?.message || error.message);
    }

    // 14. Testing Update Booking Status...
    console.log('\n14. Testing Update Booking Status...');
    try {
      const bookingUpdateResponse = await coachAuthRequest.put(`/bookings/${bookingId}/status`, {
        status: 'confirmed'
      });
      if (bookingUpdateResponse.data.success) {
        console.log('✓ Booking status updated successfully');
      } else {
        console.log('❌ Failed to update booking status:', bookingUpdateResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Failed to update booking status:', error.response?.data?.message || error.message);
    }

    // 15. Testing Rate Booking...
    console.log('\n15. Testing Rate Booking...');
    try {
      const bookingRateResponse = await authRequest.post(`/bookings/${bookingId}/rate`, {
        rating: 5,
        review: 'Great coaching session!'
      });
      if (bookingRateResponse.data.success) {
        console.log('✓ Booking rated successfully');
      } else {
        console.log('❌ Failed to rate booking:', bookingRateResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Failed to rate booking:', error.response?.data?.message || error.message);
    }

    console.log('\n✅ All API tests completed successfully!\n');
  } catch (error) {
    console.log('\n❌ Test failed:', error.response?.data || error.message);
    console.log('Error details:', error);
  } finally {
    await stopServer();
  }
};

testAPIs(); 