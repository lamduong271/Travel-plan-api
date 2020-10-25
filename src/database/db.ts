const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'lamduong271',
  password: 'lamduong271',
  database: 'travel_plan_database',
  host:'localhost',
  port:5432
})

module.exports = pool