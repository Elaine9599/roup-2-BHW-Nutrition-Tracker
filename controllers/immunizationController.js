const Immunization = require('../models/Immunization'); // Import your model
const { isDbConnected } = require('../utils/dbCheck');

const SAMPLE_IMM = {
    _id: 'sample-imm-1',
    resident: 'sample-resident-1',
    vaccineName: 'BCG',
    doseNumber: 1,
    dateAdministered: new Date(),
    remarks: 'Sample'
};

// @desc    Add a new immunization record
// @route   POST /api/immunizations
exports.addImmunization = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const created = Object.assign({ _id: `sample-${Date.now()}` }, req.body);
            return res.status(201).json(created);
        }

        const { resident, vaccineName, doseNumber, dateAdministered, administeredBy, nextDueDate, remarks } = req.body;

        const newRecord = new Immunization({ resident, vaccineName, doseNumber, dateAdministered, administeredBy, nextDueDate, remarks });
        const savedRecord = await newRecord.save();
        await savedRecord.populate('resident', 'firstName lastName contactNumber medicalConditions');
        res.status(201).json(savedRecord);
    } catch (err) {
        res.status(400).json({ message: 'Failed to add record', error: err.message });
    }
};

// @desc    Get all immunization records for one resident
// @route   GET /api/immunizations/:residentId
exports.getResidentHistory = async (req, res) => {
    try {
        if (!isDbConnected()) return res.status(200).json([SAMPLE_IMM]);

        const history = await Immunization.find({ resident: req.params.residentId })
            .populate('resident', 'firstName lastName contactNumber medicalConditions') // Includes contact and medical info
            .sort({ dateAdministered: -1 });

        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};