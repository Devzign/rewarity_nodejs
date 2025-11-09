const User = require('../models/User');
const UserType = require('../models/UserType');
const Address = require('../models/Address');
const City = require('../models/City');

// Generate simple incremental-like code (legacy)
const generateCode = async (typeName) => {
  const baseCodes = {
    Dealer: 9900000000,
    Distributor: 999999,
    Salesperson: 1110000,
  };
  const base = baseCodes[typeName] || 1000000;
  const count = await User.countDocuments({}) + 1;
  return (base + count).toString();
};

const createUserType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userType = await UserType.create({ name, description });
    res.status(201).json({ message: 'User type created', userType });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { userName, email, primaryMobile, typeName, address1, address2, cityName } = req.body;
    if (!primaryMobile) return res.status(400).json({ message: 'primaryMobile is required' });

    const userType = await UserType.findOne({ name: typeName });
    if (!userType) return res.status(400).json({ message: 'Invalid user type' });

    const city = await City.findOneAndUpdate({ cityName }, { cityName }, { upsert: true, new: true });
    const address = await Address.create({ address1, address2, city: city._id });
    const uniqueCode = await generateCode(typeName);

    const user = await User.create({
      userName,
      email,
      primaryMobile,
      userType: userType._id,
      address: address._id,
      uniqueCode,
    });

    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const seedAdmin = async () => {
  const existing = await User.findOne({ email: 'admin@rewarity.com' });
  if (existing) return;

  let adminType = await UserType.findOne({ name: 'Admin' });
  if (!adminType) adminType = await UserType.create({ name: 'Admin' });

  await User.create({
    userName: 'Admin',
    email: 'admin@rewarity.com',
    primaryMobile: '9999999999',
    userType: adminType._id,
    uniqueCode: 'ADMIN-001',
  });

  console.log('✅ Default Admin created');
};

module.exports = { createUserType, createUser, seedAdmin };

