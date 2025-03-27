'use client';

import Image from 'next/image';
import { PropsWithChildren, useState } from 'react';
import * as yup from "yup";
import {yupResolver} from '@hookform/resolvers/yup';

import {AppBar, Button, Card, CardContent, Chip, Input, Link, TextField, Toolbar, Typography} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useConnectionNodeUrl } from '@/app/connection.context';
import { createTokenAccount } from '@/app/api';
import { useToast } from '@/app/notification.context';
import {usePathname} from "next/navigation";

export default function Home() {
	return (
		<>
			<Navbar/>
			<GrayBackground>

				<FlexCenter>
					<PaymentCard/>
				</FlexCenter>

			</GrayBackground>
		</>
	);
}

function Navbar() {
	const nodeUrl = useConnectionNodeUrl();


	function renderNodeConnectionStatus() {
		return <Chip label={<>
		Node: {nodeUrl}
		</>} variant={"outlined"}/>
	}

	const pathname = usePathname();
	const env = pathname.includes("alpha") ? "alpha" : "beta"
	const workspaceUrl = `https://workspace.${env}.carmentis.io`
	const explorerUrl = `https://explorer.${env}.carmentis.io`

	return <AppBar position="fixed" color={"transparent"}>
		<Toolbar className="flex justify-between">
			<Typography variant="h6" fontSize={"large"} className={"uppercase"}>Carmentis <Typography component={"span"} fontSize={"large"}>Exchange</Typography></Typography>
			<div className="flex space-x-4 items-center">
				{renderNodeConnectionStatus()}
				<Link href={workspaceUrl} color="inherit" underline="none" target={"_blank"}>
					<Button color={"primary"} variant={"contained"}>
						Workspace
					</Button>
				</Link>
				<Link href={explorerUrl} color="inherit" underline="none" target={"_blank"}>
					<Button color={"primary"} variant={"contained"}>
						Explorer
					</Button>
				</Link>
			</div>
		</Toolbar>
	</AppBar>
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
					Purchase Carmentis tokens right now!
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





