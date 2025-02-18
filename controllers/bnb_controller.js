// Importo file per connessione a db
const { log } = require("console");
const database = require("../db_connection");
const dns = require("dns"); // Importa il modulo 'dns' di Node.js, che permette di eseguire ricerche DNS

//--- Callback index immobili ---\\
const showRealEstate = (req, res, next) => {
  let sql = `SELECT real_estate.*, type_real_estate.type AS tipo 
             FROM real_estate 
             LEFT JOIN type_real_estate ON real_estate.id_type_real_estate = type_real_estate.id`;

  // Filtro ricerca
  const filters = req.query;
  const params = [];
  const conditions = [];

  console.log(filters);

  for (const key in req.query) {
    if (key !== "search") {
      conditions.push(`${key} LIKE ?`);
      params.push(`%${req.query[key]}%`);
    }
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  database.query(sql, params, (err, result) => {
    if (err) return next(new Error(err.message));

    const data = result.map((immobile) => {
      // Converte la colonna delle immagini in un array
      const images = immobile.images ? immobile.images.split(",") : [];
      return {
        ...immobile,
        images, // Aggiunge l'array di immagini
      };
    });

    return res.status(200).json({
      status: "success",
      data: data,
    });
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
      images: result[0].images ? result[0].images.split(",") : [], // Converte la colonna delle immagini in un array
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
  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "È necessario caricare almeno un'immagine",
    });
  }

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
    id_type_real_estate,
  } = req.body;

  console.log(req.body);

  // Create array of image names
  const imageNames = req.files.map((file) =>
    file.filename.split(" ").join("-")
  );

  // Validation checks
  const validationErrors = [];

  if (!owner_email.includes("@") || owner_email.includes(" ")) {
    validationErrors.push("L'email inserita non è valida");
  }

  if (owner_name.trim().length < 1) {
    validationErrors.push("Il nome inserito non è valido");
  }

  if (title.trim().length < 3) {
    validationErrors.push("Il titolo deve contenere almeno 3 caratteri");
  }

  // Add other validation checks...

  // If there are validation errors, return them
  if (validationErrors.length > 0) {
    return res.status(400).json({
      status: "fail",
      message: validationErrors.join(", "),
    });
  }

  // Check if type exists
  const sqlFindType = `
    SELECT id FROM type_real_estate WHERE id = ?
  `;

  database.query(sqlFindType, [id_type_real_estate], (err, result) => {
    if (err) return next(new Error(err.message));

    if (!result.length) {
      return res.status(400).json({
        status: "fail",
        message: "Tipologia immobile non valida",
      });
    }

    // If type exists, proceed with insertion
    const slug = title.toLowerCase().split(" ").join("-");

    const sqlStore = `
      INSERT INTO real_estate (
        slug, owner_email, owner_name, title, description, 
        rooms, beds, bathrooms, square_meters, city, 
        address, images, created_in, id_type_real_estate
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    `;

    // Join image names with a separator (e.g., comma)
    const imagesString = imageNames.join(",");

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
        imagesString,
        id_type_real_estate,
      ],
      (err, result) => {
        if (err) return next(new Error(err.message));

        return res.status(201).json({
          status: "success",
          message: "Immobile salvato con successo",
        });
      }
    );
  });
};

// -------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------

//Callback per salvare recensione immobile
const addFeedback = (req, res) => {
  const { name, email, comment, vote, days_of_stay, id_real_estate } = req.body;
  console.log(name, email, comment, vote, days_of_stay, id_real_estate);

  //validazioni

  if (name.trim().length < 3) {
    res.status(400).json({
      status: "fail",
      message: "nome non valido, inserire almeno 3 caratteri",
    });
  }

  if (!email.includes("@")) {
    res.status(400).json({
      status: "fail",
      message: "l'email inserita non è valida",
    });
  }

  if (comment.trim().length < 8) {
    res.status(400).json({
      status: "fail",
      message: "il commento non è valido, inserire almeno 8 caratteri",
    });
  }

  if (vote < 0 || vote > 5) {
    res.status(400).json({
      status: "fail",
      message: "valutazione non valida",
    });
  }

  if (comment.trim().length < 8) {
    res.status(400).json({
      status: "fail",
      message: "descrizione non valida, inserire almeno 8 caratteri",
    });
  }

  //controllo se la tipologia di casa esiste
  const sqlFindIdEstate = `
          SELECT *
          FROM real_estate
          WHERE real_estate.id = ?`;

  database.query(sqlFindIdEstate, [id_real_estate], (err, result) => {
    //gestisco l'errore
    if (err) {
      next(new Error(err.message));
    }

    if (result[0] === undefined) {
      res.status(400).json({
        status: "fail",
        message: "immobile inesistente, inserirne un'altro",
      });
    }
    console.log(result[0].id);
  });

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
      days_of_stay, //Corretto il nome
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
