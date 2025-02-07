const express = require("express");
const router = express.Router();
const controller = require("../controllers/bnb_controller");

// Endpoint Index
router.get("/", controller.index);


module.exports = router;