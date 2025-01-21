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

export async function createTokenAccount(
	data: { publicKey: string; tokenAmount: number }
) {
	const publicKey = data.publicKey;
	const tokenAmount = data.tokenAmount;

	const url = EXCHANGE_API + '/creditTokenAccount';
	try {
		const {data} = await axios.post(url,{
			publicKey,
			tokenAmount
		})
		return data;
	} catch (e) {
		console.error(`Cannot credit the account: got the following error:`, e)
		throw new Error(`${e}`)
	}

}