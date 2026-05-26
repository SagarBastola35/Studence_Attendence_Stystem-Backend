// import Attendance from "../models/Attendance.js";
// import User from "../models/User.js";
// import Course from "../models/Course.js";
// import mongoose from "mongoose";

// // Admin: Mark attendance
// export const markAttendance = async (req, res) => {
//   try {
//     const { studentId, courseCode, date, status, sessionType, remarks } =
//       req.body;

//     const student = await User.findOne({ studentId, role: "student" });
//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     const course = await Course.findOne({ courseCode });
//     if (!course) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     const attendanceDate = new Date(date);
//     attendanceDate.setHours(0, 0, 0, 0);

//     const existingAttendance = await Attendance.findOne({
//       student: student._id,
//       course: course._id,
//       date: {
//         $gte: attendanceDate,
//         $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
//       },
//     });

//     if (existingAttendance) {
//       return res
//         .status(400)
//         .json({
//           message: "Attendance already marked for this student on this date",
//         });
//     }

//     const attendance = await Attendance.create({
//       student: student._id,
//       course: course._id,
//       date: attendanceDate,
//       status,
//       markedBy: req.user._id,
//       sessionType: sessionType || "theory",
//       remarks,
//     });

//     res.status(201).json({
//       message: "Attendance marked successfully",
//       attendance: {
//         student: student.name,
//         studentId: student.studentId,
//         course: course.courseName,
//         date: attendance.date,
//         status: attendance.status,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Admin: Bulk mark attendance
// export const bulkMarkAttendance = async (req, res) => {
//   try {
//     const { students, courseCode, date, status, sessionType } = req.body;

//     const course = await Course.findOne({ courseCode });
//     if (!course) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     const attendanceDate = new Date(date);
//     attendanceDate.setHours(0, 0, 0, 0);

//     const attendancePromises = students.map(async (studentData) => {
//       const student = await User.findOne({
//         studentId: studentData.studentId,
//         role: "student",
//       });
//       if (!student) return null;

//       const existing = await Attendance.findOne({
//         student: student._id,
//         course: course._id,
//         date: attendanceDate,
//       });

//       if (existing) return null;

//       return Attendance.create({
//         student: student._id,
//         course: course._id,
//         date: attendanceDate,
//         status: studentData.status || status,
//         markedBy: req.user._id,
//         sessionType: sessionType || "theory",
//       });
//     });

//     const results = await Promise.all(attendancePromises);
//     const successful = results.filter((r) => r !== null);

//     res.json({
//       message: `Bulk attendance marked successfully. ${successful.length} records created.`,
//       count: successful.length,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Student: View their attendance
// export const getMyAttendance = async (req, res) => {
//   try {
//     const { courseId, startDate, endDate } = req.query;

//     let query = { student: req.user._id };

//     if (courseId) {
//       query.course = courseId;
//     }

//     if (startDate && endDate) {
//       query.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//     }

//     const attendance = await Attendance.find(query)
//       .populate("course", "courseCode courseName credits")
//       .sort({ date: -1 });

//     // Calculate statistics
//     const totalClasses = attendance.length;
//     const presentCount = attendance.filter(
//       (a) => a.status === "present",
//     ).length;
//     const lateCount = attendance.filter((a) => a.status === "late").length;
//     const excusedCount = attendance.filter(
//       (a) => a.status === "excused",
//     ).length;
//     const absentCount = attendance.filter((a) => a.status === "absent").length;

//     const attendancePercentage =
//       totalClasses > 0
//         ? (
//             ((presentCount + lateCount + excusedCount) / totalClasses) *
//             100
//           ).toFixed(2)
//         : 0;

//     // Group by course
//     const courseWiseStats = {};
//     attendance.forEach((record) => {
//       const courseName = record.course.courseName;
//       if (!courseWiseStats[courseName]) {
//         courseWiseStats[courseName] = {
//           total: 0,
//           present: 0,
//           late: 0,
//           excused: 0,
//           absent: 0,
//         };
//       }
//       courseWiseStats[courseName].total++;
//       courseWiseStats[courseName][record.status]++;
//     });

//     res.json({
//       attendance,
//       statistics: {
//         totalClasses,
//         present: presentCount,
//         late: lateCount,
//         excused: excusedCount,
//         absent: absentCount,
//         attendancePercentage,
//       },
//       courseWiseStats,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Admin: Get all attendance records
// export const getAllAttendance = async (req, res) => {
//   try {
//     const { studentId, courseCode, startDate, endDate } = req.query;

//     let query = {};

//     if (studentId) {
//       const student = await User.findOne({ studentId });
//       if (student) query.student = student._id;
//     }

//     if (courseCode) {
//       const course = await Course.findOne({ courseCode });
//       if (course) query.course = course._id;
//     }

//     if (startDate && endDate) {
//       query.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//     }

//     const attendance = await Attendance.find(query)
//       .populate("student", "name studentId email course semester")
//       .populate("course", "courseCode courseName")
//       .populate("markedBy", "name")
//       .sort({ date: -1 });

//     res.json(attendance);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Admin: Update attendance
// export const updateAttendance = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, remarks } = req.body;

//     const attendance = await Attendance.findById(id);
//     if (!attendance) {
//       return res.status(404).json({ message: "Attendance record not found" });
//     }

//     attendance.status = status || attendance.status;
//     attendance.remarks = remarks || attendance.remarks;
//     await attendance.save();

//     res.json({ message: "Attendance updated successfully", attendance });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Get attendance summary for dashboard
// export const getAttendanceSummary = async (req, res) => {
//   try {
//     const totalStudents = await User.countDocuments({
//       role: "student",
//       isActive: true,
//     });
//     const totalCourses = await Course.countDocuments({ isActive: true });
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const todayAttendance = await Attendance.countDocuments({
//       date: { $gte: today, $lt: tomorrow },
//     });

//     const thisMonth = new Date();
//     thisMonth.setDate(1);
//     const monthlyAttendance = await Attendance.countDocuments({
//       date: { $gte: thisMonth },
//     });

//     res.json({
//       totalStudents,
//       totalCourses,
//       todayAttendance,
//       monthlyAttendance,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Course from "../models/Course.js";

export const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.user._id })
      .populate("course", "courseCode courseName")
      .sort({ date: -1 });

    const totalClasses = attendance.length;
    const presentCount = attendance.filter(
      (a) => a.status === "present",
    ).length;
    const lateCount = attendance.filter((a) => a.status === "late").length;
    const excusedCount = attendance.filter(
      (a) => a.status === "excused",
    ).length;
    const absentCount = attendance.filter((a) => a.status === "absent").length;

    const attendancePercentage =
      totalClasses > 0
        ? (
            ((presentCount + lateCount + excusedCount) / totalClasses) *
            100
          ).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: {
        attendance,
        statistics: {
          totalClasses,
          present: presentCount,
          late: lateCount,
          excused: excusedCount,
          absent: absentCount,
          attendancePercentage,
        },
        courseWiseStats: {},
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAttendanceSummary = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalCourses = await Course.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        todayAttendance: 0,
        monthlyAttendance: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
