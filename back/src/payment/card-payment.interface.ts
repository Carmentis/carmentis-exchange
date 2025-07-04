import { PaymentRequestDto } from './dto/payment-request.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import {PaymentEntity} from "./entities/payment.entity";

export interface CardPaymentService {
  /**
   * Process a card payment using the payment provider
   * @param paymentRequest The payment request data
   * @returns A promise that resolves to the payment response with redirect URL
   */
  processPayment(paymentRequest: PaymentRequestDto): Promise<PaymentResponseDto>;

  /**
   * Check payment status and update it in the database
   * @param id The local payment ID
   * @returns The payment status
   */
  checkPaymentStatus(id: string): Promise<{ status: string }>;

  getPaymentById(id: string): Promise<PaymentEntity>;
}
