const _ = require('lodash');

/**
 * 
 * @param {*} data 
 * @param {*} page 
 * @param {*} rows 
 * @returns 
 */
const pagination = (data, page, rows) => {
    const max_rows = _.size(data);
    const r = rows !== undefined && rows > 0 ? parseInt(rows) : max_rows;
    const p = page !== undefined && page > 0 ? parseInt(page) : 1;
    const start = (p - 1) * r;
    const end = start + r;
    return _.slice(data, start, end);
}

module.exports = {
    pagination
}