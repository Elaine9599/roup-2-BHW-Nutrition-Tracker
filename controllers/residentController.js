const Resident = require('../models/Resident');
const { logActivity } = require('../utils/activityLogger');

// Helper function to validate required fields
const validateResident = (data) => {
  const requiredFields = ['firstName', 'lastName', 'birthDate', 'gender'];
  const missingFields = requiredFields.filter(field => !(field in data));
  
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
    const { search, purok, gender, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};

    // Add purok filter if provided
    if (purok) {
      filter['address.purok'] = parseInt(purok);
    }

    // Add gender filter if provided
    if (gender && ['Male', 'Female'].includes(gender)) {
      filter.gender = gender;
    }

    // Add search filter (search in names)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // case-insensitive
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { middleName: searchRegex }
      ];
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Resident.countDocuments(filter);

    // Fetch residents
    const residents = await Resident.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      residents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
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

    // Age will be calculated automatically by pre-save hook
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