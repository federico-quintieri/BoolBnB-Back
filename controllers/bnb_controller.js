// Importo file per connessione a db
const database = require("../db_connection");

//--- Callback index immobili ---\\
const mostraImmobili = (req, res) => {
  // Faccio query per mostrarmi tutti gli immobili
  let sql = `SELECT * FROM immobili`;
  const filters = req.query;
  console.log(filters.search);


  const params = [];
  const conditions = [];
  //filtro di ricerca
  if (filters.search) {
    //aggiungo la query a conditions
    conditions.push(`immobili.tipo LIKE ?`);
    //aggiungo i valori da ricercare
    params.push(`%${filters.search}%`);
  }
  //se ci sono più query vengono concatenate
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  
  // Invio query al database
  database.query(sql, params, (err, result) => {
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
    SELECT 	immobili.id AS immobile_id,
        immobili.titolo,
        immobili.descrizione,
        immobili.stanze,
        immobili.letti,
        immobili.bagni,
        immobili.metri_quadrati,
        immobili.citta,
        immobili.indirizzo,
        immobili.tipo,
        immobili.immagine,
        immobili.prezzo,
        immobili.creato_in AS immobile_creato_in,
        immobili.id_proprietario,
        recensioni.id AS recensione_id,
        recensioni.nome AS recensore,
        recensioni.commento,
        recensioni.voto,
        recensioni.giorni_permanenza,
        recensioni.creato_in AS recensione_creato_in,
        recensioni.id_utente_interessato,
        count(cuoricini.id)
      from immobili
      left join recensioni on recensioni.id_immobile= immobili.id
      left join cuoricini on cuoricini.id_immobile=immobili.id
      where immobili.id = 3
      group by immobili.id, recensioni.id
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

    // Estrarre i dati dell'immobile dalla prima riga
    const immobile = {
      immobile_id: result[0].immobile_id,
      titolo: result[0].titolo,
      descrizione: result[0].descrizione,
      stanze: result[0].stanze,
      letti: result[0].letti,
      bagni: result[0].bagni,
      metri_quadrati: result[0].metri_quadrati,
      citta: result[0].citta,
      indirizzo: result[0].indirizzo,
      tipo: result[0].tipo,
      immagine: result[0].immagine,
      prezzo: result[0].prezzo,
      immobile_creato_in: result[0].immobile_creato_in,
      id_proprietario: result[0].id_proprietario,
      numero_like: result[0].numero_like, // Aggiungiamo il conteggio dei like
      recensioni: [], // 2️⃣ Array vuoto che riempiremo dopo
    };

    // Aggiungere recensioni (se esistono)
    result.forEach((row) => {
      if (row.recensione_id) {
        // Se c'è una recensione
        immobile.recensioni.push({
          recensione_id: row.recensione_id,
          recensore: row.recensore,
          commento: row.commento,
          voto: row.voto,
          giorni_permanenza: row.giorni_permanenza,
          recensione_creato_in: row.recensione_creato_in,
          id_utente_interessato: row.id_utente_interessato,
        });
      }
    });

    // Restituire l'oggetto immobile con le recensioni raccolte
    return res.status(200).json(immobile);
  });
};
//Callback per salvare recensione immobile
const addReviewImmobile = (req, res) => {
  // Prendo id immobile
  const immobileID = parseInt(req.params.id);

  // Prendo oggetto body dalla richiesta che contiene la recensione effettiva
  const bodyApi = req.body;

  const sql = `
    INSERT INTO recensioni 
    (nome, commento, voto, giorni_permanenza, creato_in, id_utente_interessato, id_proprietario, id_immobile) 
    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?);
  `;

  database.query(
    sql,
    [
      bodyApi.nome,
      bodyApi.commento,
      bodyApi.voto,
      bodyApi.giorni_permanenza,
      bodyApi.id_utente_interessato,
      bodyApi.id_proprietario,
      immobileID,
    ],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Errore interno al server" });

      return res.status(201).json({
        message: "Recensione salvata con successo",
      });
    }
  );
};

//Callback per aggiungere LIKE all'immobile
const addLikeImmobile = (req, res) => {
  // Prendo id immobile e id utente dal body
  const { id_immobile, id_utente } = req.body;

  const checkSql = `SELECT * FROM cuoricini WHERE id_immobile = ? AND id_utente = ?`;

  database.query(checkSql, [id_immobile, id_utente], (err, result) => {
    if (err) return res.status(500).json({ message: "Errore server" });

    if (result.length > 0)
      return res.status(400).json({ message: "Hai già messo il like" });

    const insertSql = `INSERT INTO cuoricini (id_immobile,id_utente,creato_in) VALUES (?,?,NOW())`;

    database.query(insertSql, [id_immobile, id_utente], (err, result) => {
      if (err) return res.status(500).json({ message: "Errore server" });

      return res.status(201).json({ message: "Like aggiunto con successo" });
    });
  });
};

//Callback per rimuovere LIKE all'immobile
const removeLikeImmobile = (req, res) => {
  // Prendo id immobile e id utente dal body della richiesta
  const { id_immobile, id_utente } = req.body;

  // Query per cancellare un certo id dalla tabella cuoricini
  const deleteSql = `DELETE FROM cuoricini WHERE id_immobile = ? AND id_utente = ?`;

  // Invio query
  database.query(deleteSql, [id_immobile, id_utente], (err, result) => {
    // Check errore server
    if (err) return res.status(500).json({ message: "Errore server" });

    // Check like non trovato
    if (result.affectedRows === 0)
      return res.status(400).json({ message: "Nessun like trovato" });

    // Cancellazione corretta del like
    return res.status(200).json({ message: "Like rimosso con successo" });
  });
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
