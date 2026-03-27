const axios = require('axios');
const config = require('../config');

const KHALTI_API_URL = 'https://a.khalti.com/api/v2';

/**
 * Refund Service
 * Computes refund amounts and processes Khalti refunds
 */

/**
 * Compute refund amount based on time until booking start.
 * Policy:
 *  > 24h before start  → 100% refund
 *  6h – 24h before     → 50% refund
 *  < 6h or started     → 0% refund
 *
 * @param {Date} startDateTime - Full datetime of the booking start (date + startTime combined)
 * @param {number} paidAmount  - Amount user paid (in NPR)
 * @returns {{ refundPercent: number, refundAmount: number, tier: string }}
 */
const computeRefundAmount = (startDateTime, paidAmount) => {
    const now = new Date();
    const hoursUntilStart = (startDateTime - now) / (1000 * 60 * 60);

    let refundPercent = 0;
    let tier = 'no_refund';

    if (hoursUntilStart > 24) {
        refundPercent = 100;
        tier = 'full_refund';
    } else if (hoursUntilStart > 6) {
        refundPercent = 50;
        tier = 'partial_refund';
    }
    // else < 6h or already started → 0%

    const refundAmount = Math.round((paidAmount * refundPercent) / 100 * 100) / 100;
    return { refundPercent, refundAmount, tier };
};

/**
 * Initiate a Khalti refund via the sandbox API.
 *
 * @param {string} pidx        - Original transaction pidx
 * @param {number} amountNPR   - Amount to refund in NPR
 * @returns {{ success: boolean, refundPidx?: string, error?: string }}
 */
const initiateKhaltiRefund = async (pidx, amountNPR) => {
    try {
        const amountPaisa = Math.round(amountNPR * 100);

        const response = await axios.post(
            `${KHALTI_API_URL}/refund/`,
            {
                pidx,
                amount: amountPaisa,
            },
            {
                headers: {
                    Authorization: `Key ${config.khalti.secretKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            success: true,
            refundPidx: response.data.pidx || pidx,
            data: response.data,
        };
    } catch (error) {
        console.error('Khalti refund error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.detail || error.message,
        };
    }
};

/**
 * Get human-readable refund message for user notifications
 */
const getRefundMessage = (tier, refundAmount, currency = 'Rs.') => {
    if (tier === 'full_refund') {
        return `You will receive a full refund of ${currency} ${refundAmount.toLocaleString()}.`;
    } else if (tier === 'partial_refund') {
        return `You will receive a 50% refund of ${currency} ${refundAmount.toLocaleString()}.`;
    }
    return 'No refund is applicable (cancellation within 6 hours of booking time).';
};

module.exports = {
    computeRefundAmount,
    initiateKhaltiRefund,
    getRefundMessage,
};
