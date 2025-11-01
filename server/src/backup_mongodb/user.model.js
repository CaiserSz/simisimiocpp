import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/config.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true,
    match: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/
  },
  role: {
    type: String,
    enum: ['admin', 'operator', 'customer', 'guest'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  idTag: {
    type: String,
    unique: true,
    sparse: true
  },
  company: {
    name: String,
    vatNumber: String,
    address: {
      street: String,
      city: String,
      country: String,
      postalCode: String
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'tr']
    },
    currency: {
      type: String,
      default: 'TRY',
      enum: ['TRY', 'USD', 'EUR', 'GBP']
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  permissions: [{
    type: String,
    enum: [
      'stations:read',
      'stations:write',
      'transactions:read',
      'transactions:write',
      'users:read',
      'users:write',
      'settings:read',
      'settings:write'
    ]
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ idTag: 1 }, { unique: true, sparse: true });
userSchema.index({ 'preferences.language': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
});

// Virtual for user's active transactions
userSchema.virtual('activeTransactions', {
  ref: 'Transaction',
  localField: 'idTag',
  foreignField: 'idTag',
  match: { status: 'active' },
  options: { sort: { startTimestamp: -1 } }
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save hook to generate ID tag if not provided
userSchema.pre('save', function(next) {
  if (!this.idTag) {
    // Generate a random 20-character alphanumeric ID tag
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let idTag = '';
    for (let i = 0; i < 20; i++) {
      idTag += chars[Math.floor(Math.random() * chars.length)];
    }
    this.idTag = idTag;
  }
  next();
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    permissions: this.permissions || []
  };
  
  return jwt.sign(payload, config.security.jwtSecret, {
    expiresIn: config.security.jwtExpiresIn || '1d'
  });
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new Error('Invalid login credentials');
  }
  
  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }
  
  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  
  return user;
};

// Static method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Set expire to 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Method to check if user has required permission
userSchema.methods.hasPermission = function(permission) {
  // Admin has all permissions
  if (this.role === 'admin') return true;
  
  // Check if user has the specific permission
  return this.permissions && this.permissions.includes(permission);
};

// Method to check if user has any of the required permissions
userSchema.methods.hasAnyPermission = function(permissions) {
  // Admin has all permissions
  if (this.role === 'admin') return true;
  
  // Check if user has any of the required permissions
  return this.permissions && this.permissions.some(permission => 
    permissions.includes(permission)
  );
};

const User = mongoose.model('User', userSchema);

export default User;
