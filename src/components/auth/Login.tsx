"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, ChevronDown, ArrowLeft, RefreshCw } from 'lucide-react';
import {Button} from "@/components/ui/button";
import {useRequestOtp, useVerifyOtp} from "@/hooks/api/useAuth";
// import {useRouter} from "next/navigation";
import {roles} from "@/config/roles";
import {useAuthStore} from "@/stores/authStore";

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

    const handleResend = () => {
        setTimer(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        onResendOTP();
    };

    return (
        <div className="space-y-6">
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
                    onClick={handleVerify}
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
                    <Button variant="ghost" onClick={handleResend}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Code
                    </Button>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Resend code in {timer}s
                    </p>
                )}
            </div>

            <Button variant="ghost" onClick={onBack} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Button>
        </div>
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
    // const [isLoading, setIsLoading] = useState(false);
    const { mutate: otpRequest, isPending:isLoading } = useRequestOtp()
    const { mutate: otpVerify, isPending:isVerifying } = useVerifyOtp()

    const handleSendOTP = async () => {
        const contactInfo = loginMethod === 'email' ? email : `${countryCode}${phone}`;

        if (!contactInfo || (loginMethod === 'email' && !email) || (loginMethod === 'phone' && !phone)) {
            return;
        }

        // setIsLoading(true);

         otpRequest({email},{
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


    const handleVerifyOTP = (otpCode:any) => {
        const contactInfo = loginMethod === 'email' ? email : `${countryCode}${phone}`;
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
        const contactInfo = loginMethod === 'email' ? email : `${countryCode}${phone}`;
        handleSendOTP();
        // Handle OTP resend logic
    };

    const handleBackToLogin = () => {
        setStep('login');
    };

    const selectedCountry = countryCodes.find(c => c.code === countryCode);
    const contactInfo = loginMethod === 'email' ? email : `${countryCode}${phone}`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-[1200px] min-w-sm">
                <Card>
                    {step === 'login' ? (
                        <>
                            <CardHeader className="text-center">
                                <CardTitle>Welcome Back</CardTitle>
                                <CardDescription>
                                    Enter your email to continue
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-6">
                                    {/* Login Method Toggle */}
                                    {/*<div className="flex rounded-lg border p-1 bg-muted">*/}
                                    {/*    <button*/}
                                    {/*        type="button"*/}
                                    {/*        onClick={() => setLoginMethod('email')}*/}
                                    {/*        className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${*/}
                                    {/*            loginMethod === 'email'*/}
                                    {/*                ? 'bg-background text-foreground shadow-sm'*/}
                                    {/*                : 'text-muted-foreground hover:text-foreground'*/}
                                    {/*        }`}*/}
                                    {/*    >*/}
                                    {/*        <Mail className="h-4 w-4" />*/}
                                    {/*        Email*/}
                                    {/*    </button>*/}
                                    {/*    <button*/}
                                    {/*        type="button"*/}
                                    {/*        onClick={() => setLoginMethod('phone')}*/}
                                    {/*        className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${*/}
                                    {/*            loginMethod === 'phone'*/}
                                    {/*                ? 'bg-background text-foreground shadow-sm'*/}
                                    {/*                : 'text-muted-foreground hover:text-foreground'*/}
                                    {/*        }`}*/}
                                    {/*    >*/}
                                    {/*        <Phone className="h-4 w-4" />*/}
                                    {/*        Phone*/}
                                    {/*    </button>*/}
                                    {/*</div>*/}

                                    {/* Email Input */}
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

                                    {/* Phone Input */}
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

                                    {/* Send OTP Button */}
                                    <Button
                                        onClick={handleSendOTP}
                                        disabled={isLoading || (!email && loginMethod === 'email') || (!phone && loginMethod === 'phone')}
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

                                    {/* Divider */}
                      {/*              <div className="relative">*/}
                      {/*                  <div className="absolute inset-0 flex items-center">*/}
                      {/*                      <span className="w-full border-t border-muted" />*/}
                      {/*                  </div>*/}
                      {/*                  <div className="relative flex justify-center text-xs uppercase">*/}
                      {/*<span className="bg-background px-2 text-muted-foreground">*/}
                      {/*  Or continue with*/}
                      {/*</span>*/}
                      {/*                  </div>*/}
                      {/*              </div>*/}

                                    {/* Social Login Buttons */}
                                    {/*<div className="grid grid-cols-2 gap-3">*/}
                                    {/*    <Button variant="outline" type="button">*/}
                                    {/*        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">*/}
                                    {/*            <path*/}
                                    {/*                fill="currentColor"*/}
                                    {/*                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"*/}
                                    {/*            />*/}
                                    {/*            <path*/}
                                    {/*                fill="currentColor"*/}
                                    {/*                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"*/}
                                    {/*            />*/}
                                    {/*            <path*/}
                                    {/*                fill="currentColor"*/}
                                    {/*                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"*/}
                                    {/*            />*/}
                                    {/*            <path*/}
                                    {/*                fill="currentColor"*/}
                                    {/*                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"*/}
                                    {/*            />*/}
                                    {/*        </svg>*/}
                                    {/*        Google*/}
                                    {/*    </Button>*/}
                                    {/*    <Button variant="outline" type="button">*/}
                                    {/*        <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">*/}
                                    {/*            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>*/}
                                    {/*        </svg>*/}
                                    {/*        Facebook*/}
                                    {/*    </Button>*/}
                                    {/*</div>*/}

                                    {/* Sign Up Link */}
                                    {/*<p className="text-center text-sm text-muted-foreground">*/}
                                    {/*    Don't have an account?{' '}*/}
                                    {/*    <button*/}
                                    {/*        type="button"*/}
                                    {/*        className="text-primary hover:underline font-medium"*/}
                                    {/*    >*/}
                                    {/*        Sign up*/}
                                    {/*    </button>*/}
                                    {/*</p>*/}
                                </div>
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