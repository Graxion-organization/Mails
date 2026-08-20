import Contact from '../models/Contact.js';

export const createContact = async (req, res) => {
  try {
    const { orgId, email, name, company, phone, notes, tags } = req.body;
    const contact = await Contact.create({ organization: orgId, account: req.accountId, email, name, company, phone, notes, tags, source: 'manual' });
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Contact already exists' });
    console.error('Create contact error:', error);
    res.status(500).json({ success: false, message: 'Error creating contact' });
  }
};

export const listContacts = async (req, res) => {
  try {
    const { orgId, q, page = 1, limit = 50 } = req.query;
    const query = { organization: orgId, account: req.accountId };
    if (q) query.$text = { $search: q };

    const [contacts, total] = await Promise.all([
      Contact.find(query).sort({ lastEmailAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
      Contact.countDocuments(query),
    ]);

    res.json({ success: true, data: contacts, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    console.error('List contacts error:', error);
    res.status(500).json({ success: false, message: 'Error listing contacts' });
  }
};

export const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.contactId, account: req.accountId },
      req.body,
      { new: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ success: false, message: 'Error updating contact' });
  }
};

export const deleteContact = async (req, res) => {
  try {
    await Contact.findOneAndDelete({ _id: req.params.contactId, account: req.accountId });
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ success: false, message: 'Error deleting contact' });
  }
};

/**
 * Autocomplete contacts by email/name
 */
export const autocomplete = async (req, res) => {
  try {
    const { orgId, q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });

    const contacts = await Contact.find({
      organization: orgId,
      account: req.accountId,
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ],
    }).limit(10).select('email name company avatar').sort({ emailCount: -1 });

    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ success: false, message: 'Error searching contacts' });
  }
};
