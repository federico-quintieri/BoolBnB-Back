// Importo file per connessione a db
const database = require("../db_connection");

//--- Callback index immobili ---\\
const mostraImmobili = (req, res) => {
  // Faccio query per mostrarmi tutti gli immobili
  const sql = `SELECT * FROM immobili`;

  // Invio query al database
  database.query(sql, (err, result) => {
    if (err)
      return res.status(500).json({ message: "Errore interno al server" });

    return res.status(200).json(result);
  });
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
  // Prima devo fare query che mi controlla se immobile esiste in base ad id
  const immobileID = parseInt(req.params.id);
  const sql = `
    SELECT 
        i.id AS immobile_id,
        i.titolo,
        i.descrizione,
        i.stanze,
        i.letti,
        i.bagni,
        i.metri_quadrati,
        i.citta,
        i.indirizzo,
        i.tipo,
        i.immagine,
        i.prezzo,
        i.creato_in AS immobile_creato_in,
        i.id_proprietario,
        r.id AS recensione_id,
        r.nome AS recensore,
        r.commento,
        r.cuoricini,
        r.giorni_permanenza,
        r.creato_in AS recensione_creato_in,
        r.id_utente_interessato
    FROM immobili i
    LEFT JOIN recensioni r ON i.id = r.id_immobile
    WHERE i.id = ?;
  `;

  // Invio la query
  database.query(sql, [immobileID], (err, result) => {
    // Check errore server
    if (err)
      return res.status(500).json({ message: "Errore interno al server" });
    
    // Check se la lunghezza della rispota API è array vuoto (query no good)
    if (result.length == 0) {
      return res.status(404).json({ message: "Non c'è id che cerchi" });
    }

    // Ritorno la data presa dal risultato della query
    return res.status(200).json(result);
  });
};
//Callback per salvare recensione immobile
const addReviewImmobile = (req, res) => {
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
  mostraImmobili,
  storeImmobile,
  detailImmobile,
  addReviewImmobile,
  addLikeImmobile,
  removeLikeImmobile,
};
