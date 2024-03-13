import CONSTANTS from "../../constants";

import { getAuth, UserRecord } from "firebase-admin/auth";
import MailService from "./mail.service";

export default class AuthService {
    customer_role: string;
    snipper_role: string;
    mail_service: MailService;

    constructor() {
        this.customer_role = CONSTANTS.SETTINGS.ROLES.CUSTOMER;
        this.snipper_role = CONSTANTS.SETTINGS.ROLES.SNIPPER;
        this.mail_service = new MailService();
    }
    
    #assign_customer_role = (user_id: string) => {
        return this.#customer_auth_instance().setCustomUserClaims(
            user_id,
            {
                [this.customer_role]: true
            }
        );
    }
    
    #assign_snipper_role = (user_id: string) => {
        return this.#snipper_auth_instance().setCustomUserClaims(
            user_id,
            {
                [this.snipper_role]: true,
            }
        );
    }

    #customer_auth_instance = () => {
        const customer_auth_tenant = process.env.CUSTOMER_AUTH_TENANT!;

        return getAuth().tenantManager().authForTenant(
            customer_auth_tenant
        );
    }

    #snipper_auth_instance = () => {
        const snipper_auth_tenant = process.env.SNIPPER_AUTH_TENANT!;

        return getAuth().tenantManager().authForTenant(
            snipper_auth_tenant
        );
    }

    #user_auth_instance = async (user_id: string) => {
        if (await this.is_customer(user_id)) {
            return this.#customer_auth_instance();
        } else if (await this.is_snipper(user_id)) {
            return this.#snipper_auth_instance();
        } else throw new Error('User not found');
    }

    create_user = async (tenant: string, email: string, password: string) => {
        let auth = null;
        let assign_user_role: CallableFunction;

        if (tenant === process.env.SNIPPER_AUTH_TENANT) {
            auth = await this.#snipper_auth_instance();
            assign_user_role = this.#assign_snipper_role;
        } else if (tenant === process.env.CUSTOMER_AUTH_TENANT) {
            auth = await this.#customer_auth_instance();
            assign_user_role = this.#assign_customer_role;
        } else throw new Error('Invalid auth tenant');

        return auth.createUser({
            email: email,
            password: password,
        }).then(async (user: UserRecord) => {
            await assign_user_role(user.uid);
            this.send_verification_email(user.uid, email);
            return user.uid;
        });
    }
    
    is_customer = async (user_id: string) => {
        const is_customer = await this.#customer_auth_instance().getUser(
            user_id
        ).then((user: UserRecord) => user.customClaims?.[this.customer_role]).catch((error) => {
            if (error.code === 'auth/user-not-found') return false;
            throw new Error(error);
        });

        return is_customer;
    }
    
    is_snipper = async (user_id: string) => {
        const is_snipper = await this.#snipper_auth_instance().getUser(
            user_id
        ).then((user: UserRecord) => user.customClaims?.[this.snipper_role]).catch((error) => {
            if (error.code === 'auth/user-not-found') return false;
            throw new Error(error);
        });

        return is_snipper;
    }

    send_password_reset_email = async (user_email: string, auth_tenant: string) => {
        const auth = await getAuth().tenantManager().authForTenant(
            auth_tenant
        );
        
        return auth.generatePasswordResetLink(user_email).then((password_reset_url) => {
            return this.mail_service.send_transactional_email(
                user_email,
                CONSTANTS.SETTINGS.MAIL.TEMPLATES.PASSWORD_RESET,
                { password_reset_url: password_reset_url }
            );
        });
    }

    send_verification_email = async (user_id: string, user_email: string) => {
        const auth = await this.#user_auth_instance(user_id);
        
        return auth.generateEmailVerificationLink(user_email).then((verification_url) => {
            return this.mail_service.send_transactional_email(
                user_email,
                CONSTANTS.SETTINGS.MAIL.TEMPLATES.EMAIL_VERIFICATION,
                { verification_url: verification_url }
            );
        });
    }

    user_exists = async (user_id: string) : Promise<boolean> => {
        const [is_customer, is_snipper] = await Promise.all([
            this.is_customer(user_id),
            this.is_snipper(user_id)
        ]);

        return is_customer || is_snipper;
    }
}