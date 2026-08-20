import Filter from '../models/Filter.js';

export const createFilter = async (req, res) => {
  try {
    const { orgId, name, conditions, actions, priority } = req.body;
    const filter = await Filter.create({
      organization: orgId,
      account: req.accountId,
      name, conditions, actions, priority,
    });
    res.status(201).json({ success: true, data: filter });
  } catch (error) {
    console.error('Create filter error:', error);
    res.status(500).json({ success: false, message: 'Error creating filter' });
  }
};

export const listFilters = async (req, res) => {
  try {
    const filters = await Filter.find({
      organization: req.query.orgId,
      account: req.accountId,
    }).sort({ priority: 1 }).populate('actions.addLabel', 'name color');
    res.json({ success: true, data: filters });
  } catch (error) {
    console.error('List filters error:', error);
    res.status(500).json({ success: false, message: 'Error listing filters' });
  }
};

export const updateFilter = async (req, res) => {
  try {
    const filter = await Filter.findOneAndUpdate(
      { _id: req.params.filterId, account: req.accountId },
      req.body,
      { new: true }
    );
    if (!filter) return res.status(404).json({ success: false, message: 'Filter not found' });
    res.json({ success: true, data: filter });
  } catch (error) {
    console.error('Update filter error:', error);
    res.status(500).json({ success: false, message: 'Error updating filter' });
  }
};

export const deleteFilter = async (req, res) => {
  try {
    await Filter.findOneAndDelete({ _id: req.params.filterId, account: req.accountId });
    res.json({ success: true, message: 'Filter deleted' });
  } catch (error) {
    console.error('Delete filter error:', error);
    res.status(500).json({ success: false, message: 'Error deleting filter' });
  }
};
