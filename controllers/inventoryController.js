const Inventory = require('../models/Inventory');
const { isDbConnected } = require('../utils/dbCheck');

const SAMPLE_ITEMS = [
  { _id: 'inv-1', itemName: 'Paracetamol', category: 'Medicine', stockQty: 20, expiryDate: null, status: 'In Stock' }
];

// Add new item to stock
exports.addItem = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const created = Object.assign({ _id: `sample-${Date.now()}` }, req.body);
      return res.status(201).json({ success: true, data: created });
    }

    const { itemName, category, stockQty, expiryDate } = req.body;

    // Determine status based on quantity
    let status = 'In Stock';
    if (stockQty <= 0) status = 'Out of Stock';
    else if (stockQty < 10) status = 'Low Stock';

    const newItem = new Inventory({ itemName, category, stockQty, expiryDate, status });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all items for the Inventory list
exports.getInventory = async (req, res) => {
  try {
    if (!isDbConnected()) return res.status(200).json({ success: true, data: SAMPLE_ITEMS });
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
