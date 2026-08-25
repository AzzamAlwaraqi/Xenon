const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, 'src/config.env') });

const mongoose = require('mongoose');
const OTPModel = require('./src/Models/OTPModel');
const { verifyOtpCore } = require('./src/services/Core/otpCore');
const bcrypt = require('bcrypt');

async function test() {
  try {
    await mongoose.connect(process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD));
    console.log("Connected to DB");
    const otps = await OTPModel.find().sort({ createdAt: -1 }).limit(1);
    
    if (otps.length > 0) {
      const otp = otps[0];
      console.log(`Found OTP for ${otp.email}. Attempts: ${otp.attempts}`);
      
      // Let's manually trigger the verify logic with a dummy or real test!
      // But we don't know the plain text OTP. We can just look at the error being thrown.
      
      // Wait, is there any chance the OTP is already verified?
      console.log(`Verified At: ${otp.verifiedAt}`);
      
      // I'll test creating a new one and verifying it!
      const plainOtp = "123456";
      const hashedOtp = await bcrypt.hash(plainOtp, 8);
      
      await OTPModel.create({
          email: "test_verify@test.com",
          otp: hashedOtp,
          purpose: "registration",
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });
      
      console.log("Created test OTP. Now verifying...");
      
      await verifyOtpCore({
          email: "test_verify@test.com",
          otp: plainOtp,
          purpose: "registration"
      });
      
      console.log("Verification succeeded!");
    } else {
      console.log("No OTPs found");
    }
  } catch (err) {
    console.error("ERROR 💥", err);
  } finally {
    process.exit();
  }
}
test();
