// Per usare le variabili d'ambiente
require('dotenv').config();
// Importiamo dipendenze
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT;
const bnb_router = require("./routes/bnb_routes");
// Sono del branch Rotte_Base
app.use(
    cors({
      origin: process.env.URL_FRONT, // Sostituisci con il dominio del tuo frontend
    })
  );

// Middleware per convertire in JSON il body
app.use(express.json());

// Definizione Rotte
app.use("/immobili", bnb_router);

// Mettiamo in ascolto il server
app.listen(port, () => {

    console.log(`Sono in ascolto alla porta numero ${port}`)

});
