const Resident = require('../models/Resident');
const Nutrition = require('../models/Nutrition');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ---------------- TOTAL RESIDENTS ----------------
    const totalResidents = await Resident.countDocuments();

    // ---------------- NEW RESIDENTS THIS MONTH ----------------
    const newResidentsThisMonth = await Resident.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });

    // ---------------- TOTAL NUTRITION LOGS ----------------
    const totalNutritionLogs = await Nutrition.countDocuments();

    // ---------------- NUTRITION STATUS COUNTS ----------------
    const nutritionAggregation = await Nutrition.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const nutritionStats = {
      normal: 0,
      underweight: 0,
      overweight: 0
    };

    nutritionAggregation.forEach(item => {
      if (item._id === "Normal") nutritionStats.normal = item.count;
      if (item._id === "Underweight") nutritionStats.underweight = item.count;
      if (item._id === "Overweight") nutritionStats.overweight = item.count;
    });

    res.json({
      totalResidents,
      newResidentsThisMonth,
      totalNutritionLogs,
      nutritionStats
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};