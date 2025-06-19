import multer from "multer";
import Employee from "../models/Employee.js";
import { User } from "../models/User.models.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Leave from "../models/Leave.js";
import Salary from "../models/Salary.js";
import Attendance from "../models/Attendance.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "employee-profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const upload = multer({ storage: storage });

const addEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      employeeId,
      dob,
      gender,
      maritalStatus,
      designation,
      department,
      salary,
      password,
      role,
    } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, error: "user already registered in employee" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashPassword,
      role,
       profileImage: req.file ? req.file.path : "", // Cloudinary returns a full URL
    });
    const savedUser = await newUser.save();

    const newEmployee = new Employee({
      userId: savedUser._id,
      employeeId,
      dob,
      gender,
      maritalStatus,
      designation,
      department,
      salary,
    });

    await newEmployee.save();
    return res.status(200).json({ success: true, message: "employee created" });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ success: false, error: "Server error in adding employee" });
  }
};

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId", { password: 0 })
      .populate("department");
    return res.status(200).json({ success: true, employees });
  } catch (error) {
    console.log(error);
    
    return res
      .status(500)
      .json({ success: false, error: "get employees server error" });
  }
};
const getEmployee = async (req, res) => {
  const { id } = req.params;
  
  try {
    let employee;
    employee = await Employee.findById({ _id: id })
      .populate("userId", { password: 0 })
      .populate("department");
      if(!employee) {
     employee = await Employee.findOne({ userId: id})
      .populate("userId", { password: 0 })
      .populate("department");
      }
    return res.status(200).json({ success: true, employee });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ success: false, error: "get employee server error" });
  }
};

const updateEmployee = async (req,res) => {
   try {
    const {id} = req.params;
    const {
       name,
     maritalStatus,
      designation,
      department,
      salary,
      } = req.body;

      const employee = await Employee.findById({_id: id});
      if (!employee) {
        return res
        .status(404)
        .json({ success: false, error: "employee not found"});

      }
      const user = await User.findById({_id: employee.userId})

      if (!user) {
        return res.status(404)
        .json({success: false,error: "user not found"})
      }

      const updateUser = await User.findByIdAndUpdate({_id: employee.userId}, {name})
      const updateEmployee = await Employee.findByIdAndUpdate({_id: id},{
        maritalStatus,
        designation,salary, department
   })

   if (!updateEmployee || !updateUser) {
    return res
    .status(404)
    .json({success: false, error: "document not found"});
   }

   return res.status(200).json({success: true,message: "employee update"})
   
   } catch (error) {
    return res.status(500).json({success: false, error: "update employees server error"})
   }
}

const fetchEmployeesByDepId = async (req, res) => {
   const { id } = req.params;
  
  try {
    const employees = await Employee.find({ department: id })
    return res.status(200).json({ success: true, employees });
  } catch (error) {
    // console.log(error);

    return res
      .status(500)
      .json({ success: false, error: "get employeesByDepId server error" });
  }
}

const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id).populate("userId");
    if (!employee) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

     // OPTIONAL: Delete image from Cloudinary using public_id
    const imageUrl = employee.userId.profileImage;
    const publicId = imageUrl?.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(`employee-profiles/${publicId}`);

    // ✅ Delete leaves
    await Leave.deleteMany({ employeeId: employee._id });

    // ✅ Delete salaries
    await Salary.deleteMany({ employeeId: employee._id });

    // ✅ Delete attendance records
    await Attendance.deleteMany({ employeeId: employee._id });

    // ✅ Delete user
    await User.findByIdAndDelete(employee.userId._id);

    // ✅ Delete employee
    await Employee.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Employee and all related data deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ success: false, error: "Server error while deleting employee" });
  }
};


export { addEmployee, upload, getEmployees, getEmployee, updateEmployee, fetchEmployeesByDepId, deleteEmployee };
