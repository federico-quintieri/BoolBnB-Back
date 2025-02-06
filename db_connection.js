// Per usare le variabili d'ambiente
require('dotenv').config();

// Importo dipendenze
const mysql = require("mysql2");

console.log(process.env.DB_HOST);


// Creo connessione a database
const connessione = mysql.createConnection({});

// Esporto connessione da utilizzare nelle callback controller
module.exports = connessione;