import { IsPositive, IsString } from 'class-validator';

export class AccountCreditDto {

	@IsString()
	publicKey: string;

	@IsPositive()
	tokenAmount: number;
}