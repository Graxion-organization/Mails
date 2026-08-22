const fs = require('fs');
const extraCSS = `
/* Better Mobile Table */
@media (max-width: 768px) {
  .dns-table thead { display: none; }
  .dns-table tbody tr {
    display: flex;
    flex-direction: column;
    border: 1px solid #27272a;
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
  }
  .dns-table td {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    border-bottom: 1px solid #27272a;
    padding: 12px 16px;
    gap: 8px;
  }
  .dns-table td::before {
    content: attr(data-label);
    font-weight: 600;
    font-size: 11px;
    color: #a1a1aa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .dns-table tr:last-child { margin-bottom: 0; }
  .dns-table-container { border: none; background: transparent; }
  .dns-copyable { width: 100%; justify-content: space-between; }
  .dns-copyable span { white-space: normal; word-break: break-all; }
}
`;
fs.appendFileSync('src/pages/Settings.css', extraCSS, 'utf8');
