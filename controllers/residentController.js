const Resident = require('../models/Resident');
const { logActivity } = require('../utils/activityLogger');

// Helper function to validate required fields
const validateResident = (data) => {
  const requiredFields = ['firstName', 'lastName', 'birthDate', 'gender'];
  const missingFields = requiredFields.filter((field) => !(field in data));

  // Validate address structure
  if (!data.address || typeof data.address !== 'object') {
    missingFields.push('address (object with purok and street)');
  } else {
    if (!data.address.purok) missingFields.push('address.purok');
    if (!data.address.street) missingFields.push('address.street');
  }

  return missingFields;
};

// Get all residents
exports.getAllResidents = async (req, res) => {
  try {
    // No filters, no pagination, no find()
    const residents = await Resident.aggregate([
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({ residents });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Add a new resident
exports.addResident = async (req, res) => {
  try {
    // Validate required fields
    const missingFields = validateResident(req.body);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Validation Failed',
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Age is calculated by the Resident pre-save hook
    const newResident = new Resident(req.body);
    await newResident.save();

    // Log the activity
    await logActivity(
      req.user?.id,
      'CREATE_RESIDENT',
      'Resident',
      newResident._id.toString(),
      { name: `${newResident.firstName} ${newResident.lastName}` },
      req.ip,
      req.get('user-agent')
    );

    res.status(201).json(newResident);
  } catch (err) {
    res.status(400).json({ message: 'Validation Failed', error: err.message });
  }
};
