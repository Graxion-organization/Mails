import Template from '../models/Template.js';

export const createTemplate = async (req, res) => {
  try {
    const { orgId, name, subject, bodyHtml, bodyText, category, variables, isShared } = req.body;
    const template = await Template.create({ organization: orgId, createdBy: req.accountId, name, subject, bodyHtml, bodyText, category, variables, isShared });
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ success: false, message: 'Error creating template' });
  }
};

export const listTemplates = async (req, res) => {
  try {
    const templates = await Template.find({
      organization: req.query.orgId,
      $or: [{ isShared: true }, { createdBy: req.accountId }],
    }).sort({ category: 1, name: 1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({ success: false, message: 'Error listing templates' });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.templateId, $or: [{ createdBy: req.accountId }, { organization: req.body.orgId }] },
      req.body,
      { new: true }
    );
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ success: false, message: 'Error updating template' });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    await Template.findOneAndDelete({ _id: req.params.templateId, createdBy: req.accountId });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ success: false, message: 'Error deleting template' });
  }
};
