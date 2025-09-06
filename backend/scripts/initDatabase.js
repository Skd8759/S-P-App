const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Slot = require('../models/Slot');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nitk-swimming-pool');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@nitk.edu.in' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }

    // Create default admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@nitk.edu.in',
      password: 'admin123', // Change this in production
      role: 'admin',
      isEmailVerified: true,
      profile: {
        studentId: 'ADMIN001',
        department: 'Administration',
        phone: '9999999999'
      }
    });

    console.log('Default admin user created:', admin.email);
    return admin;
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

const createDefaultSlots = async () => {
  try {
    // Check if slots already exist for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingSlots = await Slot.find({ date: today });
    if (existingSlots.length > 0) {
      console.log('Slots for today already exist');
      return;
    }

    // Create slots for the next 7 days
    const defaultSlots = [
      { startTime: '05:00', endTime: '06:00', gender: 'male' },
      { startTime: '06:00', endTime: '07:00', gender: 'female' },
      { startTime: '07:00', endTime: '08:00', gender: 'male' },
      { startTime: '08:00', endTime: '09:00', gender: 'female' },
      { startTime: '16:00', endTime: '17:00', gender: 'male' },
      { startTime: '17:00', endTime: '19:00', gender: 'female' },
      { startTime: '19:00', endTime: '20:00', gender: 'male' }
    ];

    const slotsToCreate = [];
    
    for (let i = 0; i < 7; i++) {
      const slotDate = new Date(today);
      slotDate.setDate(slotDate.getDate() + i);
      
      for (const slotConfig of defaultSlots) {
        slotsToCreate.push({
          date: slotDate,
          startTime: slotConfig.startTime,
          endTime: slotConfig.endTime,
          gender: slotConfig.gender,
          maxCapacity: 40,
          isRaisingCourt: true,
          raisingCourtCapacity: 10,
          description: 'Regular swimming pool slot',
          isActive: true
        });
      }
    }

    const createdSlots = await Slot.insertMany(slotsToCreate);
    console.log(`Created ${createdSlots.length} slots for the next 7 days`);
  } catch (error) {
    console.error('Error creating default slots:', error);
  }
};

const initDatabase = async () => {
  try {
    await connectDB();
    
    console.log('Initializing database...');
    
    // Create default admin user
    await createDefaultAdmin();
    
    // Create default slots
    await createDefaultSlots();
    
    console.log('Database initialization completed successfully!');
    console.log('\nDefault Admin Credentials:');
    console.log('Email: admin@nitk.edu.in');
    console.log('Password: admin123');
    console.log('\nPlease change the admin password after first login!');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the initialization
initDatabase();
