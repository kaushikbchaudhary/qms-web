"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mail, Phone, ChevronDown, ArrowLeft, RefreshCw } from 'lucide-react';
import {Button} from "@/components/ui/button";
import {useRequestOtp, useVerifyOtp, usePasswordLogin} from "@/hooks/api/useAuth";
// import {useRouter} from "next/navigation";
import {roles} from "@/config/roles";
import {useAuthStore} from "@/stores/authStore";
import { usePublicSiteConfig } from "@/hooks/api/useSiteConfig";

const Input = ({ className = '', type = 'text', ...props }) => (
    <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
    />
);

const Label = ({ className = '', ...props }) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
);

const Card = ({ className = '', ...props }) => (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
);

const CardHeader = ({ className = '', ...props }) => (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

const CardTitle = ({ className = '', ...props }) => (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
);

const CardDescription = ({ className = '', ...props }) => (
    <p className={`text-sm text-muted-foreground ${className}`} {...props} />
);

const CardContent = ({ className = '', ...props }) => (
    <div className={`p-6 pt-0 ${className}`} {...props} />
);

const Select = ({ children, value, onValueChange, className = '' }:{children:any,value:any,onValueChange:any,className?:any}) => {
    const [open, setOpen] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setOpen(!open)}
            >
                <span className="truncate">{value || 'Select...'}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
            {open && (
                <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                    {React.Children.map(children, child =>
                        React.cloneElement(child, {
                            onClick: () => {
                                onValueChange(child.props.value);
                                setOpen(false);
                            }
                        })
                    )}
                </div>
            )}
        </div>
    );
};

const SelectItem = ({ value, children, onClick }:any) => (
    <div
        className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        onClick={onClick}
    >
        {children}
    </div>
);

// OTP Verification Component
const OTPVerification = ({
                             contactInfo,
                             contactType,
                             onVerify,
                             onBack,
                             onResendOTP
                         }:any) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const inputRefs = useRef<any>([]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(timer - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    useEffect(() => {
        inputRefs.current?.[0]?.focus();
    }, []);

    const handleOtpChange = (index:any, value:any) => {
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index:any, e:any) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) return;

        setIsVerifying(true);
        // Simulate API call
        setTimeout(() => {
            setIsVerifying(false);
            onVerify(otpCode);
        }, 1500);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleVerify();
    };

    const handleResend = () => {
        setTimer(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        onResendOTP();
        setTimeout(() => {
            inputRefs.current?.[0]?.focus();
        }, 0);
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {contactType === 'email' ? (
                        <Mail className="h-8 w-8 text-primary" />
                    ) : (
                        <Phone className="h-8 w-8 text-primary" />
                    )}
                </div>
                <h2 className="text-2xl font-semibold">Verify Your {contactType === 'email' ? 'Email' : 'Phone'}</h2>
                <p className="text-muted-foreground">
                    We've sent a 6-digit code to
                </p>
                <p className="font-medium">{contactInfo}</p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-center space-x-2">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el:any) => inputRefs.current[index] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-semibold border border-input rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
                        />
                    ))}
                </div>

                <Button
                    type="submit"
                    disabled={otp.join('').length !== 6 || isVerifying}
                    className="w-full"
                    size="lg"
                >
                    {isVerifying ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        'Verify OTP'
                    )}
                </Button>
            </div>

            <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                </p>

                {canResend ? (
                    <Button type="button" variant="ghost" onClick={handleResend}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Code
                    </Button>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Resend code in {timer}s
                    </p>
                )}
            </div>

            <Button type="button" variant="ghost" onClick={onBack} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Button>
        </form>
    );
};

// Country codes data
const countryCodes = [
    { code: '+91', country: 'IN', flag: '🇮🇳' },
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+86', country: 'CN', flag: '🇨🇳' },
    { code: '+49', country: 'DE', flag: '🇩🇪' },
    { code: '+33', country: 'FR', flag: '🇫🇷' },
    { code: '+81', country: 'JP', flag: '🇯🇵' },
    { code: '+82', country: 'KR', flag: '🇰🇷' },
    { code: '+61', country: 'AU', flag: '🇦🇺' },
    { code: '+55', country: 'BR', flag: '🇧🇷' },
];

export default function LoginPage() {
    const [step, setStep] = useState('login'); // 'login' or 'otp'
    const [loginMethod, setLoginMethod] = useState('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [password, setPassword] = useState('');
    // const [isLoading, setIsLoading] = useState(false);
    const { mutate: otpRequest, isPending:isLoading } = useRequestOtp()
    const { mutate: otpVerify, isPending:isVerifying } = useVerifyOtp()
    const { mutateAsync: passwordLogin, isPending: isPasswordLoggingIn } = usePasswordLogin();
    const { data: siteConfigData, isLoading: isSiteConfigLoading } = usePublicSiteConfig();

    const loginMode = siteConfigData?.loginMode ?? 'OTP';
    const isPasswordMode = loginMode === 'PASSWORD';

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = useMemo(() => emailPattern.test(email.trim()), [email]);
    const isPhoneValid = useMemo(() => phone.replace(/\D/g, '').length >= 6, [phone]);
    const isContactValid = loginMethod === 'email' ? isEmailValid : isPhoneValid;
    const isPasswordValid = useMemo(() => password.length >= 6, [password]);

    const handleSendOTP = async () => {
        if (!isContactValid) return;

        const trimmedEmail = email.trim();
        const contactInfo = loginMethod === 'email' ? trimmedEmail : `${countryCode}${phone}`;

        // setIsLoading(true);

         otpRequest({email: contactInfo},{
             onSuccess: () => {
                 // setIsLoading(false);
                 setStep('otp');
             },
             onError: (error) => {
                 // error handling here
             }
         })

    };

    const roleRedirects: Record<string, string> = {
        admin: '/admin/dashboard',
        [roles.SUPER_ADMIN]: '/',
        staff: '/staff/patients',
    };
    // const router = useRouter()

    useEffect(() => {
        if (isPasswordMode && step !== 'login') {
            setStep('login');
        }
    }, [isPasswordMode, step]);

    useEffect(() => {
        if (isPasswordMode && loginMethod !== 'email') {
            setLoginMethod('email');
        }
    }, [isPasswordMode, loginMethod]);

    useEffect(() => {
        if (!isPasswordMode && password) {
            setPassword('');
        }
    }, [isPasswordMode, password]);


    const handleVerifyOTP = (otpCode:any) => {
        const trimmedEmail = email.trim();
        const contactInfo = loginMethod === 'email' ? trimmedEmail : `${countryCode}${phone}`;
        // Handle successful verification - redirect to dashboard
        otpVerify({email: contactInfo, otp: otpCode },{
            onSuccess: (user:any) => {
                // Save to Zustand store
                useAuthStore.getState().login(user.data);

                const role = user.data.role?.[0]; // Assuming user data has a role field
                const redirectPath:string = roleRedirects[role] || '/';

                // Nuclear option - works 100% of the time
                setTimeout(() => {
                    window.location.href = redirectPath;
                }, 100);
            },
            onError: (error) => {
                // error handling here
            }
        })
        // alert('Login successful!');
    };

    const handleResendOTP = () => {
        handleSendOTP();
        // Handle OTP resend logic
    };

    const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isPasswordMode) return;
        handleSendOTP();
    };

    const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isPasswordMode) return;
        if (!isEmailValid || !isPasswordValid) return;

        try {
            const response = await passwordLogin({
                email: email.trim().toLowerCase(),
                password,
            });

            const userData = response?.data;
            if (userData) {
                setPassword('');
                useAuthStore.getState().login(userData);
                const role = userData.role?.[0];
                const redirectPath: string = roleRedirects[role] || '/';
                setTimeout(() => {
                    window.location.href = redirectPath;
                }, 100);
            }
        } catch (error) {
            // handled via mutation toast
        }
    };

    const handleBackToLogin = () => {
        setStep('login');
    };

    const selectedCountry = countryCodes.find(c => c.code === countryCode);
    const contactInfo = loginMethod === 'email' ? email : `${countryCode}${phone}`;

    if (isSiteConfigLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="text-sm text-muted-foreground">Loading sign-in options...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-[1200px] min-w-sm">
                <Card>
                    {step === 'login' ? (
                        <>
                            <CardHeader className="text-center">
                                <CardTitle>Welcome Back</CardTitle>
                                <CardDescription>
                                    {isPasswordMode ? 'Sign in with your email and password.' : 'Enter your email to continue'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {isPasswordMode ? (
                                    <form className="space-y-6" onSubmit={handlePasswordSubmit} noValidate>
                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e:any) => setEmail(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2 w-full">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Enter password"
                                                value={password}
                                                onChange={(e:any) => setPassword(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Default password for new accounts is <span className="font-semibold tracking-widest">000000</span>.
                                            </p>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={!isEmailValid || !isPasswordValid || isPasswordLoggingIn}
                                            className="w-full"
                                            size="lg"
                                        >
                                            {isPasswordLoggingIn ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    Signing in...
                                                </>
                                            ) : (
                                                'Sign In'
                                            )}
                                        </Button>
                                    </form>
                                ) : (
                                    <form className="space-y-6" onSubmit={handleLoginSubmit} noValidate>
                                        {loginMethod === 'email' && (
                                            <div className="space-y-2 w-full">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    value={email}
                                                    onChange={(e:any) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {loginMethod === 'phone' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={`${selectedCountry?.flag} ${countryCode}`}
                                                        onValueChange={setCountryCode}
                                                        className="w-28"
                                                    >
                                                        {countryCodes.map((country) => (
                                                            <SelectItem key={country.code} value={country.code}>
                                                                {country.flag} {country.code}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    <Input
                                                        id="phone"
                                                        type="tel"
                                                        placeholder="Enter phone number"
                                                        value={phone}
                                                        onChange={(e:any) => setPhone(e.target.value)}
                                                        className="flex-1"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            disabled={isLoading || !isContactValid}
                                            className="w-full"
                                            size="lg"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                'Send OTP'
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </>
                    ) : (
                        <CardContent>
                            <OTPVerification
                                contactInfo={contactInfo}
                                contactType={loginMethod}
                                onVerify={handleVerifyOTP}
                                onBack={handleBackToLogin}
                                onResendOTP={handleResendOTP}
                            />
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}
