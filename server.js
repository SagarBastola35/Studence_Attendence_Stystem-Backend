import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/attendance_system",
  )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// Simple User Schema with NO pre-save middleware issues
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "student" },
    studentId: String,
    course: String,
    semester: Number,
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true },
);

const courseSchema = new mongoose.Schema(
  {
    courseCode: String,
    courseName: String,
    credits: Number,
    instructor: String,
    department: String,
    semester: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    date: Date,
    status: String,
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sessionType: { type: String, default: "theory" },
    remarks: String,
  },
  { timestamps: true },
);

// NO pre-save middleware - we'll hash password manually in register route
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
const Course = mongoose.model("Course", courseSchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);

// Create admin if not exists
const createAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@attendance.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    await User.create({
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  }
};
await createAdmin();

// ============ REGISTER - Manual password hashing ============
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, studentId, course, semester, role } =
      req.body;
    console.log("Registering:", email);

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Hash password manually
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "student",
      studentId: role === "student" ? studentId : undefined,
      course: role === "student" ? course : undefined,
      semester: role === "student" ? semester : undefined,
      isActive: true,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "30d" },
    );

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      course: user.course,
      semester: user.semester,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ LOGIN ============
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      course: user.course,
      semester: user.semester,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ GET CURRENT USER ============
app.get("/api/auth/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    const user = await User.findById(decoded.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// ============ STUDENTS ============
app.get("/api/users/students", async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/users/students", async (req, res) => {
  try {
    console.log("Adding student:", req.body);

    const { name, email, password, studentId, course, semester } = req.body;

    // Validate required fields
    if (!name || !email || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Name, email and student ID are required",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check if student ID already exists
    const existingStudentId = await User.findOne({ studentId });
    if (existingStudentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID already exists",
      });
    }

    const hashedPassword = bcrypt.hashSync(password || "default123", 10);
    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      studentId,
      course: course || "BCA",
      semester: parseInt(semester) || 1,
      isActive: true,
    });

    const { password: _, ...studentData } = student.toObject();

    // Return with success flag
    res.status(201).json({
      success: true,
      message: "Student added successfully",
      student: studentData,
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add student",
    });
  }
});

app.put("/api/users/students/:id", async (req, res) => {
  try {
    const student = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, message: "Student updated", student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.delete("/api/users/students/:id", async (req, res) => {
  try {
    const student = await User.findByIdAndDelete(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ COURSES ============
app.get("/api/users/courses", async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

app.post("/api/users/courses", async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json(course);
});

app.put("/api/users/courses/:id", async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(course);
});

app.delete("/api/users/courses/:id", async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Deleted" });
});

// ============ ATTENDANCE ============
app.get("/api/attendance/summary", async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalCourses = await Course.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today },
    });

    res.json({
      totalStudents,
      totalCourses,
      todayAttendance,
      monthlyAttendance: todayAttendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/attendance/all", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const attendance = await Attendance.find()
      .populate("student", "name studentId")
      .populate("course", "courseName courseCode")
      .sort({ date: -1 })
      .limit(limit);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/attendance/my-attendance", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    const attendance = await Attendance.find({ student: decoded.id }).populate(
      "course",
    );

    const total = attendance.length;
    const present = attendance.filter((a) => a.status === "present").length;
    const late = attendance.filter((a) => a.status === "late").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    const percentage =
      total > 0 ? (((present + late) / total) * 100).toFixed(2) : 0;

    res.json({
      attendance,
      statistics: {
        totalClasses: total,
        present,
        late,
        excused: 0,
        absent,
        attendancePercentage: percentage,
      },
      courseWiseStats: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/attendance/mark", async (req, res) => {
  try {
    console.log("Marking attendance:", req.body);

    const { studentId, courseCode, date, status, sessionType, remarks } =
      req.body;

    const student = await User.findOne({ studentId, role: "student" });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const course = await Course.findOne({ courseCode });
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      student: student._id,
      course: course._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Attendance already marked for this date",
        });
    }

    const admin = await User.findOne({ role: "admin" });
    const attendance = await Attendance.create({
      student: student._id,
      course: course._id,
      date: new Date(date),
      status,
      markedBy: admin ? admin._id : student._id,
      sessionType: sessionType || "theory",
      remarks: remarks || "",
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Attendance marked successfully",
        attendance,
      });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark attendance" });
  }
});

app.post("/api/attendance/bulk-mark", async (req, res) => {
  try {
    const { students, courseCode, date, status } = req.body;
    const course = await Course.findOne({ courseCode });
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const admin = await User.findOne({ role: "admin" });
    const records = [];

    for (const s of students) {
      const student = await User.findOne({
        studentId: s.studentId,
        role: "student",
      });
      if (student) {
        records.push({
          student: student._id,
          course: course._id,
          date: new Date(date),
          status: s.status || status,
          markedBy: admin ? admin._id : student._id,
        });
      }
    }

    if (records.length > 0) {
      await Attendance.insertMany(records);
    }

    res.json({
      success: true,
      message: `${records.length} attendance records marked`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to mark bulk attendance" });
  }
});

app.put("/api/attendance/:id", async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!attendance) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance not found" });
    }
    res.json({ success: true, message: "Attendance updated", attendance });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update attendance" });
  }
});

// ============ HEALTH ============
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server running",
    timestamp: new Date().toISOString(),
  });
});

// ============ START ============
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`========================================`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(
    `\n✅ ADMIN: ${process.env.ADMIN_EMAIL || "admin@attendance.com"} / ${process.env.ADMIN_PASSWORD || "admin123"}`,
  );
  console.log(`========================================\n`);
});
