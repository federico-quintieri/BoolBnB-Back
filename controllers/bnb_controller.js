// Importo file per connessione a db
const { log } = require("console");
const database = require("../db_connection");
const dns = require("dns"); // Importa il modulo 'dns' di Node.js, che permette di eseguire ricerche DNS

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
  const { owner_email, owner_name, title, description, rooms, beds, bathrooms, square_meters, city, address, id_type_real_estate } = req.body;

  const imageName = req.file.filename.split(" ").join("-");
  console.log("email " + owner_email);

  console.log(owner_email, owner_name, title, description, rooms, beds, bathrooms, square_meters, city, address, id_type_real_estate, imageName);

  //funzione che controlla se il dominio della mail è valido
  function verifyEmailDomain(email) {
    return new Promise((resolve, reject) => {
      // Estrae il dominio dall'email prendendo tutto dopo "@"
      const domain = email.split('@')[1];

      // Controlla se il dominio è presente
      if (!domain) {
        return resolve(false); // Email senza dominio non valida
      }

      // Usa il metodo resolveMx per ottenere i record MX del dominio
      dns.resolveMx(domain, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          return resolve(false); // Se c'è un errore o non ci sono record MX, il dominio non è valido
        }
        resolve(true); // Il dominio è valido perché ha record MX
      });
    });
  }

  //validazione dei dati
  if (!owner_email.includes("@") || owner_email.includes(" ")) {
    res.status(400).json({
      status: "fail",
      message: "l'email inserita non è valida"
    })
  }

  verifyEmailDomain(owner_email)
    .then(isValid => console.log(isValid ? "Dominio valido" : "Dominio non valido"))
    .catch(err => console.error("Errore:", err));


  if (owner_name.trim().length < 1) {
    res.status(400).json({
      status: "fail",
      message: "il nome inserita non è valida"
    })
  }

  if (title.trim().length < 3) {
    res.status(400).json({
      status: "fail",
      message: "titolo non valido, inserire almeno 3 caratteri"
    })
  }

  if (description.trim().length < 8) {
    res.status(400).json({
      status: "fail",
      message: "descrizione non valida, inserire almeno 8 caratteri"
    })
  }

  if (rooms < 1) {
    res.status(400).json({
      status: "fail",
      message: "deve essere presente almeno una stanza"
    })
  }

  if (beds < 1) {
    res.status(400).json({
      status: "fail",
      message: "deve essere presente almeno un letto"
    })
  }

  if (bathrooms < 1 && bathrooms > rooms) {
    res.status(400).json({
      status: "fail",
      message: "deve essere presente almeno un bagno (anche se in comune con altri)"
    })
  }

  if (square_meters < 9) {
    res.status(400).json({
      status: "fail",
      message: "la stanza deve essere di almeno 9 metri quadri"
    })
  }

  if (city.trim().length < 1) {
    res.status(400).json({
      status: "fail",
      message: "inserire il nome della città"
    })
  }

  if (address.trim().length < 4) {
    res.status(400).json({
      status: "fail",
      message: "indirizzo non valido"
    })
  }

  if (imageName === "undefined") {
    res.status(400).json({
      status: "fail",
      message: "immagine non valida"
    })
  }

  //controllo se la tipologia di casa esiste
  const sqlFindType = `
          SELECT *
          FROM type_real_estate
          WHERE type_real_estate.id = ?`

  database.query(
    sqlFindType, [id_type_real_estate],
    (err, result) => {

      //gestisco l'errore
      if (err) {
        next(new Error(err.message));
      }

      if (result[0] === undefined) {
        res.status(400).json({
          status: "fail",
          message: "tipologia inesistente inseriscine un'altra"
        })
      }

      console.log(result[0]);
    })




  // Query SQL da inviare al database
  const sqlStore = `INSERT INTO real_estate (slug, owner_email, owner_name, title, description, rooms, beds, bathrooms, square_meters, city, address, images, created_in, id_type_real_estate) 
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?)
  `;

  const slug = title.split(" ").join("-"); // sostituisco gli spazi vuoti con un carattere (in questo caso "-")


  //invio la query al database
  database.query(
    sqlStore,
    [slug, owner_email, owner_name, title, description, rooms, beds, bathrooms, square_meters, city, address, imageName, id_type_real_estate],
    (err, result) => {
      //gestisco l'errore
      if (err) {
        next(new Error(err.message));
      }
      //Gestisco la risposta se la chiamata al database va correttamente
      return res.status(201).json({
        status: "success",
        message: "l'immobile è stato salvato",
      });
    })

};

// -------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------

//Callback per salvare recensione immobile
const addFeedback = (req, res) => {

  const { name, email, comment, vote, days_of_stay, id_real_estate } = req.body
  console.log(name, email, comment, vote, days_of_stay, id_real_estate);

  //validazioni

  if (name.trim().length < 3) {
    res.status(400).json({
      status: "fail",
      message: "nome non valido, inserire almeno 3 caratteri"
    })
  }

  if (!email.includes("@")) {
    res.status(400).json({
      status: "fail",
      message: "l'email inserita non è valida"
    })
  }

  if (comment.trim().length < 8) {
    res.status(400).json({
      status: "fail",
      message: "il commento non è valido, inserire almeno 8 caratteri"
    })
  }

  if (vote < 0 || vote > 5) {
    res.status(400).json({
      status: "fail",
      message: "valutazione non valida"
    })
  }

  if (comment.trim().length < 8) {
    res.status(400).json({
      status: "fail",
      message: "descrizione non valida, inserire almeno 8 caratteri"
    })
  }

  //controllo se la tipologia di casa esiste
  const sqlFindIdEstate = `
          SELECT *
          FROM real_estate
          WHERE real_estate.id = ?`

  database.query(
    sqlFindIdEstate, [id_real_estate],
    (err, result) => {

      //gestisco l'errore
      if (err) {
        next(new Error(err.message));
      }

      if (result[0] === undefined) {
        res.status(400).json({
          status: "fail",
          message: "immobile inesistente, inserirne un'altro"
        })
      }
      console.log(result[0].id);
    })


  const sql = `
    INSERT INTO feedback 
    (name, email, comment, vote, days_of_stay, created_in, id_real_estate) 
    VALUES (?, ?, ?, ?, ?, NOW(), ?);
  `;

  database.query(
    sql,
    [
      name,
      email, // Aggiunto email
      comment,
      vote,
      days_of_stay,  //Corretto il nome
      id_real_estate,
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
