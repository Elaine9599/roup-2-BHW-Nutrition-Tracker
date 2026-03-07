const mongoose = require('mongoose');

const ResidentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  middleName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  age: { type: Number }, // removed required
  address: {
    purok: { type: Number, required: true },
    street: { type: String, required: true }
  },
  contactNumber: String,
  medicalConditions: { type: [String], default: [] },
  children: [{
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    age: { type: Number }
  }]
}, { timestamps: true });

// Calculate age from birthdate before saving
ResidentSchema.pre('save', function(next) {
  // Calculate age for the resident
  if (this.birthDate) {
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  
  // Calculate age for each child
  if (this.children && this.children.length > 0) {
    this.children.forEach(child => {
      if (child.birthDate) {
        const today = new Date();
        const birthDate = new Date(child.birthDate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        child.age = age;
      }
    });
  }
  
  next();
});

module.exports = mongoose.model('Resident', ResidentSchema);
