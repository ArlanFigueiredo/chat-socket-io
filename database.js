const { default: knex } = require("knex");

var Knex = require("knex")({
    client: 'mssql',
    connection: {
        host: 'localhost',
        user: 'sa',
        password: '12345678',
        database: 'chat'
    }
});


module.exports = Knex