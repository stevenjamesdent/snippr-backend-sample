export default class Currency {
    constructor() {}

    _add = (amount_a: number, amount_b: number) => {
        this._validate([amount_a, amount_b]);

        return this._round(
            amount_a + amount_b
        );
    }

    _round = (amount: number) => {
        return Math.floor(amount);
    }

    _validate = (amount: number | number[]) => {
        const amounts = Array.isArray(amount) ? amount : [amount];
        let valid = true;

        amounts.forEach((validation_amount) => {
            if (!Number.isInteger(validation_amount)) {
                valid = false;
            }
        });

        if (!valid) {
            throw new Error('Value is not a valid currency amount, must be an integer.')
        }

        return;
    }

    /**
     * Divides the given amount by the given divisor
     * @param {number} amount The amount in GBX which should be divided.
     * @param {number} divisor The value by which the given amount should be divided.
     */
    divide = (amount: number, divisor: number) => {
        this._validate(amount);

        return this._round(
            amount / divisor
        );
    }

    /**
     * Formats the given GBX amount as a GBP string
     * @param {number} amount - The amount in GBX
     * @returns {string} The formatted GBP value
     */
    format = (amount: number) => {
        this._validate(amount);

        return new Intl.NumberFormat(
            'en-GB',
            {
                style: 'currency',
                currency: 'GBP',
            }
        ).format(amount / 100);
    }

    /**
     * Finds the largest amount in the array of provided GBX amounts
     * @param {Array} amounts An array of amounts in GBX of which the largest will be returned
     */
    largest = (amounts: number[]) => {
        this._validate(amounts);

        return Math.max(...amounts);
    }

    /**
     * Multiplies the given amount by the given multiplier
     * @param {number} amount The amount in GBX which should be multiplied.
     * @param {number} multiplier The value by which the given amount should be multiplied.
     */
    multiply = (amount: number, multiplier: number) => {
        this._validate(amount);

        return this._round(
            amount * multiplier
        );
    }

    /**
     * Calculates the requested percentage of the given amount of GBX
     * @param {number} amount The amount in GBX of which a percentage is desired.
     * @param {number} percentage The desired percentage of the given amount.
     */
    percentage = (amount: number, percentage: number) => {
        this._validate(amount);

        return this._round(
            (amount / 100) * percentage
        );
    }

    /**
     * Finds the smallest amount in the array of provided GBX amounts
     * @param {Array} amounts An array of amounts in GBX of which the smallest will be returned
     */
    smallest = (amounts: number[]) => {
        this._validate(amounts);

        return Math.min(...amounts);
    }

    /**
     * Subtracts the given amount_b from the given amount_a
     * @param {number} amount_a An amount in GBX from which amount_b should be subtracted
     * @param {number} amount_b An amount in GBX to be subtracted from amount_a
     */
    subtract = (amount_a: number, amount_b: number) => {
        this._validate([amount_a, amount_b]);

        return this._round(
            amount_a - amount_b
        );
    }

    /**
     * Calculates the sum of an array of amounts in GBX
     * @param {Array} amounts An array of integers representing GBX amounts
     * @param {number} initial The starting point of the sum, optional, defaults to 0
     */
    sum = (sum_amounts: number[], initial: number = 0) => {
        const amounts = Array.isArray(sum_amounts) ? sum_amounts : [sum_amounts];

        this._validate(amounts);
        
        return this._round(
            amounts.reduce(this._add, initial)
        );
    }
}