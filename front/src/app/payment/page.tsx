'use client';

import Image from 'next/image';
import {PropsWithChildren, useEffect, useState} from 'react';
import * as yup from "yup";
import {yupResolver} from '@hookform/resolvers/yup';

import {
    AppBar,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Link,
    TextField,
    Toolbar,
    Typography,
    Box,
    Paper,
    IconButton,
    Tooltip,
    Stepper,
    Step,
    StepLabel,
    Divider,
    Alert,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormControl,
    FormLabel
} from '@mui/material';
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
        paymentMethod: 'card' // Default payment method
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
        <Card className="w-full max-w-2xl shadow-sm">
            {/* Header */}
            <Box className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-2">
                    <Image src="/carmentis.svg" alt="Carmentis Logo" width={24} height={24}/>
                    <Typography variant="h6" className="font-semibold">
                        Carmentis Testnet Faucet
                    </Typography>
                </div>
                <Typography variant="body2" className="text-gray-500 text-sm">
                    Get free testnet tokens instantly
                </Typography>
            </Box>

            {/* Stepper */}
            <Box className="px-6 py-4 bg-gray-50">
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* Content */}
            <CardContent className="p-6">
                {activeStep === 0 && (
                    <AccountDetailsForm formData={formData} onNext={handleNext}/>
                )}

                {activeStep === 1 && (
                    <PaymentForm formData={formData} onNext={handleNext} onBack={handleBack}/>
                )}

                {activeStep === 2 && (
                    <ConfirmationStep formData={formData} onBack={handleBack} onReset={handleReset}/>
                )}
            </CardContent>
        </Card>
    );
}

// Validation schemas
const accountDetailsSchema = yup.object({
    publicKey: yup.string().required("Public key is required"),
    tokenAmount: yup.number().required("Token amount is required").positive("Amount must be positive"),
    paymentMethod: yup.string().required("Payment method is required").oneOf(['card', 'sepa', 'crypto'], "Invalid payment method"),
});

// Card payment validation schema
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

// SEPA payment validation schema
const sepaPaymentSchema = yup.object({
    accountHolderName: yup.string().required("Account holder name is required"),
    iban: yup.string()
        .required("IBAN is required")
        .matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, "Invalid IBAN format"),
    bic: yup.string()
        .required("BIC/SWIFT is required")
        .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid BIC/SWIFT format"),
});

// Crypto payment validation schema
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
                <TextField
                    label="Public Key"
                    {...register("publicKey")}
                    error={!!errors.publicKey}
                    helperText={errors.publicKey?.message}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your Carmentis public key"
                    size="medium"
                />
            </div>

            <div>
                <TextField
                    label="Token Amount"
                    type="number"
                    {...register("tokenAmount")}
                    error={!!errors.tokenAmount}
                    helperText={errors.tokenAmount?.message || "Maximum 100 CMTS"}
                    fullWidth
                    variant="outlined"
                    placeholder="100"
                    size="medium"
                />
                {euroAmount && (
                    <Typography variant="caption" className="text-gray-500 mt-1 block">
                        ≈ {euroAmount} EUR
                    </Typography>
                )}
            </div>

            <div>
                <FormLabel component="legend" className="mb-2 font-medium text-sm">Payment Method</FormLabel>
                <Controller
                    name="paymentMethod"
                    control={control}
                    render={({field}) => (
                        <RadioGroup {...field} className="space-y-2">
                            <Paper className="hover:bg-gray-50 transition-colors cursor-pointer">
                                <FormControlLabel
                                    value="card"
                                    control={<Radio/>}
                                    label={
                                        <div className="flex items-center justify-between w-full py-1">
                                            <span className="font-medium">Card Payment</span>
                                            <span className="text-xs text-gray-500">Visa, Mastercard, Amex</span>
                                        </div>
                                    }
                                    className="px-4 py-2 m-0 w-full"
                                />
                            </Paper>
                            <Paper className="hover:bg-gray-50 transition-colors cursor-pointer">
                                <FormControlLabel
                                    value="sepa"
                                    control={<Radio/>}
                                    label={
                                        <div className="flex items-center justify-between w-full py-1">
                                            <span className="font-medium">SEPA Transfer</span>
                                            <span className="text-xs text-gray-500">Bank Transfer</span>
                                        </div>
                                    }
                                    className="px-4 py-2 m-0 w-full"
                                />
                            </Paper>
                            <Paper className="hover:bg-gray-50 transition-colors cursor-pointer">
                                <FormControlLabel
                                    value="crypto"
                                    control={<Radio/>}
                                    label={
                                        <div className="flex items-center justify-between w-full py-1">
                                            <span className="font-medium">Cryptocurrency</span>
                                            <span className="text-xs text-gray-500">BTC, ETH, USDT</span>
                                        </div>
                                    }
                                    className="px-4 py-2 m-0 w-full"
                                />
                            </Paper>
                        </RadioGroup>
                    )}
                />
                {errors.paymentMethod && (
                    <Typography color="error" variant="caption" className="mt-1 block">
                        {errors.paymentMethod.message}
                    </Typography>
                )}
            </div>

            <Box className="flex justify-end pt-4">
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                >
                    Continue
                </Button>
            </Box>
        </form>
    );
}

// Card Payment Form
function CardPaymentForm({formData, onSubmit, errors, control, register}: any) {
    const formatCardNumber = (value: string) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        // Add a space after every 4 digits
        const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
        return formatted.substring(0, 19); // Limit to 16 digits + 3 spaces
    };

    const formatExpiryDate = (value: string) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');
        // Format as MM/YY
        if (digits.length > 2) {
            return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
        }
        return digits;
    };


    return (
        <div className="space-y-6">
            <TextField
                label="Cardholder Name"
                {...register("cardholderName")}
                error={!!errors.cardholderName}
                helperText={errors.cardholderName?.message}
                fullWidth
                variant="outlined"
                placeholder="John Doe"
            />

            <Controller
                name="cardNumber"
                control={control}
                render={({field}) => (
                    <TextField
                        label="Card Number"
                        value={field.value}
                        onChange={(e) => field.onChange(formatCardNumber(e.target.value))}
                        error={!!errors.cardNumber}
                        helperText={errors.cardNumber?.message}
                        fullWidth
                        variant="outlined"
                        placeholder="4242 4242 4242 4242"
                    />
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="expiryDate"
                    control={control}
                    render={({field}) => (
                        <TextField
                            label="Expiry Date (MM/YY)"
                            value={field.value}
                            onChange={(e) => field.onChange(formatExpiryDate(e.target.value))}
                            error={!!errors.expiryDate}
                            helperText={errors.expiryDate?.message}
                            variant="outlined"
                            placeholder="MM/YY"
                        />
                    )}
                />

                <TextField
                    label="CVC"
                    {...register("cvc")}
                    error={!!errors.cvc}
                    helperText={!!errors.cvc?.message}
                    variant="outlined"
                    placeholder="123"
                    inputProps={{maxLength: 4}}
                />
            </div>

            <Alert severity="info" className="mt-4">
                <Typography variant="body2" className="text-sm font-medium mb-1">
                    Test Card
                </Typography>
                <Typography variant="body2" className="text-xs">
                    4242 4242 4242 4242 • Any future date • Any 3-digit CVC
                </Typography>
            </Alert>
        </div>
    );
}


// SEPA Payment Form
function SEPAPaymentForm({formData, onSubmit, errors, control, register}: any) {
    return (
        <div className="space-y-6">
            <TextField
                label="Account Holder Name"
                {...register("accountHolderName")}
                error={!!errors.accountHolderName}
                helperText={errors.accountHolderName?.message}
                fullWidth
                variant="outlined"
                placeholder="John Doe"
            />

            <TextField
                label="IBAN"
                {...register("iban")}
                error={!!errors.iban}
                helperText={errors.iban?.message}
                fullWidth
                variant="outlined"
                placeholder="DE89 3704 0044 0532 0130 00"
            />

            <TextField
                label="BIC/SWIFT"
                {...register("bic")}
                error={!!errors.bic}
                helperText={errors.bic?.message}
                fullWidth
                variant="outlined"
                placeholder="DEUTDEFF"
            />

            <Alert severity="info" className="mt-4">
                <Typography variant="body2" className="text-xs">
                    Transfers take 1-3 business days. Use your public key as payment reference.
                </Typography>
            </Alert>
        </div>
    );
}

// Crypto Payment Form
function CryptoPaymentForm({formData, onSubmit, errors, control, register}: any) {
    return (
        <div className="space-y-6">
            <FormControl fullWidth error={!!errors.cryptoType} className="border border-gray-200 bg-gray-50">
                <FormLabel className="px-4 pt-3 font-medium">Cryptocurrency</FormLabel>
                <Controller
                    name="cryptoType"
                    control={control}
                    render={({field}) => (
                        <RadioGroup {...field} className="px-4 pb-3">
                            <FormControlLabel value="BTC" control={<Radio/>} label="Bitcoin (BTC)"/>
                            <FormControlLabel value="ETH" control={<Radio/>} label="Ethereum (ETH)"/>
                            <FormControlLabel value="USDT" control={<Radio/>} label="Tether (USDT)"/>
                        </RadioGroup>
                    )}
                />
                {errors.cryptoType && (
                    <Typography color="error" variant="caption" className="px-4 pb-2">
                        {errors.cryptoType.message}
                    </Typography>
                )}
            </FormControl>

            <TextField
                label="Wallet Address"
                {...register("walletAddress")}
                error={!!errors.walletAddress}
                helperText={errors.walletAddress?.message}
                fullWidth
                variant="outlined"
                placeholder="Enter your wallet address"
            />

            <Alert severity="info" className="mt-4">
                <Typography variant="body2" className="text-xs">
                    Tokens credited after 6 confirmations. Rate locked for 15 minutes.
                </Typography>
            </Alert>
        </div>
    );
}

// Payment Form (Step 2)
function PaymentForm({formData, onNext, onBack}: { formData: any, onNext: (data: any) => void, onBack: () => void }) {
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Determine which validation schema to use based on payment method
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
                <Alert severity="error" className="mb-4">
                    {paymentError}
                </Alert>
            )}

            <Typography variant="body2" className="text-gray-600 mb-4">
                Payment method: <strong className="text-black">{formData.paymentMethod === 'card' ? 'Card' : formData.paymentMethod === 'sepa' ? 'SEPA' : 'Crypto'}</strong>
            </Typography>

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

            <Box className="flex gap-3 mt-6">
                <Button
                    type="button"
                    variant="outlined"
                    size="large"
                    onClick={onBack}
                    fullWidth
                >
                    Back
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                >
                    Continue
                </Button>
            </Box>
        </form>
    );
}

// Confirmation Step (Step 3)
function ConfirmationStep({formData, onBack, onReset}: { formData: any, onBack: () => void, onReset: () => void }) {
    const toast = useToast();

    // Get the appropriate payment hook based on the payment method
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
            // Process payment based on the payment method
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

            // Then create token account
            /*
            await createAccount({
                publicKey: formData.publicKey,
                tokenAmount: formData.tokenAmount,
            });

             */

            setSuccess(true);
            toast.success("Payment successful! Your account has been credited with tokens.");
        } catch (e) {
            setError(String(e));
            toast.error(String(e));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render payment method details based on the selected payment method
    const renderPaymentMethodDetails = () => {
        if (formData.paymentMethod === 'card') {
            return (
                <div className="flex justify-between">
                    <Typography variant="body2" className="text-black/70">Payment Method:</Typography>
                    <Typography variant="body2" className="font-medium text-black/80">
                        Card ending in {formData.cardNumber.slice(-4)}
                    </Typography>
                </div>
            );
        } else if (formData.paymentMethod === 'sepa') {
            return (
                <div className="flex justify-between">
                    <Typography variant="body2" className="text-black/70">Payment Method:</Typography>
                    <Typography variant="body2" className="font-medium text-black/80">
                        SEPA Transfer from {formData.accountHolderName}
                    </Typography>
                </div>
            );
        } else if (formData.paymentMethod === 'crypto') {
            return (
                <div className="flex justify-between">
                    <Typography variant="body2" className="text-black/70">Payment Method:</Typography>
                    <Typography variant="body2" className="font-medium text-black/80">
                        {formData.cryptoType} Payment
                    </Typography>
                </div>
            );
        }
    };

    // Get payment status message based on the payment method
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
                <Alert severity="error" className="mb-4">
                    {error}
                </Alert>
            )}

            {success ? (
                <div className="text-center py-6">
                    <Box className="mb-4 flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    </Box>
                    <Typography variant="h5" className="font-semibold mb-2">
                        Payment Successful
                    </Typography>
                    <Typography variant="body2" className="mb-6 text-gray-600">
                        {getPaymentStatusMessage()}
                    </Typography>
                    <Button
                        onClick={onReset}
                        variant="contained"
                        size="large"
                        fullWidth
                    >
                        New Purchase
                    </Button>
                </div>
            ) : (
                <>
                    <Box className="p-6 bg-gray-50 border border-gray-200">
                        <Typography variant="subtitle1" className="font-medium mb-4">
                            Order Summary
                        </Typography>
                        <Divider className="mb-4"/>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Typography variant="body2" className="text-gray-600">Public Key:</Typography>
                                <Typography variant="body2" className="font-medium max-w-xs truncate">
                                    {formData.publicKey}
                                </Typography>
                            </div>
                            <div className="flex justify-between">
                                <Typography variant="body2" className="text-gray-600">Token Amount:</Typography>
                                <Typography variant="body2" className="font-medium">
                                    {CMTSToken.create(formData.tokenAmount).toString()} tokens
                                </Typography>
                            </div>
                            {renderPaymentMethodDetails()}
                            <Divider className="my-3"/>
                            <div className="flex justify-between">
                                <Typography variant="subtitle2" className="font-medium">Total:</Typography>
                                <Typography variant="subtitle2" className="font-semibold">
                                    {converter.invert(CMTSToken.create(formData.tokenAmount)).toString()}
                                </Typography>
                            </div>
                        </div>
                    </Box>

                    <Box className="flex justify-center mt-4">
                        <Captcha
                            type="mixed"
                            length={6}
                            onValidate={(isValid) => {
                                console.log('Captcha validated:', isValid);
                                setCaptchaValidated(isValid);
                            }}
                            showSuccessAnimation
                        />
                    </Box>

                    <Box className="flex justify-between mt-6">
                        <Button
                            type="button"
                            variant="outlined"
                            size="large"
                            onClick={onBack}
                            disabled={isSubmitting}

                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            size="large"
                            disabled={isSubmitting || !captchaValidated}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center">
                                    <CircularProgress size={20} className="mr-2"/>
                                    Processing...
                                </div>
                            ) : (
                                "Complete Purchase"
                            )}
                        </Button>
                    </Box>
                </>
            )}
        </div>
    );
}
