import { MethodNotAllowed } from "../errors";

const method_not_allowed_handler = () => {
    throw new MethodNotAllowed('Method not allowed');
}

export default method_not_allowed_handler;