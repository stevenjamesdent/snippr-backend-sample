import CONSTANTS from "../../constants";

import AuthService from "./auth.service";
import * as QRCode from "qrcode";

export default class LinkService {
    auth: AuthService;
    apex_domain?: string;

    constructor() {
        this.auth = new AuthService();
        this.apex_domain = process.env.SNIPPR_APEX_DOMAIN;
    }

    #query_string = (params: any) => {
        const query_string = Object.keys(params).map((key) => {
            return `${key}=${params[key]}`;
        }).join('&');

        return query_string?.length ? `?${query_string}` : '';
    }

    get_app_link = (path = '', params = {}, biz: boolean) => {
        const query = this.#query_string(params);

        if (biz === undefined || biz === null) throw new Error('Required parameter biz was undefined, expected boolean');

        return biz ? `https://${CONSTANTS.SETTINGS.URLS.SUBDOMAINS.APPS.SNIPPR_BIZ}.${this.apex_domain}${path}${query}`
            : `https://${CONSTANTS.SETTINGS.URLS.SUBDOMAINS.APPS.SNIPPR}.${this.apex_domain}${path}${query}`;
    }

    get_qr_code = async (data: any, string = false, dark = false) => {
        const options = { color: { dark: dark ? '#2C324A' : '#FFFFFF', light: '#0000' }, margin: 0 }
        const qr_code = string ? await QRCode.toString(data, { type: 'svg', ...options })
                            : await QRCode.toDataURL(data, options);

        return qr_code;
    }

    get_user_shareable = async (user_id: string, params = {}) => {
        const link = await this.get_user_url(user_id, params)

        return {
            qr: await this.get_qr_code(link, true),
            url: link,
        };
    }

    get_user_url = async (user_id: string, params = {}) => {
        const is_customer = await this.auth.is_customer(user_id);
        
        return this.get_app_link(
            '/profile',
            {...params, user: user_id},
            is_customer
        );
    }
}