import { IsDefined, IsPositive, IsString } from 'class-validator';

export class AccountCreditDto {

	@IsDefined()
	publicKey: string;

	@IsDefined()
	tokenAmount: number;
}