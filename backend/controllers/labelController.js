import Label from '../models/Label.js';

export const createLabel = async (req, res) => {
  try {
    const { name, color, scope = 'personal', orgId } = req.body;
    if (!name || !orgId) {
      return res.status(400).json({ success: false, message: 'Name and orgId are required' });
    }

    const label = await Label.create({
      organization: orgId,
      name,
      color: color || '#8b5cf6',
      scope,
      account: scope === 'personal' ? req.accountId : null,
    });

    res.status(201).json({ success: true, data: label });
  } catch (error) {
    console.error('Create label error:', error);
    res.status(500).json({ success: false, message: 'Error creating label' });
  }
};

export const listLabels = async (req, res) => {
  try {
    const { orgId } = req.query;
    const labels = await Label.find({
      organization: orgId,
      $or: [
        { scope: 'org' },
        { scope: 'personal', account: req.accountId },
        { type: 'system' },
      ],
    }).sort({ type: 1, order: 1, name: 1 });

    res.json({ success: true, data: labels });
  } catch (error) {
    console.error('List labels error:', error);
    res.status(500).json({ success: false, message: 'Error listing labels' });
  }
};

export const updateLabel = async (req, res) => {
  try {
    const { name, color, isVisible, order } = req.body;
    const label = await Label.findByIdAndUpdate(
      req.params.labelId,
      { name, color, isVisible, order },
      { new: true }
    );
    if (!label) return res.status(404).json({ success: false, message: 'Label not found' });
    res.json({ success: true, data: label });
  } catch (error) {
    console.error('Update label error:', error);
    res.status(500).json({ success: false, message: 'Error updating label' });
  }
};

export const deleteLabel = async (req, res) => {
  try {
    const label = await Label.findById(req.params.labelId);
    if (!label) return res.status(404).json({ success: false, message: 'Label not found' });
    if (label.type === 'system') return res.status(403).json({ success: false, message: 'Cannot delete system labels' });

    await Label.findByIdAndDelete(req.params.labelId);
    res.json({ success: true, message: 'Label deleted' });
  } catch (error) {
    console.error('Delete label error:', error);
    res.status(500).json({ success: false, message: 'Error deleting label' });
  }
};
