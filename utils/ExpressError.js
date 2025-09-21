class ExpressError extends Error{
    constructor(status, message){
        super(message);
        this.status = status;
        // this.message = message;
        // this.name = "ExpressError";
    }
}

module.exports = ExpressError;