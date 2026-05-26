import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    sessionType: {
      type: String,
      enum: ["theory", "practical", "online", "lab"],
      default: "theory",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate attendance for same student, course, and date
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

// Virtual for attendance percentage
attendanceSchema.virtual("attendancePercentage").get(function () {
  // This would need aggregation query
  return 0;
});

export default mongoose.model("Attendance", attendanceSchema);
