// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Name is required'],
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     trim: true,
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     select: false,
//   },
//   role: {
//     type: String,
//     enum: ['student', 'admin'],
//     default: 'student',
//   },
//   studentId: {
//     type: String,
//     unique: true,
//     sparse: true,
//   },
//   course: String,
//   semester: Number,
//   profilePicture: {
//     type: String,
//     default: 'https://ui-avatars.com/api/?background=6366f1&color=fff',
//   },
//   isActive: {
//     type: Boolean,
//     default: true,
//   },
//   lastLogin: Date,
// }, {
//   timestamps: true,
// });

// // Fix the pre-save middleware
// userSchema.pre('save', function(next) {
//   // Use function() not arrow function to access 'this'
//   if (!this.isModified('password')) {
//     return next();
//   }

//   bcrypt.genSalt(12, (err, salt) => {
//     if (err) return next(err);

//     bcrypt.hash(this.password, salt, (err, hash) => {
//       if (err) return next(err);
//       this.password = hash;
//       next();
//     });
//   });
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// export default mongoose.model('User', userSchema);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    course: String,
    semester: Number,
    profilePicture: {
      type: String,
      default: "https://ui-avatars.com/api/?background=6366f1&color=fff",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  },
);

// Hash password before saving - Using async/await pattern (cleaner)
userSchema.pre("save", async function (next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) {
      return next();
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error("Error comparing password:", error);
    return false;
  }
};

export default mongoose.model("User", userSchema);
