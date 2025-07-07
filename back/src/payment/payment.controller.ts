import { Body, Controller, Inject, Post, HttpCode, HttpStatus, Logger, Param, Res } from "@nestjs/common";
import { CARD_PAYMENT_SERVICE } from "./payment.module";
import { PaymentRequestDto } from "./dto/payment-request.dto";
import { PaymentResponseDto } from "./dto/payment-response.dto";
import { CardPaymentService } from "./card-payment.interface";
import { Response } from 'express';
import {StancerCardPaymentService} from "./stancer/stancer-card-payment.service";
import {IssuerService} from "../issuer.service";
import {EventEmitter2} from "@nestjs/event-emitter";

@Controller('/payment')
export class PaymentController {
    private readonly logger = new Logger(PaymentController.name);

    constructor(
        @Inject()
        private readonly paymentService: StancerCardPaymentService,
        private eventEmitter: EventEmitter2
    ) {}

    /**
     * Process a payment and return a redirect URL for 3D Secure validation
     * @param paymentRequest The payment request data
     * @returns The payment response with redirect URL
     */
    @Post()
    @HttpCode(HttpStatus.OK)
    async processPayment(@Body() paymentRequest: PaymentRequestDto): Promise<PaymentResponseDto> {
        this.logger.log(`Processing payment for ${paymentRequest.tokens} tokens`);

        try {
            const response = await this.paymentService.processPayment(paymentRequest);
            this.logger.log('Payment processing successful, returning redirect URL');
            return response;
        } catch (error) {
            this.logger.error(`Payment processing failed: ${error}`);
            throw error;
        }
    }

    /**
     * Check payment status and return the result
     * @param id The local payment ID
     * @returns The payment status
     */
    @Post('result/:id')
    @HttpCode(HttpStatus.OK)
    async checkPaymentStatus(@Param('id') id: string): Promise<{ status: string }> {
        this.logger.log(`Checking payment status for payment ID: ${id}`);

        try {
            const result = await this.paymentService.checkPaymentStatus(id);
            this.logger.log(`Payment status check successful, status: ${result.status}`);
            return result;
        } catch (error) {
            this.logger.error(`Payment status check failed: ${error}`);
            throw error;
        }
    }

    /**
     * Handle the return from Stancer after 3D Secure authentication
     * @param id The local payment ID
     * @param res The response object
     */
    @Post('update/:id')
    @HttpCode(HttpStatus.OK)
    async handlePaymentUpdate(@Param('id') id: string, @Res() res: Response): Promise<void> {
        this.logger.log(`Handling payment update for payment ID: ${id}`);
        // Check payment status
        const result = await this.paymentService.checkPaymentStatus(id);
        const status = result.status;
        this.logger.log(`Payment update check successful, status: ${status}`);

        // if the payment is completed, then we proceed to the transfer of the token
        if (result.completed) {
            this.logger.debug(`Emitting notification of payment with id ${id}`)
            this.eventEmitter.emit('paiement.succeeded', { id });
        }


        // Return HTML page with redirect to success page on the frontend
        res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Completed</title>
            <script>
              window.onload = function() {
                window.close()
              }
            </script>
          </head>
          <body>
            <p>Payment processing completed. Redirecting to success page...</p>
          </body>
        </html>
      `);
    }
}
