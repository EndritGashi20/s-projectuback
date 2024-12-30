class HttpError extends Error {
    constructor(message, errorCode){
     super(message);//add a 'Message' property
     this.code = errorCode; //Add a "code" property
    }
}

module.exports = HttpError;