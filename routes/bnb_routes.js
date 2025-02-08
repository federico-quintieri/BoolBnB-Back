const express = require("express");
const router = express.Router();
const controller = require("../controllers/bnb_controller");

// Endpoint Index
router.get("/", controller.index);

//Endpoint SalvaImmobile
router.post("/", controller.storeImmobile);

//Endpoint per vedere i dettagli
router.get("/:id", controller.detailImmobile);

//Endpoint per salvare la recensione dell'immobile
router.post("/review", controller.reviewImmobile);

//Endpoint per aggiungere like all'immobile
router.post("/addLike", controller.addLikeImmobile);

//Endpoint per rimuovere like all'immobile
router.delete("/removeLike", controller.removeLikeImmobile);

module.exports = router;