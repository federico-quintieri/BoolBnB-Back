// Importo file per connessione a db
const database = require("../db_connection");

// Callback index immobili
const index = (req, res) => {
  res.json("Mostra tutti gli immobili");
};

//--- Callback per salvare un immobile ---\\
const storeImmobile = (req, res) => {
  // Prendo body dal richiesta API (oggetto)
  const bodyApi = req.body;

  // Query SQL da inviare al database
  const sql = `INSERT INTO immobili (titolo,descrizione,stanze,letti,bagni,metri_quadrati,citta,indirizzo,tipo,immagine,prezzo,creato_in,id_proprietario) 
  VALUES (?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?)
  `;

  // Invio la query al database
  database.query(
    sql,
    [
      bodyApi.titolo,
      bodyApi.descrizione,
      bodyApi.stanze,
      bodyApi.letti,
      bodyApi.bagni,
      bodyApi.metri_quadrati,
      bodyApi.citta,
      bodyApi.indirizzo,
      bodyApi.tipo,
      bodyApi.immagine,
      bodyApi.prezzo,
      bodyApi.id_proprietario,
    ],
    (err, result) => {
      // Gestisco errore
      if (err)
        return res.status(500).json({ message: "Errore interno al server" });
      // Gestisco la risposta se la chiamata al database va correttamente
      return res
        .status(200)
        .json({ status: "Success", message: "Ho inserito il nuovo post" });
    }
  );
};

//Callback per vedere i dettagli immobile
const detailImmobile = (req, res) => {
  res.json("Endpoint per vedere i dettagli immobile");
};
//Callback per salvare recensione immobile
const reviewImmobile = (req, res) => {
  res.json("Endpoint per salvare una recensione dell'immobile");
};
//Callback per aggiungere LIKE all'immobile
const addLikeImmobile = (req, res) => {
  res.json("Endpoint per aggiungere un like all'immobile");
};
//Callback per rimuovere LIKE all'immobile
const removeLikeImmobile = (req, res) => {
  res.json("Endpoint per rimuovere un like all'immobile");
};

// Esporto callbacks
module.exports = {
  index,
  storeImmobile,
  detailImmobile,
  reviewImmobile,
  addLikeImmobile,
  removeLikeImmobile,
};
