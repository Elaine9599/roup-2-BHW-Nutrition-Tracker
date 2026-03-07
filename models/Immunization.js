const mongoose = require('mongoose');

const ImmunizationSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  vaccineName: { 
    type: String, 
    enum: ['BCG', 'HepB', 'Pentavalent', 'OPV', 'IPV', 'PCV', 'MMR'], 
    required: true 
  },
  doseNumber: { type: Number, required: true }, // e.g., 1, 2, or 3
  dateAdministered: { type: Date, default: Date.now },
  administeredBy: String, // Name of the BHW or Midwife
  nextDueDate: Date,
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('Immunization', ImmunizationSchema);