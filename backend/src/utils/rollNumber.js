/**
 * Keep slugPart helper for academy roll numbers / receipts.
 * Legacy Student roll generator removed with the old Student model.
 */
function slugPart(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
    .slice(0, 12) || 'X';
}

module.exports = { slugPart };
