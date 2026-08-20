/**
 * Basic spam analysis service
 * Scores incoming emails based on various signals
 */

/**
 * Analyze an email for spam indicators
 * Returns { score: 0-100, isSpam: boolean, reasons: string[], spfPass, dkimPass, dmarcPass }
 */
export const analyzeSpam = ({ from, subject = '', bodyText = '', bodyHtml = '', headers = {} }) => {
  let score = 0;
  const reasons = [];

  // Check authentication headers
  const spfPass = checkSPF(headers);
  const dkimPass = checkDKIM(headers);
  const dmarcPass = checkDMARC(headers);

  if (!spfPass) { score += 15; reasons.push('SPF check failed'); }
  if (!dkimPass) { score += 15; reasons.push('DKIM check failed'); }
  if (!dmarcPass) { score += 10; reasons.push('DMARC check failed'); }

  // Content analysis
  const text = `${subject} ${bodyText}`.toLowerCase();

  // Spam keywords
  const spamKeywords = [
    'viagra', 'cialis', 'lottery', 'winner', 'congratulations you won',
    'nigerian prince', 'million dollars', 'act now', 'limited time',
    'click here immediately', 'free money', 'guaranteed income',
    'work from home', 'no experience needed', 'double your money',
    'cryptocurrency investment', 'risk-free', 'earn extra cash',
  ];

  const keywordMatches = spamKeywords.filter(kw => text.includes(kw));
  if (keywordMatches.length > 0) {
    score += Math.min(keywordMatches.length * 10, 30);
    reasons.push(`Spam keywords detected: ${keywordMatches.join(', ')}`);
  }

  // Excessive caps in subject
  if (subject && subject.length > 5) {
    const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
    if (capsRatio > 0.6) {
      score += 10;
      reasons.push('Excessive capitalization in subject');
    }
  }

  // Excessive exclamation marks
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    score += 5;
    reasons.push('Excessive exclamation marks');
  }

  // Check for suspicious URLs in HTML
  if (bodyHtml) {
    const urlMatches = bodyHtml.match(/href\s*=\s*["']([^"']+)["']/gi) || [];
    const suspiciousUrls = urlMatches.filter(url => {
      const href = url.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] || '';
      return /bit\.ly|tinyurl|goo\.gl|t\.co|is\.gd|buff\.ly/.test(href)
        || /\.ru\/|\.cn\/|\.tk\//.test(href);
    });

    if (suspiciousUrls.length > 0) {
      score += 15;
      reasons.push(`Suspicious URLs detected (${suspiciousUrls.length})`);
    }
  }

  // From address analysis
  if (from) {
    // Freemail providers sending "business" emails
    const freemail = /gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|aol\.com/;
    if (freemail.test(from) && /invoice|payment|account|verify|urgent/.test(text)) {
      score += 10;
      reasons.push('Business-type email from freemail provider');
    }
  }

  // Clamp score
  score = Math.min(score, 100);

  return {
    score,
    isSpam: score >= 50,
    reasons,
    spfPass,
    dkimPass,
    dmarcPass,
  };
};

function checkSPF(headers) {
  const spf = headers['received-spf'] || headers['Received-SPF'] || '';
  return /pass/i.test(spf) || !spf; // If no header, assume OK
}

function checkDKIM(headers) {
  const authResults = headers['authentication-results'] || headers['Authentication-Results'] || '';
  return /dkim=pass/i.test(authResults) || !authResults;
}

function checkDMARC(headers) {
  const authResults = headers['authentication-results'] || headers['Authentication-Results'] || '';
  return /dmarc=pass/i.test(authResults) || !authResults;
}

export default { analyzeSpam };
