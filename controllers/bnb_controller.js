// Importo file per connessione a db
const database = require("../db_connection");

// Callback index immobili
const index = (req, res) => {
  res.json("Endpoint index");
};

// Esporto callbacks
module.exports = { index };
