import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CartItemSchema = new mongoose.Schema({
  productId: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1,
    min: [1, 'Quantity must be at least 1'] 
  },
  platform: { 
    type: String, 
    enum: ['blinkit', 'zepto', 'swiggy', 'bigbasket', 'dunzo', null],
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  cart: {
    type: [CartItemSchema],
    default: []
  }
}, {
  timestamps: true,
  // Disable versioning to avoid conflicts
  versionKey: false
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to return user data without sensitive information
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Add timestamp to cart items when updated
UserSchema.pre('findOneAndUpdate', function(next) {
  // Check if cart is being updated
  if (this._update.$set && this._update.$set.cart) {
    // Add updatedAt timestamp to each cart item
    this._update.$set.cart.forEach(item => {
      item.updatedAt = new Date();
    });
  }
  
  if (this._update.$push && this._update.$push.cart) {
    // Add updatedAt timestamp to new cart item
    this._update.$push.cart.updatedAt = new Date();
  }
  
  next();
});

const User = mongoose.model("User", UserSchema);

export default User;