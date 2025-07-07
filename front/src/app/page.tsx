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

import {useConnectionNodeUrl} from '@/app/connection.context';
import {
    useCreateTokenAccount,
    useCardPayment,
    useSEPAPayment,
    useCryptoPayment,
    CardPaymentData,
    SEPAPaymentData,
    CryptoPaymentData
} from '@/app/api';
import {useToast} from '@/app/notification.context';
import {usePathname} from "next/navigation";
import {CMTSToken, CurrencyConverterFactory} from "@cmts-dev/carmentis-sdk/client";

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar/>
            <main className="flex-grow py-16 relative">
                {/* Background with subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white to-neutral-50 -z-10"></div>
                {/* Glass pattern overlay */}
                <div className="absolute inset-0 opacity-30 -z-10"
                     style={{
                         backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23f5f5f5\' fill-opacity=\'0.6\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
                     }}>
                </div>
                <Container maxWidth="lg" className="h-full flex items-center justify-center">
                    <PaymentCard/>
                </Container>
            </main>
            <Footer/>
        </div>
    );
}

function Navbar() {
    const nodeUrl = useConnectionNodeUrl();

    return (
        <AppBar position="sticky" elevation={0} className="glass border-b border-white/30">
            <Toolbar className="flex justify-between py-2">
                <div className="flex items-center space-x-2">
                    <Image src="/carmentis.svg" alt="Carmentis Logo" width={32} height={32}/>
                    <Typography variant="h6" className="font-semibold">
                        Carmentis <span className="text-black/70">Exchange</span>
                    </Typography>
                </div>

                <div className="flex space-x-4 items-center">
                    <Tooltip title={nodeUrl || "Connecting..."}>
                        <Chip
                            label={nodeUrl ? "Node connected" : "Connecting..."}
                            color={nodeUrl ? "success" : "default"}
                            size="small"
                            variant="outlined"
                            className="text-xs glass-light glass-no-border"
                        />
                    </Tooltip>

                </div>
            </Toolbar>
        </AppBar>
    );
}

function Footer() {
    return (
        <Box component="footer" className="py-4 px-6 glass-dark border-t border-white/30">
            <Container maxWidth="lg">
                <div className="flex justify-between items-center">
                    <Typography variant="body2" className="text-black/60">
                        © {new Date().getFullYear()} Carmentis Exchange
                    </Typography>
                    <Typography variant="body2" className="text-black/60">
                        Powered by Carmentis
                    </Typography>
                </div>
            </Container>
        </Box>
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
        <Card className="w-full max-w-2xl glass rounded-xl overflow-hidden">
            <Box className="glass-light p-6 border-b border-white/30">
                <div className="flex items-center space-x-3 mb-2">
                    <Image src="/carmentis.svg" alt="Carmentis Logo" width={32} height={32}/>
                    <Typography variant="h5" className="font-semibold text-black/80">Token Exchange</Typography>
                </div>
                <Typography variant="body2" className="text-black/70">
                    Quickly and securely purchase Carmentis tokens for your account.
                </Typography>
            </Box>

            <Box className="px-6 pt-4">
                <Stepper activeStep={activeStep} alternativeLabel className="mb-6">
                    {steps.map((label) => (
                        <Step key={label} sx={{textColor: "#000"}}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            <CardContent className="p-6 pt-2">
                {activeStep === 0 && (
                    <>
                        <Typography variant="h6" className="mb-4 font-medium text-black/80">
                            Account Details
                        </Typography>
                        <AccountDetailsForm formData={formData} onNext={handleNext}/>
                    </>
                )}

                {activeStep === 1 && (
                    <>
                        <Typography variant="h6" className="mb-4 font-medium text-black/80">
                            Payment Information
                        </Typography>
                        <PaymentForm formData={formData} onNext={handleNext} onBack={handleBack}/>
                    </>
                )}

                {activeStep === 2 && (
                    <>
                        <Typography variant="h6" className="mb-4 font-medium text-black/80">
                            Confirmation
                        </Typography>
                        <ConfirmationStep formData={formData} onBack={handleBack} onReset={handleReset}/>
                    </>
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
            setEuroAmount(euros.getAmount());
        }
    }, [tokenAmount]);



    const onSubmit = (data: any) => {
        onNext(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <TextField
                label="Public Key"
                {...register("publicKey")}
                error={!!errors.publicKey}
                helperText={errors.publicKey?.message}
                fullWidth
                variant="outlined"
                placeholder="Enter your public key"
                className="mb-4 glass-light"
                InputProps={{
                    className: "border-white/30"
                }}
            />

            <TextField
                label="Token Amount"
                type="number"
                {...register("tokenAmount")}
                error={!!errors.tokenAmount}
                helperText={errors.tokenAmount?.message}
                fullWidth
                variant="outlined"
                placeholder="Enter amount of tokens"
                className="glass-light"
                InputProps={{
                    className: "border-white/30"
                }}
            />

            {euroAmount && (
                <Typography variant="body2" className="text-gray-600 mt-1 ml-2">
                    Equivalent: {euroAmount} €
                </Typography>
            )}

            <FormControl component="fieldset" className="mt-6 w-full">
                <FormLabel component="legend" className="text-black/80 mb-2">Payment Method</FormLabel>
                <Controller
                    name="paymentMethod"
                    control={control}
                    render={({field}) => (
                        <RadioGroup {...field} className="glass-light p-4 rounded-lg border border-white/30">
                            <FormControlLabel
                                value="card"
                                control={<Radio sx={{ color: 'rgba(0, 0, 0, 0.54)', '&.Mui-checked': { color: 'rgba(0, 0, 0, 0.54)' } }}/>}
                                label={
                                    <div className="flex items-center">
                                        <span className="mr-2">Card Payment</span>
                                        <Chip size="small" label="Visa, Mastercard, Amex" className="text-xs"/>
                                    </div>
                                }
                                className="mb-2"
                            />
                            <FormControlLabel
                                value="sepa"
                                control={<Radio sx={{ color: 'rgba(0, 0, 0, 0.54)', '&.Mui-checked': { color: 'rgba(0, 0, 0, 0.54)' } }}/>}
                                label={
                                    <div className="flex items-center">
                                        <span className="mr-2">SEPA Transfer</span>
                                        <Chip size="small" label="European Bank Transfer" className="text-xs"/>
                                    </div>
                                }
                                className="mb-2"
                            />
                            <FormControlLabel
                                value="crypto"
                                control={<Radio sx={{ color: 'rgba(0, 0, 0, 0.54)', '&.Mui-checked': { color: 'rgba(0, 0, 0, 0.54)' } }}/>}
                                label={
                                    <div className="flex items-center">
                                        <span className="mr-2">Cryptocurrency</span>
                                        <Chip size="small" label="BTC, ETH, USDT" className="text-xs"/>
                                    </div>
                                }
                            />
                        </RadioGroup>
                    )}
                />
                {errors.paymentMethod && (
                    <Typography color="error" variant="caption" className="mt-1">
                        {errors.paymentMethod.message}
                    </Typography>
                )}
            </FormControl>

            <Box className="flex justify-end mt-6">
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    className="py-3 px-6 rounded-lg glass-light glass-hover"
                >
                    Continue to Payment
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
                className="mb-4 glass-light"
                InputProps={{
                    className: "border-white/30"
                }}
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
                        className="mb-4 glass-light"
                        InputProps={{
                            className: "border-white/30"
                        }}
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
                            className="glass-light"
                            InputProps={{
                                className: "border-white/30"
                            }}
                        />
                    )}
                />

                <TextField
                    label="CVC"
                    {...register("cvc")}
                    error={!!errors.cvc}
                    helperText={errors.cvc?.message}
                    variant="outlined"
                    placeholder="123"
                    className="glass-light"
                    InputProps={{
                        className: "border-white/30",
                        inputProps: {maxLength: 4}
                    }}
                />
            </div>

            <Box className="mt-6 p-4 glass-dark rounded-lg">
                <Typography variant="subtitle2" className="mb-2 font-medium text-black/80">
                    Test Cards (for development only):
                </Typography>
                <Typography variant="body2" className="text-black/70">
                    • Visa: 4242 4242 4242 4242<br/>
                    Use any future expiry date and any 3-digit CVC.
                </Typography>
            </Box>
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
                className="mb-4 glass-light"
                InputProps={{
                    className: "border-white/30"
                }}
            />

            <TextField
                label="IBAN"
                {...register("iban")}
                error={!!errors.iban}
                helperText={errors.iban?.message}
                fullWidth
                variant="outlined"
                placeholder="DE89 3704 0044 0532 0130 00"
                className="mb-4 glass-light"
                InputProps={{
                    className: "border-white/30"
                }}
            />

            <TextField
                label="BIC/SWIFT"
                {...register("bic")}
                error={!!errors.bic}
                helperText={errors.bic?.message}
                fullWidth
                variant="outlined"
                placeholder="DEUTDEFF"
                className="glass-light"
                InputProps={{
                    className: "border-white/30"
                }}
            />

            <Box className="mt-6 p-4 glass-dark rounded-lg">
                <Typography variant="subtitle2" className="mb-2 font-medium text-black/80">
                    SEPA Transfer Information:
                </Typography>
                <Typography variant="body2" className="text-black/70">
                    • Please use your public key as the payment reference<br/>
                    • Transfers typically take 1-3 business days to process<br/>
                    • No additional fees are charged for SEPA transfers
                </Typography>
            </Box>
        </div>
    );
}

// Crypto Payment Form
function CryptoPaymentForm({formData, onSubmit, errors, control, register}: any) {
    return (
        <div className="space-y-6">
            <FormControl fullWidth className="mb-4 glass-light" error={!!errors.cryptoType}>
                <FormLabel className="px-3 pt-2">Cryptocurrency</FormLabel>
                <Controller
                    name="cryptoType"
                    control={control}
                    render={({field}) => (
                        <RadioGroup {...field} className="px-3 pb-2">
                            <FormControlLabel value="BTC" control={<Radio sx={{ color: 'rgba(0, 0, 0, 0.54)', '&.Mui-checked': { color: 'rgba(0, 0, 0, 0.54)' } }}/>} label="Bitcoin (BTC)"/>
                            <FormControlLabel value="ETH" control={<Radio sx={{ color: 'rgba(0, 0, 0, 0.54)', '&.Mui-checked': { color: 'rgba(0, 0, 0, 0.54)' } }}/>} label="Ethereum (ETH)"/>
                            <FormControlLabel value="USDT" control={<Radio sx={{ color: 'rgba(0, 0, 0, 0.54)', '&.Mui-checked': { color: 'rgba(0, 0, 0, 0.54)' } }}/>} label="Tether (USDT)"/>
                        </RadioGroup>
                    )}
                />
                {errors.cryptoType && (
                    <Typography color="error" variant="caption" className="px-3 pb-2">
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
                className="glass-light"
                InputProps={{
                    className: "border-white/30"
                }}
            />

            <Box className="mt-6 p-4 glass-dark rounded-lg">
                <Typography variant="subtitle2" className="mb-2 font-medium text-black/80">
                    Cryptocurrency Payment Information:
                </Typography>
                <Typography variant="body2" className="text-black/70">
                    • Tokens will be credited after 6 confirmations on the blockchain<br/>
                    • Please ensure you send from a wallet you control<br/>
                    • The exchange rate will be locked for 15 minutes
                </Typography>
            </Box>
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

            <Box className="mb-4 p-3 glass-dark rounded-lg">
                <Typography variant="body2" className="text-black/70">
                    Selected payment
                    method: <strong>{formData.paymentMethod === 'card' ? 'Card Payment' : formData.paymentMethod === 'sepa' ? 'SEPA Transfer' : 'Cryptocurrency'}</strong>
                </Typography>
            </Box>

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

            <Box className="flex justify-between mt-6">
                <Button
                    type="button"
                    variant="outlined"
                    size="large"
                    onClick={onBack}
                    className="py-3 px-6 rounded-lg glass-dark glass-hover"
                >
                    Back
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    className="py-3 px-6 rounded-lg glass-light glass-hover"
                >
                    Review Order
                </Button>
            </Box>
        </form>
    );
}

// Confirmation Step (Step 3)
function ConfirmationStep({formData, onBack, onReset}: { formData: any, onBack: () => void, onReset: () => void }) {
    const toast = useToast();
    const {createAccount, loading: isCreatingAccount} = useCreateTokenAccount();

    // Get the appropriate payment hook based on the payment method
    const {processPayment: processCardPayment, loading: isProcessingCardPayment} = useCardPayment();
    const {processPayment: processSEPAPayment, loading: isProcessingSEPAPayment} = useSEPAPayment();
    const {processPayment: processCryptoPayment, loading: isProcessingCryptoPayment} = useCryptoPayment();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const converter = CurrencyConverterFactory.defaultEurosToCMTSTokenConverter();

    const handleSubmit = async () => {
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
            await createAccount({
                publicKey: formData.publicKey,
                tokenAmount: formData.tokenAmount,
            });

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
                    <Typography variant="h5" className="font-semibold mb-2 text-black/80">
                        Transaction Complete!
                    </Typography>
                    <Typography variant="body1" className="mb-6 text-black/70">
                        {getPaymentStatusMessage()}
                    </Typography>
                    <Button
                        onClick={onReset}
                        variant="contained"
                        size="large"
                        className="py-3 px-6 rounded-lg glass-light glass-hover"
                    >
                        Start New Purchase
                    </Button>
                </div>
            ) : (
                <>
                    <Box className="glass-dark p-4 rounded-lg">
                        <Typography variant="subtitle1" className="font-medium mb-2 text-black/80">
                            Order Summary
                        </Typography>
                        <Divider className="mb-3"/>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Typography variant="body2" className="text-black/70">Public Key:</Typography>
                                <Typography variant="body2" className="font-medium text-black/80 max-w-xs truncate">
                                    {formData.publicKey}
                                </Typography>
                            </div>
                            <div className="flex justify-between">
                                <Typography variant="body2" className="text-black/70">Token Amount:</Typography>
                                <Typography variant="body2" className="font-medium text-black/80">
                                    {CMTSToken.create(formData.tokenAmount).toString()} tokens
                                </Typography>
                            </div>
                            {renderPaymentMethodDetails()}
                            <Divider className="my-2"/>
                            <div className="flex justify-between">
                                <Typography variant="subtitle2" className="text-black/80">Total:</Typography>
                                <Typography variant="subtitle2" className="font-semibold text-black/80">
                                    {converter.invert(CMTSToken.create(formData.tokenAmount)).toString()}
                                </Typography>
                            </div>
                        </div>
                    </Box>

                    <Box className="flex justify-between mt-6">
                        <Button
                            type="button"
                            variant="outlined"
                            size="large"
                            onClick={onBack}
                            disabled={isSubmitting}
                            className="py-3 px-6 rounded-lg glass-dark glass-hover"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            size="large"
                            disabled={isSubmitting}
                            className="py-3 px-6 rounded-lg glass-light glass-hover"
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
