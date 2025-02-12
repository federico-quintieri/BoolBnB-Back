const express = require("express");
const router = express.Router();
const controller = require("../controllers/bnb_controller");
const upload =require("../middleware/fileUpload")

// Endpoint MostraImmobili
router.get("/", controller.showRealEstate);

//Endpoint SalvaImmobile
router.post("/", controller.storeRealEstate);

//Endpoint per vedere i dettagli
router.get("/:slug", upload.single("image"), controller.detailRealEstate);

//Endpoint per salvare la recensione dell'immobile
router.post("/review/:id", controller.addFeedback);

module.exports = router;