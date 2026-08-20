import { searchMail } from '../services/searchService.js';

export const search = async (req, res) => {
  try {
    const { orgId, q, from, to, subject, hasAttachment, label, category, folder, dateFrom, dateTo, isRead, isStarred, page, limit } = req.query;

    if (!orgId) {
      return res.status(400).json({ success: false, message: 'orgId is required' });
    }

    const results = await searchMail({
      organizationId: orgId,
      accountId: req.accountId,
      query: q,
      from, to, subject,
      hasAttachment: hasAttachment === 'true' ? true : hasAttachment === 'false' ? false : undefined,
      label, category, folder, dateFrom, dateTo,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      isStarred: isStarred === 'true' ? true : isStarred === 'false' ? false : undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
    });

    res.json({ success: true, ...results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Error searching' });
  }
};
