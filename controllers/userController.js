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

const listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;
    const q = {};
    if (req.query.search) {
      const s = String(req.query.search);
      q.$or = [
        { userName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { primaryMobile: { $regex: s, $options: 'i' } },
        { uniqueCode: { $regex: s, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      User.find(q).populate('userType').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(q),
    ]);
    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list users', error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('userType address');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user', error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userName, email, primaryMobile, typeName, address1, address2, cityName, isActive } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already used' });
      user.email = email;
    }
    if (primaryMobile && primaryMobile !== user.primaryMobile) {
      const exists = await User.findOne({ primaryMobile });
      if (exists) return res.status(409).json({ message: 'Mobile already used' });
      user.primaryMobile = primaryMobile;
    }
    if (typeof userName === 'string') user.userName = userName;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    if (typeName) {
      let t = await UserType.findOne({ name: typeName });
      if (!t) t = await UserType.create({ name: typeName });
      user.userType = t._id;
    }

    if (address1 || address2 || cityName) {
      let cityDoc = null;
      if (cityName) {
        cityDoc = await City.findOneAndUpdate({ cityName }, { cityName }, { new: true, upsert: true });
      }
      if (user.address) {
        const addr = await Address.findById(user.address);
        if (addr) {
          if (address1 !== undefined) addr.address1 = address1;
          if (address2 !== undefined) addr.address2 = address2;
          if (cityDoc) addr.city = cityDoc._id;
          await addr.save();
        }
      } else {
        const addr = await Address.create({ address1, address2, city: cityDoc?._id });
        user.address = addr._id;
      }
    }

    await user.save();
    const populated = await User.findById(user._id).populate('userType address');
    res.json({ message: 'User updated', user: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

const assignManager = async (req, res) => {
  try {
    const { managerId } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) return res.status(404).json({ message: 'Manager user not found' });
      user.manager = manager._id;
    } else {
      user.manager = undefined;
    }
    await user.save();
    const populated = await User.findById(user._id).populate('userType address manager');
    res.json({ message: 'Manager assignment updated', user: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign manager', error: err.message });
  }
};

const listSubordinates = async (req, res) => {
  try {
    const items = await User.find({ manager: req.params.id }).populate('userType');
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list subordinates', error: err.message });
  }
};

// Type guard helper
async function ensureType(user, expected) {
  if (!user || !user.userType) return false;
  const t = await UserType.findById(user.userType);
  return !!(t && new RegExp(`^${expected}$`, 'i').test(t.name));
}

// Map Dealer -> Distributor (dealer reports to distributor)
const mapDealerDistributor = async (req, res) => {
  try {
    const { dealerId, distributorId } = req.body || {};
    if (!dealerId || !distributorId) return res.status(400).json({ message: 'dealerId and distributorId are required' });
    const [dealer, distributor] = await Promise.all([
      User.findById(dealerId),
      User.findById(distributorId),
    ]);
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });
    if (!distributor) return res.status(404).json({ message: 'Distributor not found' });
    if (!(await ensureType(dealer, 'Dealer'))) return res.status(400).json({ message: 'dealerId is not a Dealer' });
    if (!(await ensureType(distributor, 'Distributor'))) return res.status(400).json({ message: 'distributorId is not a Distributor' });
    dealer.manager = distributor._id;
    await dealer.save();
    const populated = await User.findById(dealer._id).populate('userType address manager');
    res.json({ message: 'Dealer mapped to Distributor', user: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to map dealer/distributor', error: err.message });
  }
};

// Map Salesman -> Distributor
const mapDistributorSalesman = async (req, res) => {
  try {
    const { distributorId, salesmanId } = req.body || {};
    if (!distributorId || !salesmanId) return res.status(400).json({ message: 'distributorId and salesmanId are required' });
    const [distributor, salesman] = await Promise.all([
      User.findById(distributorId),
      User.findById(salesmanId),
    ]);
    if (!distributor) return res.status(404).json({ message: 'Distributor not found' });
    if (!salesman) return res.status(404).json({ message: 'Salesman not found' });
    if (!(await ensureType(distributor, 'Distributor'))) return res.status(400).json({ message: 'distributorId is not a Distributor' });
    const isSales = (await ensureType(salesman, 'Salesperson')) || (await ensureType(salesman, 'Salesman')) || (await ensureType(salesman, 'Sales'));
    if (!isSales) return res.status(400).json({ message: 'salesmanId is not a Salesperson' });
    salesman.manager = distributor._id;
    await salesman.save();
    const populated = await User.findById(salesman._id).populate('userType address manager');
    res.json({ message: 'Salesman mapped to Distributor', user: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to map distributor/salesman', error: err.message });
  }
};

// Map Salesman -> Dealer
const mapDealerSalesman = async (req, res) => {
  try {
    const { dealerId, salesmanId } = req.body || {};
    if (!dealerId || !salesmanId) return res.status(400).json({ message: 'dealerId and salesmanId are required' });
    const [dealer, salesman] = await Promise.all([
      User.findById(dealerId),
      User.findById(salesmanId),
    ]);
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });
    if (!salesman) return res.status(404).json({ message: 'Salesman not found' });
    if (!(await ensureType(dealer, 'Dealer'))) return res.status(400).json({ message: 'dealerId is not a Dealer' });
    const isSales = (await ensureType(salesman, 'Salesperson')) || (await ensureType(salesman, 'Salesman')) || (await ensureType(salesman, 'Sales'));
    if (!isSales) return res.status(400).json({ message: 'salesmanId is not a Salesperson' });
    salesman.manager = dealer._id;
    await salesman.save();
    const populated = await User.findById(salesman._id).populate('userType address manager');
    res.json({ message: 'Salesman mapped to Dealer', user: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to map dealer/salesman', error: err.message });
  }
};

module.exports = { createUserType, createUser, seedAdmin, listUsers, getUserById, updateUser, deleteUser, assignManager, listSubordinates, mapDealerDistributor, mapDistributorSalesman, mapDealerSalesman };
