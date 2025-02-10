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
        COUNT(c.id) AS numero_like,
        r.id AS recensione_id,
        r.nome AS recensore,
        r.commento,
        r.voto,
        r.giorni_permanenza,
        r.creato_in AS recensione_creato_in,
        r.id_utente_interessato
    FROM immobili i
    LEFT JOIN recensioni r ON i.id = r.id_immobile
    LEFT JOIN cuoricini c ON i.id = c.id_immobile
    WHERE i.id = ?
    GROUP BY i.id, r.id;
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
