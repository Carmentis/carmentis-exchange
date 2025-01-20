'use server';

import axios from 'axios';

const EXCHANGE_API : string | undefined = process.env.EXCHANGE_API;
if (!EXCHANGE_API) throw new Error("The EXCHANGE_API variable is not defined")

export async function useExchangeConfig(): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		axios.get(EXCHANGE_API + '/networkConfig')
			.then(res => {
				resolve(res.data["nodeUrl"])
			}).catch(reject)
	})
}

export async function useTokenAccountCreation(
	publicKey: string,
	tokenAmount: number
) {
	return axios.post(EXCHANGE_API + '/createTokenAccount',{
		publicKey,
		tokenAmount
	})
}