// Importo file per connessione a db
const database = require("../db_connection");

// Callback index immobili
const index = (req, res) => {
  res.json("Mostra tutti gli immobili");
};
//Callback per salvare un immobile
const storeImmobile = (req, res) => {
  const bodyApi = req.body;
  res.json("Endpoint per salvare l'immobile")
}; 
//Callback per vedere i dettagli immobile
const detailImmobile = (req, res) => {
  res.json("Endpoint per vedere i dettagli immobile")
};
//Callback per salvare recensione immobile
const reviewImmobile = (req,res) => {
  res.json("Endpoint per salvare una recensione dell'immobile")
};
//Callback per aggiungere LIKE all'immobile
const addLikeImmobile = (req, res) => {
  res.json("Endpoint per aggiungere un like all'immobile")
};
//Callback per rimuovere LIKE all'immobile
const removeLikeImmobile = (req, res) => {
  res.json("Endpoint per rimuovere un like all'immobile")
};

// Esporto callbacks
module.exports = { index, storeImmobile, detailImmobile, reviewImmobile, addLikeImmobile, removeLikeImmobile };


