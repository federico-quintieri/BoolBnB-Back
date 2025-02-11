const errorHandler = (req, res, err, next) => {
    const resObj = {
        status: "fail",
        message: err.message
    };

    if(process.env.ENVIRONMENT = "development"){
        resObj.detail = err.stack;
    };

    return res.status(500).json(resObj);
}

module.exports = errorHandler;