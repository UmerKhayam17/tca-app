const catchAsync = require('../utils/catchAsync');
const datasheetService = require('../services/datasheetService');

const list = catchAsync(async (req, res) => {
  const result = await datasheetService.listDatasheets({
    search: req.query.search,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  });
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

const getOne = catchAsync(async (req, res) => {
  const data = await datasheetService.getDatasheet(req.params.id);
  res.json({ success: true, data });
});

const create = catchAsync(async (req, res) => {
  const data = await datasheetService.createDatasheet(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await datasheetService.updateDatasheet(req.params.id, req.body);
  res.json({ success: true, data });
});

const remove = catchAsync(async (req, res) => {
  const data = await datasheetService.deleteDatasheet(req.params.id);
  res.json({ success: true, data });
});

module.exports = { list, getOne, create, update, remove };
