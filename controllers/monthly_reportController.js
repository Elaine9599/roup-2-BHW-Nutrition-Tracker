const Resident = require('../models/Resident');
const Nutrition = require('../models/Nutrition');
const Immunization = require('../models/Immunization');
const Inventory = require('../models/Inventory');
const { isDbConnected } = require('../utils/dbCheck');

exports.getMonthlyReport = async (req, res) => {
    try {
        const now = new Date();
        const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Fallback sample when DB not connected
        if (!isDbConnected()) {
            return res.status(200).json({
                success: true,
                report: {
                    totalResidents: 1,
                    nutritionLogs: 5,
                    normalBMI: 3,
                    vaccinated: 1,
                    vaccinationCoverage: '100.0',
                    lowStockItems: 0,
                    month
                }
            });
        }

        const totalResidents = await Resident.countDocuments();
        const nutritionLogs = await Nutrition.countDocuments();
        const normalBMI = await Nutrition.countDocuments({ status: 'Normal' });

        // Count immunization records that have a dateAdministered (i.e. actually given)
        const vaccinated = await Immunization.countDocuments({ dateAdministered: { $exists: true, $ne: null } });

        const coverage = totalResidents > 0 ? (vaccinated / totalResidents) * 100 : 0;
        const lowStockItems = await Inventory.countDocuments({ status: 'Low Stock' });

        res.status(200).json({
            success: true,
            report: {
                totalResidents,
                nutritionLogs,
                normalBMI,
                vaccinated,
                vaccinationCoverage: coverage.toFixed(1),
                lowStockItems,
                month
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


// new this month, medical cases