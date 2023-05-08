class ErrorHandler extends Error {
    constructor(message,statusCode){
        super(message);
        this.statusCode = statusCode; //as statuscode is not in error class we are creating our own class
    }
}

export default ErrorHandler;