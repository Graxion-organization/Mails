import Signature from '../models/Signature.js';

export const createSignature = async (req, res) => {
  try {
    const { orgId, name, bodyHtml, bodyText, isDefault } = req.body;
    if (isDefault) {
      await Signature.updateMany({ account: req.accountId, organization: orgId }, { isDefault: false });
    }
    const signature = await Signature.create({ account: req.accountId, organization: orgId, name, bodyHtml, bodyText, isDefault });
    res.status(201).json({ success: true, data: signature });
  } catch (error) {
    console.error('Create signature error:', error);
    res.status(500).json({ success: false, message: 'Error creating signature' });
  }
};

export const listSignatures = async (req, res) => {
  try {
    const sigs = await Signature.find({ account: req.accountId, organization: req.query.orgId }).sort({ isDefault: -1, name: 1 });
    res.json({ success: true, data: sigs });
  } catch (error) {
    console.error('List signatures error:', error);
    res.status(500).json({ success: false, message: 'Error listing signatures' });
  }
};

export const updateSignature = async (req, res) => {
  try {
    const { name, bodyHtml, bodyText, isDefault } = req.body;
    if (isDefault) {
      const sig = await Signature.findById(req.params.signatureId);
      if (sig) await Signature.updateMany({ account: req.accountId, organization: sig.organization }, { isDefault: false });
    }
    const sig = await Signature.findOneAndUpdate(
      { _id: req.params.signatureId, account: req.accountId },
      { name, bodyHtml, bodyText, isDefault },
      { new: true }
    );
    if (!sig) return res.status(404).json({ success: false, message: 'Signature not found' });
    res.json({ success: true, data: sig });
  } catch (error) {
    console.error('Update signature error:', error);
    res.status(500).json({ success: false, message: 'Error updating signature' });
  }
};

export const deleteSignature = async (req, res) => {
  try {
    await Signature.findOneAndDelete({ _id: req.params.signatureId, account: req.accountId });
    res.json({ success: true, message: 'Signature deleted' });
  } catch (error) {
    console.error('Delete signature error:', error);
    res.status(500).json({ success: false, message: 'Error deleting signature' });
  }
};
