// Importo file per connessione a db
const database = require("../db_connection");

//--- Callback index immobili ---\\
const showRealEstate = (req, res, next) => {
  // Faccio query per mostrarmi tutti gli immobili
  let sql = `SELECT real_estate.*, type_real_estate.type AS tipo 
             FROM real_estate 
             LEFT JOIN type_real_estate ON real_estate.id_type_real_estate = type_real_estate.id
             `;

  // Filtro ricerca
  const filters = req.query; //prelevo le query string
  const params = []; //verranno aggiunti i valori dei campi
  const conditions = []; //verranno aggiunti i nomi dei campi

  console.log(filters);

  for (const key in req.query) {
    //cicla tutte le chiavi in req.query
    if (key !== "search") {
      //controlla che la chiave sia diversa da search
      conditions.push(`${key} LIKE ?`); //in coditions viene aggiunto il campo da cercare
      params.push(`%${req.query[key]}%`); //in params viene aggiunto il valore del campo
    }
  }
  //console.log("condizioni " +conditions);
  //console.log("parametri " +params);

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`; //concatena le condizioni mettendo un AND tra ciascuna
    //console.log(sql);
  }

  // Invio query al database modificata in base a filtro ricerca
  database.query(sql, params, (err, result) => {
    if (err) return next(new Error(err.message));
    else {
      return res.status(200).json({
        status: "succes",
        data: result,
      });
    }
  });
};

// -------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------

//Callback per vedere i dettagli immobile
const detailRealEstate = (req, res, next) => {
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
    if (err) return next(new Error(err.message));

    if (result.length == 0) {
      return res.status(404).json({ message: "l'immobile non è disponibile" });
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
          name: row.recensore,
          comment: row.commento,
          vote: row.voto,
          days_of_stay: row.giorni_permanenza,
          created_in: row.recensione_creato_in,
        });
      }
    });

    return res.status(200).json(immobile);
  });
};

// -------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------

//--- Callback per salvare un immobile ---\\
const storeRealEstate = (req, res, next) => {
  // Prendo body dal richiesta API (oggetto)
  const {
    owner_email,
    owner_name,
    title,
    description,
    rooms,
    beds,
    bathrooms,
    square_meters,
    city,
    address,
    images,
    id_type_real_estate,
  } = req.body;
  console.log(
    owner_email,
    owner_name,
    title,
    description,
    rooms,
    beds,
    bathrooms,
    square_meters,
    city,
    address,
    images,
    id_type_real_estate
  );

  // Query SQL da inviare al database
  const sqlStore = `INSERT INTO real_estate (slug, owner_email, owner_name, title, description, rooms, beds, bathrooms, square_meters, city, address, images, created_in, id_type_real_estate) 
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?)
  `;

  const slug = title.split(" ").join("-"); // sostituisco gli spazi vuoti con un carattere (in questo caso "-")
  console.log(slug);

  //invio la query al database
  database.query(
    sqlStore,
    [
      slug,
      owner_email,
      owner_name,
      title,
      description,
      rooms,
      beds,
      bathrooms,
      square_meters,
      city,
      address,
      images,
      id_type_real_estate,
    ],
    (err, result) => {
      //gestisco l'errore
      if (err) {
        next(new Error(err.message));
      }
      // Gestisco la risposta se la chiamata al database va correttamente
      return res.status(201).json({
        status: "success",
        message: "l'immobile è stato salvato",
      });
    }
  );
};

// -------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------

//Callback per salvare recensione immobile
const addFeedback = (req, res) => {
  const bodyApi = req.body;

  if (
  !bodyApi.name ||
  !bodyApi.email ||
  !bodyApi.comment ||
  bodyApi.vote === undefined || // Accettiamo 0 come valore valido
  bodyApi.days_of_stay === undefined ||
  bodyApi.id_real_estate === undefined
) {
  return res.status(400).json({ message: "Dati mancanti o non validi" });
}


  const sql = `
    INSERT INTO feedback 
    (name, email, comment, vote, days_of_stay, created_in, id_real_estate) 
    VALUES (?, ?, ?, ?, ?, NOW(), ?);
  `;

  database.query(
    sql,
    [
      bodyApi.name,
      bodyApi.email, // Aggiunto email
      bodyApi.comment,
      bodyApi.vote,
      bodyApi.days_of_stay, // Corretto il nome
      bodyApi.id_real_estate,
    ],
    (err, result) => {
      if (err) {
        console.error("Errore SQL:", err);
        return res.status(500).json({ message: "Errore interno al server" });
      }

      return res.status(201).json({
        message: "Recensione salvata con successo",
      });
    }
  );
};

// Esporto callbacks
module.exports = {
  showRealEstate,
  detailRealEstate,
  storeRealEstate,
  addFeedback,
};
