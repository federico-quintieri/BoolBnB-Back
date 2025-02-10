// Importo file per connessione a db
const database = require("../db_connection");

//--- Callback index immobili ---\\
const mostraImmobili = (req, res) => {
  // Faccio query per mostrarmi tutti gli immobili
  let sql = `SELECT real_estate.*, type_real_estate.type AS tipo 
             FROM real_estate 
             LEFT JOIN type_real_estate ON real_estate.id_type_real_estate = type_real_estate.id`;

  // Filtro ricerca

  const filters = req.query;
  const params = [];
  const conditions = [];

  if (filters.search) {
    conditions.push(`type_real_estate.type LIKE ?`);
    params.push(`%${filters.search}%`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  // Invio query al database modificata in base a filtro ricerca
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
  const immobileSlug = req.params.slug;
  const sql = `
    SELECT real_estate.*, 
           type_real_estate.type AS tipo, 
           feedback.id AS feedback_id, 
           feedback.name AS recensore, 
           feedback.comment AS commento, 
           feedback.vote AS voto, 
           feedback.days_of_stay AS giorni_permanenza, 
           feedback.created_in AS recensione_creato_in
    FROM real_estate
    LEFT JOIN type_real_estate ON real_estate.id_type_real_estate = type_real_estate.id
    LEFT JOIN feedback ON feedback.id_real_estate = real_estate.id
    WHERE real_estate.slug = ?
  `;

  database.query(sql, [immobileSlug], (err, result) => {
    if (err) return res.status(500).json({ message: "Errore interno al server" });

    if (result.length == 0) {
      return res.status(404).json({ message: "Non c'è id che cerchi" });
    }

    const immobile = {
      id: result[0].id,
      slug: result[0].slug,
      owner_email: result[0].owner_email,
      owner_name: result[0].owner_name,
      title: result[0].title,
      description: result[0].description,
      rooms: result[0].rooms,
      beds: result[0].beds,
      bathrooms: result[0].bathrooms,
      square_meters: result[0].square_meters,
      city: result[0].city,
      address: result[0].address,
      images: result[0].images,
      created_in: result[0].created_in,
      tipo: result[0].tipo,
      recensioni: [],
    };

    result.forEach((row) => {
      if (row.feedback_id) {
        immobile.recensioni.push({
          id: row.feedback_id,
          recensore: row.recensore,
          commento: row.commento,
          voto: row.voto,
          giorni_permanenza: row.giorni_permanenza,
          recensione_creato_in: row.recensione_creato_in,
        });
      }
    });

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
