import Label from '../models/Label.js';
import Thread from '../models/Thread.js';

/**
 * @desc    Get all labels for organization/account
 * @route   GET /api/mail/labels?orgId=xxx
 */
export const getLabels = async (req, res) => {
  try {
    const orgId = req.query.orgId;
    if (!orgId) return res.status(400).json({ success: false, message: 'orgId is required' });

    const labels = await Label.find({
      organization: orgId,
      $or: [
        { scope: 'org' },
        { scope: 'personal', account: req.accountId }
      ]
    }).sort({ order: 1, createdAt: 1 });

    res.json({ success: true, data: labels });
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ success: false, message: 'Error fetching labels' });
  }
};

/**
 * @desc    Create a new label
 * @route   POST /api/mail/labels
 */
export const createLabel = async (req, res) => {
  try {
    const { orgId, name, color, type = 'custom', scope = 'personal' } = req.body;

    if (!orgId || !name) {
      return res.status(400).json({ success: false, message: 'orgId and name are required' });
    }

    const label = await Label.create({
      organization: orgId,
      account: scope === 'personal' ? req.accountId : null,
      name,
      color,
      type,
      scope,
    });

    res.status(201).json({ success: true, data: label });
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ success: false, message: 'Error creating label' });
  }
};

/**
 * @desc    Update a label
 * @route   PUT /api/mail/labels/:labelId
 */
export const updateLabel = async (req, res) => {
  try {
    const { name, color, isVisible, order } = req.body;
    
    // Check ownership
    const query = {
      _id: req.params.labelId,
      $or: [
        { scope: 'org' }, // TODO: check admin for org labels
        { scope: 'personal', account: req.accountId }
      ]
    };

    const label = await Label.findOne(query);

    if (!label) {
      return res.status(404).json({ success: false, message: 'Label not found or unauthorized' });
    }

    if (name) label.name = name;
    if (color) label.color = color;
    if (isVisible !== undefined) label.isVisible = isVisible;
    if (order !== undefined) label.order = order;

    await label.save();

    res.json({ success: true, data: label });
  } catch (error) {
    console.error('Error updating label:', error);
    res.status(500).json({ success: false, message: 'Error updating label' });
  }
};

/**
 * @desc    Delete a label
 * @route   DELETE /api/mail/labels/:labelId
 */
export const deleteLabel = async (req, res) => {
  try {
    const query = {
      _id: req.params.labelId,
      $or: [
        { scope: 'org' },
        { scope: 'personal', account: req.accountId }
      ]
    };

    const label = await Label.findOneAndDelete(query);

    if (!label) {
      return res.status(404).json({ success: false, message: 'Label not found or unauthorized' });
    }

    // Remove label from all threads
    await Thread.updateMany(
      { labels: req.params.labelId },
      { $pull: { labels: req.params.labelId } }
    );

    res.json({ success: true, message: 'Label deleted' });
  } catch (error) {
    console.error('Error deleting label:', error);
    res.status(500).json({ success: false, message: 'Error deleting label' });
  }
};

/**
 * @desc    Apply or remove a label from a thread
 * @route   POST /api/mail/labels/thread/:threadId
 */
export const toggleThreadLabel = async (req, res) => {
  try {
    const { orgId, labelId, action } = req.body; // action: 'add' | 'remove'

    if (!orgId || !labelId || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid orgId, labelId or action' });
    }

    const thread = await Thread.findOne({
      _id: req.params.threadId,
      organization: orgId
    });

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    if (action === 'add') {
      if (!thread.labels.includes(labelId)) {
        thread.labels.push(labelId);
      }
    } else if (action === 'remove') {
      thread.labels = thread.labels.filter(id => id.toString() !== labelId);
    }

    await thread.save();

    res.json({ success: true, data: thread });
  } catch (error) {
    console.error('Error toggling thread label:', error);
    res.status(500).json({ success: false, message: 'Error toggling thread label' });
  }
};
