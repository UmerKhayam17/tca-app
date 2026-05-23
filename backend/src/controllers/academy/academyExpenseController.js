const catchAsync = require('../../utils/catchAsync');
const expenseService = require('../../services/academy/academyExpenseService');

const list = catchAsync(async (req, res) => {
  const result = await expenseService.listExpenses({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    category: req.query.category,
    status: req.query.status,
    month: req.query.month ? Number(req.query.month) : undefined,
    year: req.query.year ? Number(req.query.year) : undefined,
    search: req.query.search,
  });
  res.json({ success: true, data: result.items, pagination: result.pagination });
});

const summary = catchAsync(async (req, res) => {
  const data = await expenseService.getExpenseSummary({
    month: req.query.month ? Number(req.query.month) : undefined,
    year: req.query.year ? Number(req.query.year) : undefined,
    category: req.query.category,
  });
  res.json({ success: true, data });
});

const create = catchAsync(async (req, res) => {
  const data = await expenseService.createExpense(req.body, req.user._id);
  res.status(201).json({ success: true, data });
});

const update = catchAsync(async (req, res) => {
  const data = await expenseService.updateExpense(req.params.id, req.body);
  res.json({ success: true, data });
});

const remove = catchAsync(async (req, res) => {
  const data = await expenseService.deleteExpense(req.params.id);
  res.json({ success: true, data });
});

module.exports = { list, summary, create, update, remove };
