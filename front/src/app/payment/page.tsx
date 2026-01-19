'use client';

import Image from 'next/image';
import {useEffect, useState} from 'react';
import * as yup from "yup";
import {yupResolver} from '@hookform/resolvers/yup';
import {useForm, Controller} from 'react-hook-form';

import {useConnectionNodeUrl} from '@/app/payment/connection.context';
import {useToast} from '@/app/payment/notification.context';
import {CMTSToken, CurrencyConverterFactory} from "@cmts-dev/carmentis-sdk/client";
import {useCryptoPayment} from "@/hooks/useCryptoPayment";
import {useCardPayment} from "@/hooks/useCardPayment";
import {useSEPAPayment} from "@/hooks/useSEPAPayment";
import {Captcha} from "recaptz";

export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <PaymentCard/>
        </div>
    );
}

function PaymentCard() {
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Account Details', 'Payment Information', 'Confirmation'];
    const [formData, setFormData] = useState({
        publicKey: '',
        tokenAmount: 100,
        paymentMethod: 'card'
    });

    const handleNext = (data: any) => {
        setFormData(prev => ({...prev, ...data}));
        setActiveStep(prevStep => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevStep => prevStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setFormData({
            publicKey: '',
            tokenAmount: 100,
            paymentMethod: 'card'
        });
    };

    return (
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                    <Image src="/carmentis.svg" alt="Carmentis Logo" width={28} height={28}/>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Carmentis Testnet Faucet
                    </h1>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                    Get free testnet tokens instantly
                </p>
            </div>

            {/* Stepper */}
            <div className="px-6 py-4 bg-gray-50 border-y border-gray-200">
                <div className="flex justify-between items-center">
                    {steps.map((label, index) => (
                        <div key={label} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    index <= activeStep
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-300 text-gray-600'
                                }`}>
                                    {index + 1}
                                </div>
                                <span className="text-xs mt-1 text-center font-medium">{label}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`h-0.5 flex-1 -mt-6 ${
                                    index < activeStep ? 'bg-blue-600' : 'bg-gray-300'
                                }`}></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeStep === 0 && (
                    <AccountDetailsForm formData={formData} onNext={handleNext}/>
                )}

                {activeStep === 1 && (
                    <PaymentForm formData={formData} onNext={handleNext} onBack={handleBack}/>
                )}

                {activeStep === 2 && (
                    <ConfirmationStep formData={formData} onBack={handleBack} onReset={handleReset}/>
                )}
            </div>
        </div>
    );
}

// Validation schemas
const accountDetailsSchema = yup.object({
    publicKey: yup.string().required("Public key is required"),
    tokenAmount: yup.number().required("Token amount is required").positive("Amount must be positive"),
    paymentMethod: yup.string().required("Payment method is required").oneOf(['card', 'sepa', 'crypto'], "Invalid payment method"),
});

const cardPaymentSchema = yup.object({
    cardholderName: yup.string().required("Cardholder name is required"),
    cardNumber: yup.string()
        .required("Card number is required")
        .matches(/^[0-9\s]{13,19}$/, "Invalid card number format"),
    expiryDate: yup.string()
        .required("Expiry date is required")
        .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Invalid expiry date format (MM/YY)"),
    cvc: yup.string()
        .required("CVC is required")
        .matches(/^[0-9]{3,4}$/, "CVC must be 3 or 4 digits"),
});

const sepaPaymentSchema = yup.object({
    accountHolderName: yup.string().required("Account holder name is required"),
    iban: yup.string()
        .required("IBAN is required")
        .matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, "Invalid IBAN format"),
    bic: yup.string()
        .required("BIC/SWIFT is required")
        .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid BIC/SWIFT format"),
});

const cryptoPaymentSchema = yup.object({
    cryptoType: yup.string()
        .required("Cryptocurrency type is required")
        .oneOf(['BTC', 'ETH', 'USDT'], "Invalid cryptocurrency type"),
    walletAddress: yup.string()
        .required("Wallet address is required")
        .min(26, "Wallet address is too short")
        .max(64, "Wallet address is too long"),
});

// Account Details Form (Step 1)
function AccountDetailsForm({formData, onNext}: { formData: any, onNext: (data: any) => void }) {
    const {register, handleSubmit, control, watch, formState: {errors}} = useForm({
        resolver: yupResolver(accountDetailsSchema),
        defaultValues: {
            publicKey: formData.publicKey || "",
            tokenAmount: formData.tokenAmount || 100,
            paymentMethod: formData.paymentMethod || "card"
        }
    });

    const tokenAmount = watch("tokenAmount");
    const [euroAmount, setEuroAmount] = useState("");

    useEffect(() => {
        if (tokenAmount) {
            const converter = CurrencyConverterFactory.defaultEurosToCMTSTokenConverter();
            const tokens = CMTSToken.create(tokenAmount);
            const euros = converter.invert(tokens);
            setEuroAmount(euros.getAmount().toString());
        }
    }, [tokenAmount]);

    const onSubmit = (data: any) => {
        onNext(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Public Key</label>
                <input
                    type="text"
                    {...register("publicKey")}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.publicKey ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your Carmentis public key"
                />
                {errors.publicKey && (
                    <p className="mt-2 text-sm font-medium text-red-600">{errors.publicKey.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Token Amount</label>
                <input
                    type="number"
                    {...register("tokenAmount")}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.tokenAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="100"
                />
                {errors.tokenAmount && (
                    <p className="mt-2 text-sm font-medium text-red-600">{errors.tokenAmount.message}</p>
                )}
                {!errors.tokenAmount && (
                    <p className="mt-2 text-sm text-gray-600">Maximum 100 CMTS</p>
                )}
                {euroAmount && (
                    <p className="mt-1 text-sm font-medium text-gray-700">≈ {euroAmount} EUR</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Payment Method</label>
                <Controller
                    name="paymentMethod"
                    control={control}
                    render={({field}) => (
                        <div className="space-y-2">
                            <label className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    {...field}
                                    value="card"
                                    checked={field.value === 'card'}
                                    className="mr-3"
                                />
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-semibold text-gray-900">Card Payment</span>
                                    <span className="text-xs text-gray-500 font-medium">Visa, Mastercard, Amex</span>
                                </div>
                            </label>
                            <label className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    {...field}
                                    value="sepa"
                                    checked={field.value === 'sepa'}
                                    className="mr-3"
                                />
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-semibold text-gray-900">SEPA Transfer</span>
                                    <span className="text-xs text-gray-500 font-medium">Bank Transfer</span>
                                </div>
                            </label>
                            <label className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    {...field}
                                    value="crypto"
                                    checked={field.value === 'crypto'}
                                    className="mr-3"
                                />
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-semibold text-gray-900">Cryptocurrency</span>
                                    <span className="text-xs text-gray-500 font-medium">BTC, ETH, USDT</span>
                                </div>
                            </label>
                        </div>
                    )}
                />
                {errors.paymentMethod && (
                    <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-base transition-all"
                >
                    Continue
                </button>
            </div>
        </form>
    );
}

// Card Payment Form
function CardPaymentForm({formData, onSubmit, errors, control, register}: any) {
    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, '');
        const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
        return formatted.substring(0, 19);
    };

    const formatExpiryDate = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length > 2) {
            return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
        }
        return digits;
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                <input
                    type="text"
                    {...register("cardholderName")}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                />
                {errors.cardholderName && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardholderName.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <Controller
                    name="cardNumber"
                    control={control}
                    render={({field}) => (
                        <>
                            <input
                                type="text"
                                value={field.value}
                                onChange={(e) => field.onChange(formatCardNumber(e.target.value))}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="4242 4242 4242 4242"
                            />
                            {errors.cardNumber && (
                                <p className="mt-1 text-sm text-red-600">{errors.cardNumber.message}</p>
                            )}
                        </>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <Controller
                        name="expiryDate"
                        control={control}
                        render={({field}) => (
                            <>
                                <input
                                    type="text"
                                    value={field.value}
                                    onChange={(e) => field.onChange(formatExpiryDate(e.target.value))}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="MM/YY"
                                />
                                {errors.expiryDate && (
                                    <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>
                                )}
                            </>
                        )}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                    <input
                        type="text"
                        {...register("cvc")}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.cvc ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="123"
                        maxLength={4}
                    />
                    {errors.cvc && (
                        <p className="mt-1 text-sm text-red-600">{errors.cvc.message}</p>
                    )}
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm font-medium text-blue-900 mb-1">Test Card</p>
                <p className="text-xs text-blue-800">4242 4242 4242 4242 • Any future date • Any 3-digit CVC</p>
            </div>
        </div>
    );
}

// SEPA Payment Form
function SEPAPaymentForm({formData, onSubmit, errors, control, register}: any) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                <input
                    type="text"
                    {...register("accountHolderName")}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                />
                {errors.accountHolderName && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountHolderName.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                <input
                    type="text"
                    {...register("iban")}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.iban ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="DE89 3704 0044 0532 0130 00"
                />
                {errors.iban && (
                    <p className="mt-1 text-sm text-red-600">{errors.iban.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BIC/SWIFT</label>
                <input
                    type="text"
                    {...register("bic")}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bic ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="DEUTDEFF"
                />
                {errors.bic && (
                    <p className="mt-1 text-sm text-red-600">{errors.bic.message}</p>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-xs text-blue-800">
                    Transfers take 1-3 business days. Use your public key as payment reference.
                </p>
            </div>
        </div>
    );
}

// Crypto Payment Form
function CryptoPaymentForm({formData, onSubmit, errors, control, register}: any) {
    return (
        <div className="space-y-6">
            <div className="border border-gray-200 bg-gray-50 rounded-md p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Cryptocurrency</label>
                <Controller
                    name="cryptoType"
                    control={control}
                    render={({field}) => (
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    {...field}
                                    value="BTC"
                                    checked={field.value === 'BTC'}
                                    className="mr-2"
                                />
                                <span>Bitcoin (BTC)</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    {...field}
                                    value="ETH"
                                    checked={field.value === 'ETH'}
                                    className="mr-2"
                                />
                                <span>Ethereum (ETH)</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    {...field}
                                    value="USDT"
                                    checked={field.value === 'USDT'}
                                    className="mr-2"
                                />
                                <span>Tether (USDT)</span>
                            </label>
                        </div>
                    )}
                />
                {errors.cryptoType && (
                    <p className="mt-2 text-sm text-red-600">{errors.cryptoType.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
                <input
                    type="text"
                    {...register("walletAddress")}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.walletAddress ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your wallet address"
                />
                {errors.walletAddress && (
                    <p className="mt-1 text-sm text-red-600">{errors.walletAddress.message}</p>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-xs text-blue-800">
                    Tokens credited after 6 confirmations. Rate locked for 15 minutes.
                </p>
            </div>
        </div>
    );
}

// Payment Form (Step 2)
function PaymentForm({formData, onNext, onBack}: { formData: any, onNext: (data: any) => void, onBack: () => void }) {
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const validationSchema = formData.paymentMethod === 'card'
        ? cardPaymentSchema
        : formData.paymentMethod === 'sepa'
            ? sepaPaymentSchema
            : cryptoPaymentSchema;

    const {register, handleSubmit, control, formState: {errors}} = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: formData
    });

    const onSubmit = (data: any) => {
        setPaymentError(null);
        onNext(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{paymentError}</p>
                </div>
            )}

            <p className="text-sm text-gray-600">
                Payment method: <strong className="text-black">{formData.paymentMethod === 'card' ? 'Card' : formData.paymentMethod === 'sepa' ? 'SEPA' : 'Crypto'}</strong>
            </p>

            {formData.paymentMethod === 'card' && (
                <CardPaymentForm
                    formData={formData}
                    onSubmit={onSubmit}
                    errors={errors}
                    control={control}
                    register={register}
                />
            )}

            {formData.paymentMethod === 'sepa' && (
                <SEPAPaymentForm
                    formData={formData}
                    onSubmit={onSubmit}
                    errors={errors}
                    control={control}
                    register={register}
                />
            )}

            {formData.paymentMethod === 'crypto' && (
                <CryptoPaymentForm
                    formData={formData}
                    onSubmit={onSubmit}
                    errors={errors}
                    control={control}
                    register={register}
                />
            )}

            <div className="flex gap-3 mt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                    Continue
                </button>
            </div>
        </form>
    );
}

// Confirmation Step (Step 3)
function ConfirmationStep({formData, onBack, onReset}: { formData: any, onBack: () => void, onReset: () => void }) {
    const toast = useToast();

    const {processPayment: processCardPayment, loading: isProcessingCardPayment} = useCardPayment();
    const {processPayment: processSEPAPayment, loading: isProcessingSEPAPayment} = useSEPAPayment();
    const {processPayment: processCryptoPayment, loading: isProcessingCryptoPayment} = useCryptoPayment();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [captchaValidated, setCaptchaValidated] = useState(false);
    const converter = CurrencyConverterFactory.defaultEurosToCMTSTokenConverter();

    const handleSubmit = async () => {
        if (!captchaValidated) {
            setError("Please complete the captcha verification");
            toast.error("Please complete the captcha verification");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const tokenAmount = CMTSToken.create(formData.tokenAmount);
        const tokenAmountInEuros = converter.invert(tokenAmount);
        try {
            if (formData.paymentMethod === 'card') {
                await processCardPayment({
                    cardNumber: formData.cardNumber,
                    expiryDate: formData.expiryDate,
                    cvc: formData.cvc,
                    cardholderName: formData.cardholderName,
                    amount: formData.tokenAmount,
                    description: `Purchase of ${tokenAmount.toString()} tokens`,
                    walletPublicKey: formData.publicKey
                });
            } else if (formData.paymentMethod === 'sepa') {
                await processSEPAPayment({
                    accountHolderName: formData.accountHolderName,
                    iban: formData.iban,
                    bic: formData.bic,
                    amount: formData.tokenAmount,
                    description: `Purchase of ${tokenAmount.toString()} tokens`,
                    reference: `TOKEN-${formData.publicKey.substring(0, 8)}`
                });
            } else if (formData.paymentMethod === 'crypto') {
                await processCryptoPayment({
                    cryptoType: formData.cryptoType,
                    walletAddress: formData.walletAddress,
                    amount: formData.tokenAmount,
                    description: `Purchase of ${tokenAmount.toString()} tokens`
                });
            }

            setSuccess(true);
            toast.success("Payment successful! Your account has been credited with tokens.");
        } catch (e) {
            setError(String(e));
            toast.error(String(e));
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderPaymentMethodDetails = () => {
        if (formData.paymentMethod === 'card') {
            return (
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Method:</span>
                    <span className="text-sm font-medium text-gray-800">
                        Card ending in {formData.cardNumber.slice(-4)}
                    </span>
                </div>
            );
        } else if (formData.paymentMethod === 'sepa') {
            return (
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Method:</span>
                    <span className="text-sm font-medium text-gray-800">
                        SEPA Transfer from {formData.accountHolderName}
                    </span>
                </div>
            );
        } else if (formData.paymentMethod === 'crypto') {
            return (
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Method:</span>
                    <span className="text-sm font-medium text-gray-800">
                        {formData.cryptoType} Payment
                    </span>
                </div>
            );
        }
    };

    const getPaymentStatusMessage = () => {
        if (formData.paymentMethod === 'card') {
            return "Your payment has been processed and your account has been credited with tokens.";
        } else if (formData.paymentMethod === 'sepa') {
            return "Your SEPA transfer has been initiated. Your account will be credited with tokens once the payment is confirmed (1-3 business days).";
        } else if (formData.paymentMethod === 'crypto') {
            return "Your cryptocurrency payment has been initiated. Your account will be credited with tokens once the transaction is confirmed on the blockchain.";
        }
        return "Your account has been successfully credited with tokens.";
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {success ? (
                <div className="text-center py-6">
                    <div className="mb-4 flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-3 tracking-tight">Payment Successful</h2>
                    <p className="text-base text-gray-600 mb-6 leading-relaxed">
                        {getPaymentStatusMessage()}
                    </p>
                    <button
                        onClick={onReset}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                        New Purchase
                    </button>
                </div>
            ) : (
                <>
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-md">
                        <h3 className="text-lg font-bold mb-4 tracking-tight">Order Summary</h3>
                        <hr className="mb-4 border-gray-300"/>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Public Key:</span>
                                <span className="text-sm font-medium max-w-xs truncate">
                                    {formData.publicKey}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Token Amount:</span>
                                <span className="text-sm font-medium">
                                    {CMTSToken.create(formData.tokenAmount).toString()} tokens
                                </span>
                            </div>
                            {renderPaymentMethodDetails()}
                            <hr className="my-3 border-gray-300"/>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Total:</span>
                                <span className="text-sm font-semibold">
                                    {converter.invert(CMTSToken.create(formData.tokenAmount)).toString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center mt-4">
                        <Captcha
                            type="mixed"
                            length={6}
                            onValidate={(isValid) => {
                                console.log('Captcha validated:', isValid);
                                setCaptchaValidated(isValid);
                            }}
                            showSuccessAnimation
                        />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !captchaValidated}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                "Complete Purchase"
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
