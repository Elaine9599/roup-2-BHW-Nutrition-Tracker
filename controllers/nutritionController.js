const Nutrition = require('../models/Nutrition');
const calculateBMI = require('../utils/bmiCalculator');
const { isDbConnected } = require('../utils/dbCheck');
const { logActivity } = require('../utils/activityLogger');

exports.addNutritionRecord = async (req, res) => {
  try {
    const { resident, weight, height } = req.body;

    // Validate input
    if (!resident || !weight || !height) {
      return res.status(400).json({ message: 'resident, weight, and height are required' });
    }

    // Calculate BMI (height should be in cm)
    const { bmi, category } = calculateBMI(weight, height);

    const newRecord = new Nutrition({
      resident,
      weight,
      height,
      bmi,
      status: category,
      recordedBy: req.user?.id   // set from authenticated user
    });

    await newRecord.save();

    // Log the activity
    await logActivity(
      req.user?.id,
      'CREATE_NUTRITION',
      'Nutrition',
      newRecord._id.toString(),
      { resident, weight, height, bmi, status: category },
      req.ip,
      req.get('user-agent')
    );

    res.status(201).json(newRecord);
  } catch (err) {
    console.error('Nutrition record error:', err);
    res.status(400).json({ message: "Error saving record", error: err.message });
  }
};
