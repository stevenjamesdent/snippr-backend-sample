import CONSTANTS from "../../constants";

import Stripe from "stripe";

// @ts-ignore
const stripe = new Stripe(process.env.STRIPE_SECRET!, { typescript: true });

import LinkService from "./link.service";
import { User } from "../../types/types.user";

export default class StripeService {
    link_service: LinkService;

    constructor() {
        this.link_service = new LinkService();
    }
    
    /**
     * Constructs a Stripe Event Object from the raw request data passed by webhooks functions (events are signed/authenticated).
     * @param {string} request - The request data from the webhook endpoint POST request.
     * @param {string} SIGNING_SECRET - The signing secret associated with the originating Webhook (see Stripe dashboard).
     * @return {Object} The Stripe Event Object.
     * 
     */
    construct_stripe_event = (request: any, SIGNING_SECRET: string) => {
        return stripe.webhooks.constructEvent(
            request.rawBody,
            request.headers['stripe-signature'].toString(),
            SIGNING_SECRET
        );
    }

    /**
     * Creates an 'express' connected account in Stripe and returns the stripe account ID.
     * @return {Object} The Stripe Account object
     * 
     */
    create_stripe_account = async (user_id: string, user_data: User) => {
        if (!user_id) throw new Error('User ID is required to create a Stripe account');

        const profile_url = await this.link_service.get_user_url(user_id);

        // @ts-ignore
        return stripe.accounts.create({
            business_profile: {
                name: user_data?.[CONSTANTS.FIELDS.USERS.DISPLAY_NAME] ?? null,
                url: profile_url ?? null,
            },
            email: user_data?.[CONSTANTS.FIELDS.USERS.EMAIL] ?? null,
            type: 'express',
            metadata: {
                environment: process.env.ENVIRONMENT,
                user_id: user_id,
            }
        });
    }

    /**
     * Creates a URL used to access the Stripe Payments Dashboard
     * @param {string} stripe_account_id - The ID of the Stripe Account.
     * @return {string} a URL for the Stripe Payments Dashboard.
     * 
     */
    create_stripe_account_dashboard_url = async (stripe_account_id: string) => {
        return stripe.accounts.createLoginLink(stripe_account_id);
    }

    /**
     * Creates a URL for the Stripe User Onboarding Flow for the supplied Stripe Account ID
     * @param {string} stripe_account_id - The ID of the Stripe Account.
     * @return {string} a URL for the Stripe Onboarding Flow.
     * 
     */
    create_stripe_account_onboarding_url = async (stripe_account_id: string) => {
        return stripe.accountLinks.create({
            account: stripe_account_id,
            collect: 'eventually_due',
            refresh_url: this.link_service.get_app_link('/payment-settings', { action: 'reauth' }, true),
            return_url: this.link_service.get_app_link('/payment-settings', { action: 'return' }, true),
            type: 'account_onboarding',
        });
    }
    
    /**
     * Creates a Stripe Customer used to track/save payments, payment methods, etc.
     * @return {JSON} The Stripe Customer object.
     * 
     */
    create_stripe_customer = async (user_id: string, user_data: User) => {
        if (!user_id) throw new Error('User ID is required to create a Stripe customer');

        return stripe.customers.create({
            // @ts-ignore
            email: user_data?.[CONSTANTS.FIELDS.USERS.EMAIL] ?? null,
            metadata: {
                environment: process.env.ENVIRONMENT,
                user_id: user_id,
            },
            name: user_data ? `${user_data?.[CONSTANTS.FIELDS.USERS.FORENAME]} ${user_data?.[CONSTANTS.FIELDS.USERS.SURNAME]}` : null,
        });
    }

    /**
     * Creates a Stripe Ephemeral Key for the Stripe Customer associated with the given user.
     * @param {string} stripe_customer_id - The id of the Stripe Customer for which the key should be created.
     * @return {JSON} The Stripe Ephemeral Key object.
     * 
     */
    create_stripe_customer_ephemeral_key = async (stripe_customer_id: string) => {
        return stripe.ephemeralKeys.create(
            {customer: stripe_customer_id},
            {apiVersion: '2020-08-27'},
        );
    }

    /**
     * Creates a Stripe payment intent for the specified amount (does not take the payment)
     * @param {string} stripe_customer_id - The id of the Stripe Customer for which the payment intent should be created.
     * @param {number} amount - The amount (IN PENCE) of the intended payment, e.g. £1.00 would be 100
     * @param {number} snippr_commission_amount - The amount (IN PENCE) of the intended commission fee (routed to SNIPPR account), e.g. £1.00 would be 100
     * @param {string} stripe_account_id - The Stripe Account ID to which the payment should be routed.
     * @param {string} receipt_email - An email address to which the receipt for the Payment Intent should be sent.
     * @param {Object} metadata - Optional metadata in key:value pairs to be stored against the PaymentIntent
     * @return {JSON} The Stripe Payment Intent object.
     * 
     */
    create_stripe_payment_intent = async (stripe_customer_id: string, amount: number, snippr_commission_amount: number, stripe_account_id: string, receipt_email: string | null = null, metadata: any | null = null) => {
        return stripe.paymentIntents.create({
            amount: amount,
            application_fee_amount: snippr_commission_amount,
            automatic_payment_methods: {
                enabled: true
            },
            currency: 'gbp',
            customer: stripe_customer_id,
            metadata: {
                ...(metadata ?? {}),
                environment: process.env.ENVIRONMENT!,
            },
            // @ts-ignore
            receipt_email: receipt_email,
            transfer_data: {
                destination: stripe_account_id
            },
        });
    }

    /**
     * Gets the specified Stripe Account
     * @param {string} stripe_account_id - The id of the Stripe Account to be retrieved.
     * @return {JSON} The Stripe Account object.
     * 
     */
    get_stripe_account = async (stripe_account_id: string) => {
        return stripe.accounts.retrieve(stripe_account_id);
    }

    /**
     * Gets the specified Stripe Customer
     * @param {string} stripe_customer_id - The id of the Stripe Customer to be retrieved.
     * @return {JSON} The Stripe Customer object.
     * 
     */
    get_stripe_customer = async (stripe_customer_id: string) => {
        return stripe.customers.retrieve(stripe_customer_id);
    }

    /**
     * Gets the Stripe Payment Intent object.
     * @param {string} payment_intent_id - The id of the Payment Intent to be retrieved.
     * @return {JSON} The Stripe Payment Intent object.
     * 
     */
    get_stripe_payment_intent = async (payment_intent_id: string) => {
        return stripe.paymentIntents.retrieve(payment_intent_id);
    }

    /**
     * Issues a refund of the specified amount for the specified payment intent, this action is irreversible.
     * @param {string} payment_intent_id - The Stripe ID of the payment intent to be refunded.
     * @param {number} refund_amount - The amount (IN PENCE) of the intended refund, e.g. £1.00 would be 100. May not exceed the original payment amount, if unspecified a full refund will be issued.
     * @param {boolean} refund_app_fee - Should the associated application fee (commission) be refunded to the connected account?
     * @return {JSON} FOOBAR FOOBAR FOOBAR FOOBAR
     * 
     */
    issue_stripe_refund = async (payment_intent_id: string, refund_amount: number, refund_app_fee = false) => {
        return stripe.refunds.create({
            amount: refund_amount,
            payment_intent: payment_intent_id,
            refund_application_fee: refund_app_fee,
            reverse_transfer: true,
        });
    }
    
    /**
     * Updates an existing Stripe payment intent with the specified amount and application fee (commission amount)
     * @param {string} payment_intent_id - The Stripe ID of the payment intent to be updated.
     * @param {number} amount - The amount (IN PENCE) of the intended payment, e.g. £1.00 would be 100
     * @param {number} snippr_commission_amount - The amount (IN PENCE) of the intended commission fee (routed to SNIPPR account), e.g. £1.00 would be 100
     * @return {JSON} The updated Stripe Payment Intent object.
     * 
     */
    update_stripe_payment_intent = async (payment_intent_id: string, amount: number, snippr_commission_amount: number) => {
        return stripe.paymentIntents.update(payment_intent_id, {
            amount: amount,
            application_fee_amount: snippr_commission_amount,
        });
    }
}