const ApiError = require('../utils/ApiError');
const Datasheet = require('../models/Datasheet');
const { populateCreatedBy } = require('../utils/createdBy');

async function listDatasheets({ search, page = 1, limit = 50 }) {
  const q = {};
  if (search?.trim()) {
    const s = search.trim();
    q.name = { $regex: s, $options: 'i' };
  }
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const perPage = Math.min(100, Math.max(1, limit));

  const [items, total] = await Promise.all([
    populateCreatedBy(Datasheet.find(q).sort({ updatedAt: -1 }).skip(skip).limit(perPage)),
    Datasheet.countDocuments(q),
  ]);

  return {
    items: items.map(normalizeSheet),
    pagination: {
      page: Math.max(1, page),
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage) || 1,
    },
  };
}

function normalizeSheet(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.columns = Array.isArray(o.columns) ? o.columns : [];
  o.rows = Array.isArray(o.rows) ? o.rows : [];
  return o;
}

async function getDatasheet(id) {
  const row = await populateCreatedBy(Datasheet.findById(id));
  if (!row) throw new ApiError(404, 'Datasheet not found');
  return normalizeSheet(row);
}

async function createDatasheet(body, userId) {
  const columns = Array.isArray(body.columns) ? body.columns.map((c) => String(c).trim()).filter(Boolean) : [];
  const rowCount = Math.max(0, Math.min(500, Number(body.initialRows) || 0));
  const rows =
    Array.isArray(body.rows) && body.rows.length
      ? body.rows
      : Array.from({ length: rowCount || 1 }, () => columns.map(() => ''));

  return Datasheet.create({
    name: body.name.trim(),
    columns,
    rows,
    createdBy: userId,
  });
}

async function updateDatasheet(id, body) {
  const row = await Datasheet.findById(id);
  if (!row) throw new ApiError(404, 'Datasheet not found');
  if (body.name !== undefined) row.name = body.name.trim();
  if (body.columns !== undefined) {
    row.columns = body.columns.map((c) => String(c).trim()).filter(Boolean);
  }
  if (body.rows !== undefined) {
    row.rows = Array.isArray(body.rows) ? body.rows : [];
  }
  await row.save();
  const updated = await populateCreatedBy(Datasheet.findById(id));
  return normalizeSheet(updated);
}

async function deleteDatasheet(id) {
  const row = await Datasheet.findByIdAndDelete(id);
  if (!row) throw new ApiError(404, 'Datasheet not found');
  return { deleted: true };
}

module.exports = {
  listDatasheets,
  getDatasheet,
  createDatasheet,
  updateDatasheet,
  deleteDatasheet,
};
