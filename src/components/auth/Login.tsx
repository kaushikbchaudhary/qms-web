"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roles } from "@/config/roles";
import { useRequestOtp, useVerifyOtp, usePasswordLogin } from "@/hooks/api/useAuth";
import { usePublicSiteConfig } from "@/hooks/api/useSiteConfig";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

type OTPVerificationProps = {
  contactInfo: string;
  contactType: "email" | "phone";
  onVerify: (otp: string) => void;
  onBack: () => void;
  onResendOTP: () => void;
  isLoading: boolean;
};

const OTPVerification = ({
  contactInfo,
  contactType,
  onVerify,
  onBack,
  onResendOTP,
  isLoading,
}: OTPVerificationProps) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setTimer(30);
    setCanResend(false);
  }, [contactInfo]);

  useEffect(() => {
    const countdown =
      timer > 0
        ? window.setInterval(() => setTimer((prev) => prev - 1), 1000)
        : undefined;

    if (timer === 0) {
      setCanResend(true);
    }

    return () => {
      if (countdown) window.clearInterval(countdown);
    };
  }, [timer]);

  useEffect(() => {
    inputRefs.current?.[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "");
    if (digit.length > 1) return;

    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    if (digit && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = otp.join("");
    if (code.length === 6) {
      onVerify(code);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(Array(6).fill(""));
    setTimer(30);
    setCanResend(false);
    onResendOTP();
    requestAnimationFrame(() => inputRefs.current?.[0]?.focus());
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 text-center">
        <Badge
          variant="secondary"
          className="mx-auto w-fit border border-primary/40 bg-primary/10 text-primary"
        >
          Two-factor verification
        </Badge>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          {contactType === "email" ? <Mail className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
        </div>
        <h2 className="text-2xl font-semibold">Enter the 6-digit code</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a secure code to <span className="font-medium">{contactInfo}</span>.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={(element) => (inputRefs.current[index] = element)}
            value={digit}
            maxLength={1}
            inputMode="numeric"
            onChange={(event) => handleOtpChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className="h-12 w-12 text-center text-lg font-semibold uppercase tracking-widest"
          />
        ))}
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          disabled={otp.join("").length !== 6 || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify code"
          )}
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          {canResend ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResend}
              className="text-primary hover:text-primary"
            >
              Resend code
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Resend available in {timer}s
            </div>
          )}

          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Use a different method
          </Button>
        </div>
      </div>
    </form>
  );
};

const countryCodes = [
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
];

const featureHighlights = [
  {
    icon: ShieldCheck,
    title: "Audit-ready compliance",
    description: "Part 11 ready workflows with full traceability.",
  },
  {
    icon: Sparkles,
    title: "Guided CAPA journeys",
    description: "Automated reminders keep corrective actions on track.",
  },
  {
    icon: Clock,
    title: "Real-time visibility",
    description: "Monitor device issues and complaints from a single hub.",
  },
];

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [password, setPassword] = useState("");

  const { mutate: requestOtp, isPending: isOtpRequesting } = useRequestOtp();
  const { mutate: verifyOtp, isPending: isOtpVerifying } = useVerifyOtp();
  const { mutateAsync: passwordLogin, isPending: isPasswordLoggingIn } = usePasswordLogin();
  const { data: siteConfigData, isLoading: isSiteConfigLoading } = usePublicSiteConfig();
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";

  const loginMode = siteConfigData?.loginMode ?? "OTP";
  const isPasswordMode = loginMode === "PASSWORD";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = useMemo(() => emailPattern.test(email.trim()), [email]);
  const isPhoneValid = useMemo(() => phone.replace(/\D/g, "").length >= 6, [phone]);
  const isContactValid = loginMethod === "email" ? isEmailValid : isPhoneValid;
  const isPasswordValid = useMemo(() => password.length >= 6, [password]);

  const roleRedirects: Record<string, string> = {
    admin: "/admin/dashboard",
    [roles.SUPER_ADMIN]: "/",
    staff: "/staff/patients",
  };

  useEffect(() => {
    if (isPasswordMode && step !== "login") {
      setStep("login");
    }
  }, [isPasswordMode, step]);

  useEffect(() => {
    if (isPasswordMode && loginMethod !== "email") {
      setLoginMethod("email");
    }
  }, [isPasswordMode, loginMethod]);

  useEffect(() => {
    if (!isPasswordMode && password) {
      setPassword("");
    }
  }, [isPasswordMode, password]);

  const handleSendOTP = () => {
    if (!isContactValid) return;

    const contact =
      loginMethod === "email"
        ? email.trim().toLowerCase()
        : `${countryCode}${phone.replace(/\D/g, "")}`;

    requestOtp(
      { email: contact },
      {
        onSuccess: () => setStep("otp"),
      },
    );
  };

  const handleVerifyOTP = (otpCode: string) => {
    const contact =
      loginMethod === "email"
        ? email.trim().toLowerCase()
        : `${countryCode}${phone.replace(/\D/g, "")}`;

    verifyOtp(
      { email: contact, otp: otpCode },
      {
        onSuccess: (user) => {
          useAuthStore.getState().login(user.data);
          const role = user.data.role?.[0];
          const redirectPath = roleRedirects[role] || "/";
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 100);
        },
      },
    );
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPasswordMode) return;
    handleSendOTP();
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isPasswordMode || !isEmailValid || !isPasswordValid) return;

    try {
      const response = await passwordLogin({
        email: email.trim().toLowerCase(),
        password,
      });

      const userData = response?.data;
      if (userData) {
        setPassword("");
        useAuthStore.getState().login(userData);
        const role = userData.role?.[0];
        const redirectPath = roleRedirects[role] || "/";
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 100);
      }
    } catch {
      // handled via mutation toast
    }
  };

  const handleBackToLogin = () => {
    setStep("login");
  };

  const handleResendOTP = () => {
    handleSendOTP();
  };

  const contactInfo =
    loginMethod === "email"
      ? email.trim()
      : `${countryCode}${phone.replace(/\D/g, "") || "•••••"}`;

  if (isSiteConfigLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading sign-in options…</div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-133px)] max-h-[calc(100vh-133px)] overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 animate-gradient-slow bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_100%_0%,rgba(139,92,246,0.18),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.16),transparent_45%)]"
        style={{
          backgroundBlendMode: "screen",
          filter: isDarkTheme ? "brightness(0.8)" : "brightness(1)",
        }}
      />
      <div
        aria-hidden
        className={cn(
          "absolute -inset-[50%] -z-10 rounded-full blur-3xl animate-blob-float",
          isDarkTheme
            ? "bg-[radial-gradient(circle,rgba(30,64,175,0.25)_0%,transparent_65%)]"
            : "bg-[radial-gradient(circle,rgba(59,130,246,0.35)_0%,transparent_65%)]",
        )}
      />

      <div className="relative mx-auto flex h-full w-full max-w-[1400px] flex-col lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
        <div className="relative hidden h-full overflow-hidden rounded-br-[48px] rounded-tr-[48px] border border-border/30 bg-slate-950 text-white shadow-lg shadow-slate-900/30 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.35),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.25),transparent_45%),radial-gradient(circle_at_0%_60%,rgba(14,165,233,0.2),transparent_45%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-slate-950/95 backdrop-blur-md" />
          <div className="relative z-10 flex h-full flex-col items-start justify-center gap-10 px-10 py-10 lg:px-12 lg:py-12">
            <div className="space-y-5 max-w-xl">
              <Badge
                variant="outline"
                className="w-fit border-white/50 bg-white/10 text-white"
              >
                Quality Management Suite
              </Badge>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Manage CAPA, complaints, and device issues with confidence.
              </h1>
              <p className="text-base text-slate-200/80">
                Unify corrective actions, customer feedback, and production insights. The
                QMS command center brings every regulated workflow into one secure,
                auditable space.
              </p>
            </div>

            <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
              {featureHighlights.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur transition hover:border-white/20 hover:bg-white/15"
                >
                  <Icon className="mb-3 h-5 w-5 text-white" />
                  <div className="font-medium">{title}</div>
                  <p className="text-sm text-slate-200/80">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-lg space-y-8">
            <Card className="border border-border/60 bg-background/95 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur">
              {step === "login" ? (
                <>
                  <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                      <Badge
                        variant="secondary"
                        className="border border-primary/20 bg-primary/10 text-primary"
                      >
                        Secure sign in
                      </Badge>
                    </div>
                    <CardTitle className="text-3xl font-semibold">Welcome back</CardTitle>
                    <CardDescription className="text-base">
                      {isPasswordMode
                        ? "Use your credentials to access the QMS portal."
                        : "Choose where you’d like to receive your one-time verification code."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {!isPasswordMode && (
                      <div className="rounded-full border border-muted bg-muted/60 p-1 text-sm font-medium">
                        {(["email", "phone"] as Array<"email" | "phone">).map((method) => (
                          <button
                            key={method}
                          type="button"
                          onClick={() => setLoginMethod(method)}
                          className={cn(
                            "inline-flex w-1/2 items-center justify-center rounded-full px-3 py-1.5 transition-all",
                            loginMethod === method
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {method === "email" ? "Email" : "SMS OTP"}
                        </button>
                      ))}
                    </div>
                    )}

                    {isPasswordMode ? (
                      <form className="space-y-5" onSubmit={handlePasswordSubmit} noValidate>
                        <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Default credentials for new accounts use{" "}
                          <span className="font-semibold tracking-widest">000000</span>.
                        </p>
                      </div>
                      <Button
                        type="submit"
                        disabled={!isEmailValid || !isPasswordValid || isPasswordLoggingIn}
                        className="w-full shadow-sm transition hover:shadow-lg"
                        size="lg"
                      >
                        {isPasswordLoggingIn ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Signing in…
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </form>
                  ) : (
                    <form className="space-y-5" onSubmit={handleLoginSubmit} noValidate>
                      {loginMethod === "email" ? (
                        <div className="space-y-2">
                          <Label htmlFor="email">Email address</Label>
                          <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="phone">Mobile number</Label>
                          <div className="flex gap-2">
                            <Select value={countryCode} onValueChange={setCountryCode}>
                              <SelectTrigger className="w-[110px]">
                                <SelectValue placeholder="Code" />
                              </SelectTrigger>
                              <SelectContent>
                                {countryCodes.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    <span className="flex items-center gap-2">
                                      <span className="text-lg leading-none">{country.flag}</span>
                                      {country.code}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              id="phone"
                              type="tel"
                              inputMode="tel"
                              placeholder="123 456 7890"
                              value={phone}
                              onChange={(event) => setPhone(event.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isOtpRequesting || !isContactValid}
                        className="w-full shadow-sm transition hover:shadow-lg"
                        size="lg"
                      >
                        {isOtpRequesting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Sending code…
                          </>
                        ) : (
                          "Send one-time code"
                        )}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        We&apos;ll send a secure one-time code to your{" "}
                        {loginMethod === "email" ? "email inbox." : "phone via SMS."}
                      </p>
                    </form>
                  )}
                </CardContent>
                <CardFooter className="flex-col gap-1 border-t border-border/60 bg-muted/20 text-center text-xs text-muted-foreground">
                  <p>
                    Need access? Contact{" "}
                    <a
                      className="font-medium text-primary hover:underline"
                      href="mailto:support@projectkmt.com"
                    >
                      support@projectkmt.com
                    </a>
                  </p>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="space-y-3 text-center">
                  <Badge
                    variant="secondary"
                    className="mx-auto border border-primary/20 bg-primary/10 text-primary"
                  >
                    Multi-factor authentication
                  </Badge>
                  <CardTitle className="text-3xl font-semibold">Verify access</CardTitle>
                  <CardDescription className="text-base">
                    Enter the code sent to {contactInfo || "your contact"}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OTPVerification
                    contactInfo={contactInfo}
                    contactType={loginMethod}
                    onVerify={handleVerifyOTP}
                    onBack={handleBackToLogin}
                    onResendOTP={handleResendOTP}
                    isLoading={isOtpVerifying}
                  />
                </CardContent>
                <CardFooter className="justify-center border-t border-border/60 bg-muted/20 text-xs text-muted-foreground">
                  <p>The code expires in 10 minutes to keep your account secure.</p>
                </CardFooter>
              </>
            )}
          </Card>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span className="whitespace-nowrap">Quality and compliance program in progress</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 0%, 100% 0%, 0% 100%;
          }
          50% {
            background-position: 50% 50%, 50% 50%, 50% 50%;
          }
          100% {
            background-position: 0% 0%, 100% 0%, 0% 100%;
          }
        }

        @keyframes blobFloat {
          0%,
          100% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(45deg) scale(1.05);
          }
        }

        .animate-gradient-slow {
          animation: gradientShift 18s linear infinite;
          background-size: 200% 200%;
        }

        .animate-blob-float {
          animation: blobFloat 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
