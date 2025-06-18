import mongoose from 'mongoose'
import {Schema} from "mongoose"

const salarySchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    },
    basicSalary: {
        type: Number,
        required: true
    },
    allowances: {
        type: Number,
    },
    deductions: {
        type: Number,
    },
    netSalary: {
        type: Number,
    },
    payDate: {
        type: Date,
        required: true
    },
}, {timestamps: true})

const Salary = mongoose.model('Salary', salarySchema);
export default Salary