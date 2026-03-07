const BMI = require('../models/bmi');
const calculateBMI = require('../utils/bmiCalculator');

exports.createBMI = async (req, res) => {
  try {
    const { weight, height } = req.body;

    if (!weight || !height) {
      return res.status(400).json({ error: 'Weight and height are required' });
    }

    // Use util to calculate BMI
    const { bmi, category } = calculateBMI(weight, height);

    // Save to DB
    const newBMI = new BMI({ weight, height, bmi, category });
    const savedBMI = await newBMI.save();

    res.status(201).json(savedBMI);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllBMI = async (req, res) => {
  try {
    const allBMI = await BMI.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(allBMI);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};