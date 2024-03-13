import CONSTANTS from "../../../constants";

import Repo from "./repo";
import SnipprID from "../../utils/snipprid.util";
import { PaymentConfig } from "../../../types/types.payment";
import { PaymentFailed } from "../../errors";
import { Snip } from "../../../types/types.snip";
import { User } from "../../../types/types.user";
import Currency from "../../utils/currency.util";
import Refunds from "../../utils/refunds.util";
import StripeService from "../../services/stripe.service";

export default class Service {
    repo: Repo;
    snippr_id: SnipprID;
    currency: Currency;
    stripe: StripeService;

    constructor() {
        this.repo = new Repo();
        this.snippr_id = new SnipprID(CONSTANTS.SETTINGS.UUIDS.PAYMENT);
        this.currency = new Currency();
        this.stripe = new StripeService();
    }

    #id = (stripe_payment_intent_id: string) => {
        return this.snippr_id.generate_id(stripe_payment_intent_id);
    }

    #calculate_stripe_fee = (payment_amount_gbx: number) => {
        return this.currency.sum([
            this.currency.percentage(payment_amount_gbx, CONSTANTS.SETTINGS.PAYMENTS.FEES.STRIPE_FEE.DECIMAL),
            CONSTANTS.SETTINGS.PAYMENTS.FEES.STRIPE_FEE.FIXED_GBX
        ]);
    }

    add_checkout_metadata = (stripe_payment_intent_id: string, metadata: Object) => {
        return this.repo.update(
            this.#id(stripe_payment_intent_id),
            {
                [CONSTANTS.FIELDS.PAYMENTS.CHECKOUT_METADATA]: metadata
            }
        );
    }
    
    get_receipts = (payment_config: PaymentConfig, breakdown: any) => {
        const customer_receipt = breakdown ? this.generate_receipt(
            breakdown,
            [{amount: payment_config.customer_fee, FEE: CONSTANTS.SETTINGS.PAYMENTS.FEES.CUSTOMER_COMMISSION}],
        ) : null;

        const snipper_receipt = breakdown ? this.generate_receipt(
            breakdown,
            [
                {amount: payment_config.snipper_fee, FEE: CONSTANTS.SETTINGS.PAYMENTS.FEES.SNIPPER_COMMISSION},
                {amount: payment_config.stripe_fee, FEE: CONSTANTS.SETTINGS.PAYMENTS.FEES.STRIPE_FEE},
            ]
        ) : null;

        return [customer_receipt, snipper_receipt];
    }
    
    create_payment = async (base_amount_gbx: number, type: string, customer: User, snipper: User, breakdown: any, metadata = {}) => {
        const payment_config = await this.get_payment_config(base_amount_gbx, type);
        const [customer_receipt, snipper_receipt] = this.get_receipts(payment_config, breakdown);
        const stripe_payment_intent = await this.stripe.create_stripe_payment_intent(
            customer[CONSTANTS.FIELDS.USERS.STRIPE_ID],
            payment_config.amount,
            payment_config.total_fee,
            snipper[CONSTANTS.FIELDS.USERS.STRIPE_ID],
            customer[CONSTANTS.FIELDS.USERS.EMAIL],
            { ...metadata, snipper_value: payment_config.snipper_transfer_amount, type: payment_config.type }
        );

        return this.repo.create(
            this.#id(stripe_payment_intent.id),
            {
                [CONSTANTS.FIELDS.PAYMENTS.CONFIG]: payment_config,
                [CONSTANTS.FIELDS.PAYMENTS.CUSTOMER_ID]: customer.id,
                [CONSTANTS.FIELDS.PAYMENTS.CUSTOMER_RECEIPT]: customer_receipt,
                [CONSTANTS.FIELDS.PAYMENTS.PAYMENT_INTENT]: stripe_payment_intent.id,
                [CONSTANTS.FIELDS.PAYMENTS.SNIPPER_ID]: snipper.id,
                [CONSTANTS.FIELDS.PAYMENTS.SNIPPER_RECEIPT]: snipper_receipt,
                [CONSTANTS.FIELDS.PAYMENTS.STRIPE_ACCOUNT]: snipper[CONSTANTS.FIELDS.USERS.STRIPE_ID],
                [CONSTANTS.FIELDS.PAYMENTS.STRIPE_CUSTOMER]: customer[CONSTANTS.FIELDS.USERS.STRIPE_ID],
                [CONSTANTS.FIELDS.PAYMENTS.TYPE]: payment_config.type,
            }
        ).then(async () => {
            return {
                [CONSTANTS.FIELDS.PAYMENTS.CUSTOMER_RECEIPT]: customer_receipt,
                [CONSTANTS.FIELDS.PAYMENTS.SNIPPER_RECEIPT]: snipper_receipt,
                config: payment_config,
                id: this.#id(stripe_payment_intent.id),
                secrets: await this.get_stripe_secrets(stripe_payment_intent.id),
            };
        });
    }

    estimate_total_refunds = async (payment_ids: string[], initiator_user_id: string) => {
        const refunds = await Promise.all(payment_ids.map((payment_id) => this.get_refund_config(
            payment_id,
            initiator_user_id
        )));

        return this.currency.format(
            this.currency.sum(
                refunds.map((refund_config) => refund_config.refund_amount)
            )
        );
    }

    get_fee = (base_gbx: number, FEE: any) => {
        const predicted_fee = this.currency.percentage(base_gbx, FEE.DECIMAL);
        const actual_fee = FEE.MIN_GBX ? this.currency.largest([predicted_fee, FEE.MIN_GBX]) : predicted_fee;
        
        return FEE.CAP_GBX ? this.currency.smallest([actual_fee, FEE.CAP_GBX]) : actual_fee;
    }

    get_payment = (payment_id: string) => {
        return this.repo.get(
            payment_id
        );
    }

    get_payment_config = (base_amount_gbx: number, payment_type: string | null = null) : PaymentConfig => {
        const is_gratuity = payment_type === CONSTANTS.TERMS.PAYMENTS.TYPES.TIP;
        const customer_fee = is_gratuity ? 0 : this.get_fee(base_amount_gbx, CONSTANTS.SETTINGS.PAYMENTS.FEES.CUSTOMER_COMMISSION);
        const snipper_fee = is_gratuity ? 0 : this.get_fee(base_amount_gbx, CONSTANTS.SETTINGS.PAYMENTS.FEES.SNIPPER_COMMISSION);
        const payment_amount = this.currency.sum([base_amount_gbx, customer_fee]);
        const total_fee = this.currency.sum([customer_fee, snipper_fee]);
        const stripe_fee = this.#calculate_stripe_fee(payment_amount);

        return {
            amount: payment_amount,
            base_price: base_amount_gbx,
            customer_fee: customer_fee,
            snipper_fee: snipper_fee,
            snipper_transfer_amount: this.currency.subtract(
                payment_amount,
                this.currency.sum([total_fee, stripe_fee])
            ),
            stripe_fee: stripe_fee,
            total_fee: total_fee,
            type: payment_type,
        };
    }

    get_tip_config = async (snip_data: Snip) => {
        const original_payment = await this.get_payment(snip_data[CONSTANTS.FIELDS.SNIPS.PAYMENT_ID]);
        const payment_config = original_payment[CONSTANTS.FIELDS.PAYMENTS.CONFIG];

        return CONSTANTS.SETTINGS.PAYMENTS.TIPS.PERCENTAGE_AMOUNTS.map((DECIMAL) => {
            return {
                amount: this.currency.percentage(payment_config.snipper_transfer_amount, DECIMAL),
                percentage: DECIMAL,
            }
        })
    }

    generate_receipt = (payment_breakdown: any, adjustments: any | null = null) => {
        const base_total = payment_breakdown.price;
        const addition_amounts: any[] = [];
        const deduction_amounts: any[] = [];

        adjustments && adjustments.forEach((adjustment: any) => {
            if (adjustment.FEE.DEDUCTIVE) {
                deduction_amounts.push(adjustment.amount);
            } else {
                addition_amounts.push(adjustment.amount);
            }
        });

        const additions_total = this.currency.sum(addition_amounts);
        const deductions_total = this.currency.sum(deduction_amounts);
        
        return {
            adjustments: adjustments,
            summary: payment_breakdown,
            total: this.currency.subtract(
                this.currency.sum([base_total, additions_total]),
                deductions_total
            ),
        };
    }

    get_refund_config = async (payment_id: string, initiator_user_id: string) => {
        const payment = await this.get_payment(payment_id);
        const refund_helper = new Refunds(payment, initiator_user_id);

        return refund_helper.get_config();
    }
    
    get_stripe_secrets = async (stripe_payment_intent_id: string) => {
        const payment_intent: any = await this.stripe.get_stripe_payment_intent(
            stripe_payment_intent_id
        );
        
        return this.stripe.create_stripe_customer_ephemeral_key(
            payment_intent.customer
        ).then((ephemeral_key) => {
            return {
                stripe_customer_ephemeral_key: ephemeral_key.secret,
                stripe_customer_id: payment_intent.customer,
                stripe_payment_intent_id: payment_intent.id,
                stripe_payment_intent_secret: payment_intent.client_secret,
                stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
            };
        });
    }

    handle_payment_failed = async (payment_intent: any) => {
        await this.repo.update(
            this.#id(payment_intent.id),
            { [CONSTANTS.FIELDS.PAYMENTS.STATUS]: CONSTANTS.TERMS.PAYMENTS.STATUSES.FAILED }
        );

        throw new PaymentFailed('Payment failed');
    }

    handle_payment_succeeded = async (payment_id: string, fulfillment_datetime: Date) => {
        const payment = await this.get_payment(payment_id);
        const checkout_timestamp = payment[CONSTANTS.FIELDS.PAYMENTS.CHECKOUT_TIMESTAMP] ?? new Date();

        return this.repo.update(
            payment_id,
            {
                [CONSTANTS.FIELDS.PAYMENTS.CHECKOUT_TIMESTAMP]: checkout_timestamp,
                [CONSTANTS.FIELDS.PAYMENTS.FULFILLMENT_DATETIME]: fulfillment_datetime,
                [CONSTANTS.FIELDS.PAYMENTS.STATUS]: CONSTANTS.TERMS.PAYMENTS.STATUSES.SUCCEEDED,
            }
        ).then(() => payment);
    }
    
    update_payment = async (payment_id: string, base_amount_gbx: number, breakdown: any) => {
        const payment = await this.get_payment(payment_id);
        const payment_config = this.get_payment_config(base_amount_gbx, payment[CONSTANTS.FIELDS.PAYMENTS.TYPE]);
        const [customer_receipt, snipper_receipt] = this.get_receipts(payment_config, breakdown);
        return this.stripe.update_stripe_payment_intent(
            payment[CONSTANTS.FIELDS.PAYMENTS.PAYMENT_INTENT],
            payment_config.amount,
            payment_config.total_fee
        ).then(async () => {
            await this.repo.update(
                payment_id,
                {
                    [CONSTANTS.FIELDS.PAYMENTS.CONFIG]: payment_config,
                    [CONSTANTS.FIELDS.PAYMENTS.CUSTOMER_RECEIPT]: customer_receipt,
                    [CONSTANTS.FIELDS.PAYMENTS.SNIPPER_RECEIPT]: snipper_receipt,
                }
            );

            return {
                [CONSTANTS.FIELDS.PAYMENTS.CUSTOMER_RECEIPT]: customer_receipt,
                [CONSTANTS.FIELDS.PAYMENTS.SNIPPER_RECEIPT]: snipper_receipt,
                config: payment_config,
                id: payment_id,
                secrets: await this.get_stripe_secrets(payment[CONSTANTS.FIELDS.PAYMENTS.PAYMENT_INTENT]),
            };
        });
    }

    issue_payment_refund = async (payment_id: string, initiator_user_id: string) => {
        const payment = await this.get_payment(payment_id);
        const refund_config = await new Refunds(payment, initiator_user_id).get_config();

        if (refund_config.refund_amount > 0) {
            return this.stripe.issue_stripe_refund(
                payment[CONSTANTS.FIELDS.PAYMENTS.PAYMENT_INTENT],
                refund_config.refund_amount,
                refund_config.refund_app_fee,
            ).then(() => this.repo.update(
                payment_id,
                {
                    [CONSTANTS.FIELDS.PAYMENTS.REFUND_CONFIG]: refund_config,
                    [CONSTANTS.FIELDS.PAYMENTS.STATUS]: CONSTANTS.TERMS.PAYMENTS.STATUSES.REFUNDED,
                }
            ));
        } else {
            return true;
        }
    }

    issue_system_payment_refund = async (payment_id: string) => {
        const payment = await this.get_payment(payment_id);

        return this.stripe.issue_stripe_refund(
            payment[CONSTANTS.FIELDS.PAYMENTS.PAYMENT_INTENT],
            payment[CONSTANTS.FIELDS.PAYMENTS.CONFIG].amount,
            true
        ).then(() => this.repo.update(
            payment_id,
            {
                [CONSTANTS.FIELDS.PAYMENTS.REFUND_CONFIG]: 'SYSTEM_INITIATED_FULL_REFUND',
                [CONSTANTS.FIELDS.PAYMENTS.STATUS]: CONSTANTS.TERMS.PAYMENTS.STATUSES.REFUNDED,
            }
        ));
    }
}