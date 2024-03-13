export default class BaseError extends Error {
    type: string;
    statusCode: number;

    constructor(type: string, code: number, message: string) {
        super();
        this.type = type;
        this.statusCode = code;
        this.message = message;
    }
}