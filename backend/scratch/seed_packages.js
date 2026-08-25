const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../src/config.env') });

const UserModel = require('../src/Models/UserModel');
const VendorModel = require('../src/Models/VendorModel');
const PackageModel = require('../src/Models/PackageModel');
const PackageDetailsModel = require('../src/Models/packageDetailsModels');
const BookingModel = require('../src/Models/BookingModel');
const ReviewModel = require('../src/Models/ReviewModel');
const bcrypt = require('bcrypt');

// Helper to generate random dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedData() {
  try {
    const dbUri = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');

    // Create a dummy user
    let user = await UserModel.findOne({ email: 'seeduser@example.com' });
    if (!user) {
      console.log('Creating seed user...');
      user = await UserModel.create({
        name: 'Seed User',
        email: 'seeduser@example.com',
        password: 'password123',
        mobileNumber: '1234567890',
        role: 'user',
        gender: 'male',
        DateOfBirth: new Date('1990-01-01'),
        isEmailVerified: true,
        isActive: true
      });
    }

    // Create a dummy vendor owner
    let vendorOwner = await UserModel.findOne({ email: 'vendorowner@example.com' });
    if (!vendorOwner) {
      console.log('Creating vendor owner...');
      vendorOwner = await UserModel.create({
        name: 'Vendor Owner',
        email: 'vendorowner@example.com',
        password: 'password123',
        mobileNumber: '0987654321',
        role: 'vendor',
        isEmailVerified: true,
        isActive: true
      });
    }

    // Create a dummy vendor
    let vendor = await VendorModel.findOne({ vendor_owner_id: vendorOwner._id });
    if (!vendor) {
      console.log('Creating seed vendor...');
      vendor = await VendorModel.create({
        vendor_address: '123 Main St',
        vendor_city: 'Cairo',
        vendor_state: 'Cairo',
        vendor_pincode: '12345',
        vendor_country: 'Egypt',
        vendor_status: 'active',
        vendor_type: 'Travel Agency',
        vendor_owner_id: vendorOwner._id,
        vendor_email: 'seedvendor' + Math.floor(Math.random() * 1000) + '@example.com',
        vendor_mobileNumber: '12345678' + Math.floor(Math.random() * 99)
      });
    }

    console.log('Generating 30 packages...');
    const destinations = ['Cairo', 'Dubai', 'Paris', 'Bali', 'Rome', 'Istanbul', 'London', 'Tokyo', 'New York', 'Maldives'];
    const types = ['adventure', 'cultural', 'relaxation', 'historical', 'family'];
    const accommodationTypes = ['5-Star Hotel', 'Resort', 'Villa', 'Boutique Hotel', 'Camp'];

    for (let i = 1; i <= 30; i++) {
      const dest = destinations[Math.floor(Math.random() * destinations.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const acc = accommodationTypes[Math.floor(Math.random() * accommodationTypes.length)];
      
      const startDate = randomDate(new Date(), new Date(2027, 0, 1));
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 10) + 3);

      const pkg = await PackageModel.create({
        vendor_id: vendor._id,
        package_name: `Amazing ${type.charAt(0).toUpperCase() + type.slice(1)} trip to ${dest}`,
        package_description: `Experience the best of ${dest} with our exclusive ${type} package.`,
        package_price: Math.floor(Math.random() * 5000) + 500,
        startDate: startDate,
        endDate: endDate,
        images: [{ url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1', public_id: 'sample_id' }],
        tags: [dest, type, 'holiday'],
        package_type: type,
        package_status: 'active',
        max_people: Math.floor(Math.random() * 20) + 5,
        ratingsAverage: (Math.random() * 2 + 3).toFixed(1), // Random between 3.0 and 5.0
        ratingsQuantity: Math.floor(Math.random() * 100) + 5
      });

      // Package Details
      await PackageDetailsModel.create({
        package_id: pkg._id,
        itinerary: [
          { day_number: 1, title: 'Arrival', activities: `Arrive in ${dest} and check in to the ${acc}.` },
          { day_number: 2, title: 'Exploration', activities: `Guided tour of the city and local attractions.` },
          { day_number: 3, title: 'Departure', activities: `Checkout and transfer to the airport.` }
        ],
        included_services: [
          { title: 'Accommodation', description: `Stay at a beautiful ${acc}` },
          { title: 'Transportation', description: 'Airport transfers and local travel' }
        ],
        excluded_services: [
          { title: 'Flights', description: 'International flights not included' }
        ],
        meeting_point: `${dest} International Airport`,
        location_coordinates: { lat: 30.0444, lng: 31.2357 }
      });

      // Create a dummy booking for the user to be able to leave a review
      const booking = await BookingModel.create({
        user_id: user._id,
        vendor_id: vendor._id,
        package_id: pkg._id,
        booking_date: startDate,
        number_of_people: 2,
        creator_role: 'user',
        booked_by: user._id,
        status: 'completed',
        total_price: pkg.package_price * 2
      });

      // Add a dummy review
      await ReviewModel.create({
        user_id: user._id,
        vendor_id: vendor._id,
        package_id: pkg._id,
        booking_id: booking._id,
        review_text: `Absolutely loved this ${type} trip to ${dest}! Highly recommended.`,
        review_rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
        review_status: 'accepted'
      });
    }

    console.log('✅ Successfully seeded 30 packages with details, bookings, and reviews!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();
