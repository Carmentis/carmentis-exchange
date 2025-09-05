import { CardPaymentService } from '../card-payment.interface';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRequestDto } from '../dto/payment-request.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentEntity, PaymentStatus } from '../entities/payment.entity';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import {
    CarmentisError,
    CMTSToken,
    CurrencyConverterFactory,
} from '@cmts-dev/carmentis-sdk/server';
import { ControlConfigService } from '../../config/services/ControlConfigService';

@Injectable()
export class StancerCardPaymentService implements CardPaymentService {
    private readonly logger = new Logger(StancerCardPaymentService.name);
    private readonly apiUrl = 'https://api.stancer.com/v2';
    private readonly apiKey = process.env.STANCER_API_KEY;

    constructor(
        @InjectRepository(PaymentEntity)
        private readonly paymentRepository: Repository<PaymentEntity>,
        private readonly configService: ConfigService,
        private readonly controlConfig: ControlConfigService,
    ) {
        this.apiKey = this.controlConfig.getStancerApiKey();
    }

    /**
     * Process a payment using Stancer API
     * @param paymentRequest The payment request data
     * @returns A promise that resolves to the payment response with redirect URL
     */
    async processPayment(
        paymentRequest: PaymentRequestDto,
    ): Promise<PaymentResponseDto> {
        // check that API key is set
        if (!this.apiKey) {
            throw new Error('Stancer API key not set');
        }

        try {
            // Step 1: Create a payment entity with UUID
            const converter =
                CurrencyConverterFactory.defaultEurosToCMTSTokenConverter();
            const cmtsTokens = CMTSToken.create(paymentRequest.tokens);
            const equivTokensInEuros = converter.invert(cmtsTokens).getAmount();
            const payment = new PaymentEntity();
            payment.id = uuidv4();
            payment.tokens = paymentRequest.tokens;
            payment.amount = equivTokensInEuros;
            payment.walletPublicKey = paymentRequest.walletPublicKey;
            payment.status = PaymentStatus.PENDING;
            payment.metadata = {
                cardLastFour: paymentRequest.card.number.slice(-4),
                cardholderName: paymentRequest.card.name,
            };

            // Step 2: Create a card on Stancer
            const cardResponse = await this.createCard(paymentRequest);

            // Update payment with card ID
            payment.cardId = cardResponse.id;

            // Step 3: Create a payment using the card and the UUID for return_url
            // Make sure to use the correct backend URL for the return_url
            // This should be the publicly accessible URL of your backend
            const backendUrl = this.controlConfig.getControlApiEndpoint();
            const returnUrl = `${backendUrl}/payment/update/${payment.id}`;
            const paymentResponse = await this.createPayment(
                equivTokensInEuros,
                cardResponse.id,
                paymentRequest.tokens,
                returnUrl,
            );

            // Step 4: Update payment information in the database
            const authRedirectionUrl = paymentResponse.auth.redirect_url;
            this.logger.debug(
                `Stancer PayID{${paymentResponse.id}} -> Payment Redirection{${authRedirectionUrl}}`,
            );
            payment.paymentId = paymentResponse.id;
            payment.redirectUrl = authRedirectionUrl;
            await this.paymentRepository.save(payment);

            // Step 5: Return the redirect URL and payment ID
            return {
                redirect_url: paymentResponse.auth.redirect_url,
                payment_id: payment.id,
            };
        } catch (error) {
            if (CarmentisError.isCarmentisError(error)) {
                this.logger.error(
                    `Payment processing failed due to Carmentis error: ${error}`,
                );
            } else {
                this.logger.error(`Payment processing failed: ${error}`);
            }
            throw error;
        }
    }

    /**
     * Create a card on Stancer
     * @param paymentRequest The payment request containing card details
     * @returns The created card object from Stancer
     */
    private async createCard(paymentRequest: PaymentRequestDto) {
        try {
            const response = await axios.post(
                `${this.apiUrl}/cards/`,
                {
                    number: paymentRequest.card.number,
                    exp_month: paymentRequest.card.exp_month,
                    exp_year: paymentRequest.card.exp_year,
                    cvc: paymentRequest.card.cvc,
                    name: paymentRequest.card.name,
                },
                {
                    auth: {
                        username: this.apiKey,
                        password: '',
                    },
                },
            );

            return response.data;
        } catch (error) {
            this.logger.error(`Failed to create card: ${error}`);
            throw error;
        }
    }

    /**
     * Create a payment on Stancer
     * @param amount The amount to charge
     * @param cardId The ID of the card to charge
     * @param tokens The number of tokens being purchased
     * @param returnUrl The URL to redirect to after 3D Secure authentication
     * @returns The created payment object from Stancer
     */
    private async createPayment(
        amount: number,
        cardId: string,
        tokens: number,
        returnUrl: string,
    ) {
        try {
            const response = await axios.post(
                `${this.apiUrl}/payments/`,
                {
                    amount: amount * 100, // stancer takes amount in cents
                    currency: 'eur',
                    description: `Purchase of ${tokens} tokens`,
                    card: cardId,
                    auth: {
                        return_url: returnUrl,
                    },
                },
                {
                    auth: {
                        username: this.apiKey,
                        password: '',
                    },
                },
            );

            return response.data;
        } catch (error) {
            this.logger.error(`Failed to create payment: ${error}`);
            throw error;
        }
    }

    /**
     * Get payment status from Stancer API
     * @param paymentId The payment ID from Stancer
     * @returns The payment status from Stancer
     */
    private async getPaymentStatusFromStancer(paymentId: string) {
        try {
            const response = await axios.get(
                `${this.apiUrl}/payments/${paymentId}`,
                {
                    auth: {
                        username: this.apiKey,
                        password: '',
                    },
                },
            );

            return response.data;
        } catch (error) {
            this.logger.error(
                `Failed to get payment status from Stancer: ${error}`,
            );
            throw error;
        }
    }

    /**
     * Check payment status and update it in the database
     * @param id The local payment ID
     * @returns The payment status
     */
    async checkPaymentStatus(
        id: string,
    ): Promise<{ status: string; completed: boolean; pending: boolean }> {
        try {
            // Find the payment in the database
            const payment = await this.paymentRepository.findOne({
                where: { id },
            });

            if (!payment) {
                throw new NotFoundException(`Payment with ID ${id} not found`);
            }

            // If the payment is already completed or failed, return the status
            if (payment.status !== PaymentStatus.PENDING) {
                return {
                    status: payment.status,
                    completed: payment.status === 'completed',
                    pending: payment.status === 'pending',
                };
            }

            // Otherwise, check the status from Stancer
            const stancerPayment = await this.getPaymentStatusFromStancer(
                payment.paymentId,
            );

            // Update the payment status based on the Stancer response
            if (stancerPayment.auth && stancerPayment.auth.status) {
                if (stancerPayment.auth.status === 'success') {
                    payment.status = PaymentStatus.COMPLETED;
                } else if (stancerPayment.auth.status === 'failed') {
                    payment.status = PaymentStatus.FAILED;
                }

                // Save the updated payment status
                await this.paymentRepository.save(payment);
            }

            return {
                status: payment.status,
                completed: payment.status === 'completed',
                pending: payment.status === 'pending',
            };
        } catch (error) {
            this.logger.error(`Failed to check payment status: ${error}`);
            throw error;
        }
    }

    /**
     * Retrieves a payment record by its unique identifier.
     *
     * @param {string} id - The unique identifier of the payment to retrieve.
     * @return {Promise<Object|null>} A promise that resolves to the payment record if found, otherwise null.
     */
    async getPaymentById(id: string) {
        return this.paymentRepository.findOne({ where: { id } });
    }

    /**
     * Marks a payment as completed by updating its status to 'COMPLETED'.
     *
     * @param {string} id - The unique identifier of the payment to be marked as done.
     * @return {Promise<object>} A promise that resolves with the updated payment object after it is saved.
     */
    async markPaymentAsDone(id: string) {
        const payment = await this.getPaymentById(id);
        payment.status = PaymentStatus.COMPLETED;
        return this.paymentRepository.save(payment);
    }
}
