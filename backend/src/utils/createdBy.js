/** Standard owner field populate for list/detail APIs. */
const CREATED_BY_SELECT = 'name email';

function populateCreatedBy(query) {
  return query.populate('createdBy', CREATED_BY_SELECT);
}

module.exports = { CREATED_BY_SELECT, populateCreatedBy };
