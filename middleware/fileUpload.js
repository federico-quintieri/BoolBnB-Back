const multer = require("multer");

//setto le impostazioni di salvataggio
const storage =multer.diskStorage({
destination: (req,file,callbackFn) =>{

    //impostazione della posizione del salvataggio del file
    callbackFn(null, "public/images");
},
filename: (req,file ,callbackFn) =>{

    //prendo il nome del file caricato
    const originaleFileName= file.originalname;
    //aggiungo la data per rendere il nome del file unico
    const uniqueName = `${Date.now()}-${originaleFileName}`;
    callbackFn(null, uniqueName);

}   

});

const upload = multer({storage});

module.exports = upload;