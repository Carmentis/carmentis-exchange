'use client';

import Image from 'next/image';
import { PropsWithChildren, useState } from 'react';
import * as yup from "yup";
import {yupResolver} from '@hookform/resolvers/yup';

import { Button, Card, CardContent, Input, Link, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useConnectionNodeUrl } from '@/app/connection.context';
import { createTokenAccount } from '@/app/api';
import { useToast } from '@/app/notification.context';

export default function Home() {
	return (
		<GrayBackground>
			<FlexCenter>
				<PaymentCard />
			</FlexCenter>

			<CarmentisNodeConnectionStatus/>
		</GrayBackground>
	);
}

function FlexCenter({ children }: PropsWithChildren) {
	return <div className={'flex justify-center w-full h-full items-center'}>
		{children}
	</div>;
}

function GrayBackground({ children }: PropsWithChildren) {
	return <div className={'bg-gray-50 w-full h-full'}>
		{children}
	</div>;
}

function ExchangeLogo() {
	return <Image src={'/carmentis.svg'} alt={''} width={40} height={40} />;
}

function PaymentCard() {
	return <Card className={'md:w-3/12 h-96 shadow-2xl rounded-md'}>
		<CardContent className={"flex flex-col w-full h-full justify-center items-center"}>
				<ExchangeLogo />
				<Typography variant={"h5"}>Exchange</Typography>
				<Typography>
					Credit your token accounts right now.
				</Typography>
				<PaymentForm/>
		</CardContent>
	</Card>;
}

const schema = yup.object({
	publicKey: yup.string().required(),
	tokenAmount: yup.number().required(),
});

function PaymentForm() {
	const toast = useToast();

	const { register, formState: { errors } } = useForm({
		resolver: yupResolver(schema),
	});

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		createTokenAccount({
			publicKey: formData.get('publicKey') as string,
			tokenAmount: parseInt(formData.get('tokenAmount'), 10),
		}).then(() => toast.success("Account credited"))
			.catch((e) => toast.error(e));
	};


	return (
		<form onSubmit={handleSubmit} className={"flex flex-col p-4 space-y-4"}>
			<TextField {...register("publicKey")} placeholder={"Public key"} name={"publicKey"} />


			<TextField type={"number"} {...register("tokenAmount")} placeholder={"Token Amount"} name={"tokenAmount"}/>

			<Button type="submit" variant={"contained"}>Credit</Button>
		</form>
	);
}



function CarmentisNodeConnectionStatus() {

	const nodeUrl = useConnectionNodeUrl();
	return <div className={"absolute top-5 left-5 text-sm"}>
			<div className="w-52">
				<Typography className={"text-gray-400"} fontSize={"small"}>
					Connected to node
				</Typography>
				<Typography fontSize={"small"}>
					<Link target={"_blank"} href={nodeUrl}>{nodeUrl}</Link>
				</Typography>
			</div>
	</div>
}


