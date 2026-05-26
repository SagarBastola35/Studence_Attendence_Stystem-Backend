// import express from "express";
// import {
//   protect,
//   adminOnly,
//   studentOnly,
// } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // Student routes
// router.get("/my-attendance", protect, studentOnly, async (req, res) => {
//   try {
//     res.json({
//       success: true,
//       data: {
//         attendance: [],
//         statistics: {
//           totalClasses: 0,
//           present: 0,
//           late: 0,
//           excused: 0,
//           absent: 0,
//           attendancePercentage: 0,
//         },
//         courseWiseStats: {},
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // Admin routes
// router.get("/summary", protect, adminOnly, async (req, res) => {
//   try {
//     const User = (await import("../models/User.js")).default;
//     const Course = (await import("../models/Course.js")).default;

//     const totalStudents = await User.countDocuments({ role: "student" });
//     const totalCourses = await Course.countDocuments({ isActive: true });

//     res.json({
//       success: true,
//       data: {
//         totalStudents,
//         totalCourses,
//         todayAttendance: 0,
//         monthlyAttendance: 0,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// router.post("/mark", protect, adminOnly, async (req, res) => {
//   try {
//     // Implementation for marking attendance
//     res.json({ success: true, message: "Attendance marked successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// router.get("/all", protect, adminOnly, async (req, res) => {
//   try {
//     const Attendance = (await import("../models/Attendance.js")).default;
//     const attendance = await Attendance.find()
//       .populate("student", "name studentId")
//       .populate("course", "courseName")
//       .sort({ date: -1 })
//       .limit(50);

//     res.json({ success: true, data: attendance });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// export default router;

import express from "express";
import {
  getMyAttendance,
  getAttendanceSummary,
} from "../controllers/attendanceController.js";
import {
  protect,
  adminOnly,
  studentOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-attendance", protect, studentOnly, getMyAttendance);
router.get("/summary", protect, adminOnly, getAttendanceSummary);
router.post("/mark", protect, adminOnly, (req, res) => {
  res.json({ success: true, message: "Attendance marked successfully" });
});
router.get("/all", protect, adminOnly, (req, res) => {
  res.json({ success: true, data: [] });
});

export default router;
