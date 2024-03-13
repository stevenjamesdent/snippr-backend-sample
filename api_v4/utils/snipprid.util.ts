import CONSTANTS from "../../constants";

import AuthService from '../services/auth.service';

export default class SnipprID {
    auth: AuthService;
    id_characters: string;
    prefix: string | undefined;
    temp_suffix: string;

    constructor(prefix?: string) {
        this.auth = new AuthService();
        this.id_characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        this.prefix = prefix;
        this.temp_suffix = '__TEMP';
    }

    auth_id = (user_id: string) => {
        const customer_pattern = new RegExp(`^${CONSTANTS.SETTINGS.UUIDS.CUSTOMER}_`);
        const snipper_pattern = new RegExp(`^${CONSTANTS.SETTINGS.UUIDS.SNIPPER}_`);

        if (customer_pattern.test(user_id)) {
            return user_id.replace(customer_pattern, '');
        } else if (snipper_pattern.test(user_id)) {
            return user_id.replace(snipper_pattern, '');
        } else return user_id;
    }

    generate_filename = (dirname?: string | null) => {
        if (!this.prefix) {
            throw new Error('Prefix required in SnipprID Instantiation to generate filename');
        }

        return `${this.prefix}_${dirname ? dirname + '_' : ''}${this.random_uuid()}`;
    }
    
    generate_id = (cipher_string: string | null = null, temp: boolean = false) => {
        if (!this.prefix) {
            throw new Error('Prefix required in SnipprID Instantiation to generate ID');
        }

        const uuid = cipher_string ? this.string_to_uuid(cipher_string) : this.random_uuid();

        return `${this.prefix}_${uuid}${temp ? this.temp_suffix : ''}`;
    }

    is_temp = (id: string) => {
        return id.endsWith(this.temp_suffix)
    }

    random_uuid = (length: number = 30, prefix: string | null = null) => {
        let uuid = '';

        for (let i = 0; i < length; i++) {
            uuid += this.id_characters.charAt(
                Math.floor(Math.random() * this.id_characters.length)
            );
        }

        return prefix ? prefix + uuid : uuid;
    }

    string_to_uuid = (string: string) => {
        const base64_string = Buffer.from(string, 'utf8').toString('base64');
        const sanitised_string = base64_string?.match(/([0-9a-zA-Z ])/g)?.join('') ?? null;
        
        return sanitised_string;
    }

    user_id = async (user_auth_id: string) => {
        if (process.env.FUNCTIONS_EMULATOR === 'true') {
            return user_auth_id;
        } else if (await this.auth.is_customer(user_auth_id)) {
            return `${CONSTANTS.SETTINGS.UUIDS.CUSTOMER}_${user_auth_id}`;
        } else if (await this.auth.is_snipper(user_auth_id)) {
            return `${CONSTANTS.SETTINGS.UUIDS.SNIPPER}_${user_auth_id}`;
        } else {
            throw new Error('User is not assigned a valid role');
        }
    }
}