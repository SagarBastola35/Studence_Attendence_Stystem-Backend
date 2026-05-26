// import User from "../models/User.js";
// import Course from "../models/Course.js";

// // Get all students (Admin only)
// export const getAllStudents = async (req, res) => {
//   try {
//     const students = await User.find({ role: "student" })
//       .select("-password")
//       .sort({ createdAt: -1 });
//     res.json(students);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Get single student
// export const getStudentById = async (req, res) => {
//   try {
//     const student = await User.findById(req.params.id).select("-password");
//     if (!student || student.role !== "student") {
//       return res.status(404).json({ message: "Student not found" });
//     }
//     res.json(student);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Update student (Admin only)
// export const updateStudent = async (req, res) => {
//   try {
//     const { name, email, course, semester, isActive } = req.body;
//     const student = await User.findById(req.params.id);

//     if (!student || student.role !== "student") {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     student.name = name || student.name;
//     student.email = email || student.email;
//     student.course = course || student.course;
//     student.semester = semester || student.semester;
//     student.isActive = isActive !== undefined ? isActive : student.isActive;

//     await student.save();
//     res.json({ message: "Student updated successfully", student });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Delete student (Admin only)
// export const deleteStudent = async (req, res) => {
//   try {
//     const student = await User.findById(req.params.id);
//     if (!student || student.role !== "student") {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     await student.deleteOne();
//     res.json({ message: "Student deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Get all courses
// export const getAllCourses = async (req, res) => {
//   try {
//     const courses = await Course.find({ isActive: true }).sort({
//       courseCode: 1,
//     });
//     res.json(courses);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Create course (Admin only)
// export const createCourse = async (req, res) => {
//   try {
//     const {
//       courseCode,
//       courseName,
//       credits,
//       instructor,
//       department,
//       semester,
//     } = req.body;

//     const courseExists = await Course.findOne({ courseCode });
//     if (courseExists) {
//       return res.status(400).json({ message: "Course code already exists" });
//     }

//     const course = await Course.create({
//       courseCode,
//       courseName,
//       credits,
//       instructor,
//       department,
//       semester,
//     });

//     res.status(201).json({ message: "Course created successfully", course });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Update course (Admin only)
// export const updateCourse = async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.id);
//     if (!course) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     const { courseName, credits, instructor, department, semester, isActive } =
//       req.body;
//     course.courseName = courseName || course.courseName;
//     course.credits = credits || course.credits;
//     course.instructor = instructor || course.instructor;
//     course.department = department || course.department;
//     course.semester = semester || course.semester;
//     course.isActive = isActive !== undefined ? isActive : course.isActive;

//     await course.save();
//     res.json({ message: "Course updated successfully", course });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // Delete course (Admin only)
// export const deleteCourse = async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.id);
//     if (!course) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     await course.deleteOne();
//     res.json({ message: "Course deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

import User from "../models/User.js";
import Course from "../models/Course.js";

export const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createCourse = async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      credits,
      instructor,
      department,
      semester,
    } = req.body;

    const course = await Course.create({
      courseCode,
      courseName,
      credits,
      instructor,
      department,
      semester,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
