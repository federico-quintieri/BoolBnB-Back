Aggiungere un immobile (RF1) → POST /api/immobili
Ricercare un immobile (RF2) → GET /api/immobili
Vedere i dettagli di un immobile (RF3) → GET /api/immobili/{id}
Lasciare una recensione (RF5) → POST /api/immobili/{id}/recensioni
Aggiungere/rimuovere un cuoricino (gradimento) → POST /api/immobili/{id}/cuoricini

Questa dipende da come si imposta...
Inviare un messaggio al proprietario (RF4) → POST /api/immobili/{id}/contatta