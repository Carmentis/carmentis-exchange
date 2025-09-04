import { IsNotEmpty, IsString } from 'class-validator';

export class PaymentResponseDto {
    @IsString()
    @IsNotEmpty()
    redirect_url: string;

    @IsString()
    @IsNotEmpty()
    payment_id: string;
}
