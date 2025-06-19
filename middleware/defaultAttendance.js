import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

const defaultAttendance = async (req, res, next) => {
  try {
    const date = new Date().toISOString().split("T")[0];

    // Get all employees
    const employees = await Employee.find();

    for (const emp of employees) {
      const alreadyExists = await Attendance.findOne({
        employeeId: emp._id,
        date,
      });

      if (!alreadyExists) {
        await Attendance.create({
          employeeId: emp._id,
          date,
          status: null, // or default to "Not Marked"
        });
      }
    }

    next();
  } catch (error) {
    console.error("Default attendance error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default defaultAttendance;
