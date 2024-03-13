const create_error_response = (code: number, type: string, param: string | undefined, message: string) => ({
    message,
    param,
    status_code: code,
    type,
});

const create_success_response = (code: number, data: Object) => ({
    data,
    status_code: code,
});

export {
    create_error_response,
    create_success_response,
};