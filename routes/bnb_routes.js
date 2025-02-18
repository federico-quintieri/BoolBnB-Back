const express = require("express");
const router = express.Router();
const controller = require("../controllers/bnb_controller");
const upload =require("../middleware/fileUpload")

// Endpoint MostraImmobili
router.get("/", controller.showRealEstate);

//Endpoint SalvaImmobile
router.post("/", upload.single("images"), controller.storeRealEstate);

//salva più immagini
router.post("/images", upload.array("images", 5), (req, res) => {
    try {
      res.json({ message: "Immagini caricate con successo!", files: req.files });
    } catch (error) {
      res.status(500).json({ error: "Errore durante il caricamento" });
    }
  });

//Endpoint per vedere i dettagli
router.get("/:slug",  controller.detailRealEstate);

//Endpoint per salvare la recensione dell'immobile
router.post("/review/:id", controller.addFeedback);

module.exports = router;