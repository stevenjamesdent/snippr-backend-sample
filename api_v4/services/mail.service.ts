import CONSTANTS from "../../constants";

import sgMail from '@sendgrid/mail';

export default class MailService {
    globals: object;
    send_grid: sgMail.MailService;

    constructor() {
        this.send_grid = sgMail;
        this.send_grid.setApiKey(`SG.${process.env.SENDGRID_MAIL_API_KEY}`);
        this.globals = {
            app_link_snippr_android: CONSTANTS.SETTINGS.URLS.APP_DOWNLOAD.SNIPPR.ANDROID,
            app_link_snippr_biz_android: CONSTANTS.SETTINGS.URLS.APP_DOWNLOAD.SNIPPR_BIZ.ANDROID,
            app_link_snippr_biz_ios: CONSTANTS.SETTINGS.URLS.APP_DOWNLOAD.SNIPPR_BIZ.IOS,
            app_link_snippr_ios: CONSTANTS.SETTINGS.URLS.APP_DOWNLOAD.SNIPPR.IOS,
            company_registration: CONSTANTS.BUSINESS.NOTICES.COMPANY_REG,
            copyright_notice: CONSTANTS.BUSINESS.NOTICES.COPYRIGHT,
        }
    }

    send_mail = (recipient: string, sender = 'contact@snippr.co.uk', subject: string, text: string, html: string | undefined) => {
        return this.send_grid.send({
            to: recipient,
            from: sender,
            subject: subject,
            text: text,
            html: html
        });
    }

    send_submission_response = (recipient: string, recipient_forename: string = 'there') => {
        return this.send_grid.send({
            to: recipient,
            from: {
                email: 'submissions@snippr.co.uk',
                name: 'SNIPPR',
            },
            templateId: CONSTANTS.SETTINGS.MAIL.TEMPLATES.SUBMISSION_RESPONSE,
            dynamicTemplateData: {
                ...this.globals,
                forename: recipient_forename,
            },
        });
    }

    send_transactional_email = (recipient: string, template_id: string, template_data: object = {}) => {
        return this.send_grid.send({
            to: recipient,
            from: {
                email: 'contact@snippr.co.uk',
                name: 'SNIPPR',
            },
            templateId: template_id,
            dynamicTemplateData: {
                ...this.globals,
                forename: 'there',
                ...template_data
            },
        });
    }
}