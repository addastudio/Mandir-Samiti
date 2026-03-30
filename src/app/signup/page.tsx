"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useAuth, useFirestore } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Loader2, RefreshCw, Info, AlertTriangle } from "lucide-react";
import { sendVerificationOtp } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SignupPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // OTP Step State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const generateRandomOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password.length < 6) {
      setError(t.authErrorWeakPassword);
      setIsLoading(false);
      return;
    }

    try {
      const newOtp = generateRandomOtp();
      setGeneratedOtp(newOtp);
      await sendVerificationOtp(email, newOtp);

      toast({
        title: language === 'hi' ? 'सत्यापन संदेश भेजा गया' : 'Verification Sent',
        description: language === 'hi' ? 'कृपया अपना ईमेल सिमुलेशन जांचें।' : 'Please check your simulated email log.',
      });

      setIsOtpStep(true);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    const newOtp = generateRandomOtp();
    try {
      setGeneratedOtp(newOtp);
      await sendVerificationOtp(email, newOtp);
      
      toast({
        title: t.signupOtpSent,
        description: language === 'hi' ? 'एक नया कोड भेजा गया है (सिमुलेशन)।' : 'A new code has been simulated.',
      });
      setResendCooldown(60);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyAndCreateAccount = async () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    
    if (otp !== generatedOtp) {
      toast({
        variant: "destructive",
        title: t.signupOtpError,
        description: language === 'hi' ? 'कृपया सही कोड दर्ज करें।' : 'Please enter the correct code.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      
      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        id: user.uid,
        name: name,
        email: user.email,
        role: "devotee",
        language: language,
        isVerified: true,
        twoFactorEnabled: false,
      };

      await setDoc(userDocRef, userData, { merge: true });
      
      toast({ 
        title: language === "hi" ? "सफलता" : "Success",
        description: language === 'hi' ? 'आपका खाता सफलतापूर्वक बनाया गया है!' : 'Your account has been successfully created!' 
      });
      
      router.push("/dashboard");
    } catch (err: any) {
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = t.authErrorEmailInUse;
      } else if (err.code === 'auth/weak-password') {
        errorMessage = t.authErrorWeakPassword;
      }
      setError(errorMessage);
      toast({ variant: "destructive", title: "Signup failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const userData = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: "devotee",
          language: language,
          isVerified: true, 
        };
        await setDoc(userDocRef, userData, { merge: true });
      }

      toast({ title: "Success", description: "Signed up successfully with Google" });
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }
      setError(err.message);
      toast({ variant: "destructive", title: "Signup failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (isOtpStep) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className={cn("text-2xl font-bold", language === 'hi' ? 'font-hindi' : '')}>
              {t.signupOtpTitle}
            </CardTitle>
            <CardDescription className={cn(language === 'hi' ? 'font-hindi' : '')}>
              {t.signupOtpDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <Alert variant="default" className="bg-amber-100 border-amber-300 ring-4 ring-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800 text-sm font-black uppercase tracking-tighter">
                {language === 'hi' ? 'महत्वपूर्ण: विकास मोड' : 'PROTOTYPE MODE: READ THIS'}
              </AlertTitle>
              <AlertDescription className="text-amber-900 font-medium mt-2">
                <p className="text-base font-bold bg-white/50 p-2 rounded border border-amber-400">
                  {language === 'hi' 
                    ? `सत्यापन कोड: ${generatedOtp}` 
                    : `Your Verification Code: ${generatedOtp}`}
                </p>
                <p className="mt-2 text-[10px] leading-tight opacity-80">
                  {language === 'hi' 
                    ? "चूंकि यह एक प्रोटोटाइप है, असली ईमेल नहीं भेजा गया है। ऊपर दिया गया कोड उपयोग करें।" 
                    : "Real emails are not sent in this sandbox. Use the code above to proceed."}
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Input 
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="******"
                className="text-center text-3xl tracking-[0.5em] font-bold h-14"
                autoFocus
              />
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleVerifyAndCreateAccount} className="w-full h-12" disabled={otp.length !== 6 || isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {language === 'hi' ? 'सत्यापित करें और खाता बनाएं' : 'Verify & Create Account'}
              </Button>
              
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleResendOtp} 
                  className="w-full h-12 gap-2" 
                  disabled={isResending || resendCooldown > 0}
                >
                  {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {language === 'hi' ? 'नया कोड भेजें' : 'Resend Code'}
                  {resendCooldown > 0 && ` (${resendCooldown}s)`}
                </Button>
                
                <Button variant="ghost" onClick={() => setIsOtpStep(false)} className="w-full h-12">
                  {language === 'hi' ? 'पीछे जाएँ' : 'Go Back'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6 w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          <span className={cn(language === "hi" ? "font-hindi" : "")}>{t.backToHome}</span>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-1">
          <CardTitle className={cn("text-3xl font-bold text-primary", language === "hi" ? "font-hindi" : "font-headline")}>
            {t.navHome} {language === "hi" ? "साइन अप" : "Sign Up"}
          </CardTitle>
          <CardDescription className={cn(language === "hi" ? "font-hindi" : "")}>
            {language === "hi" ? "अपना विवरण दर्ज करें" : "Enter your details to create an account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInitiateSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={cn(language === 'hi' ? 'font-hindi' : '')}>{language === 'hi' ? 'पूरा नाम' : 'Full Name'}</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="border-primary/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.contactFormEmail}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-primary/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={cn(language === 'hi' ? 'font-hindi' : '')}>{language === 'hi' ? 'पासवर्ड' : 'Password'}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="border-primary/20 pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive font-medium p-2 rounded bg-destructive/5">{error}</p>}
            <Button type="submit" className="w-full h-12 font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : (language === 'hi' ? "साइन अप शुरू करें" : "Start Signup")}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{language === "hi" ? "या" : "OR"}</span></div>
          </div>

          <Button variant="outline" className="w-full h-12 border-primary/20 hover:bg-primary/5" onClick={handleGoogleSignup} disabled={isLoading}>
            <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="Google" className="mr-2" />
            {language === "hi" ? "Google के साथ साइन अप" : "Continue with Google"}
          </Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {language === "hi" ? "पहले से खाता है?" : "Already have an account?"}{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">{language === "hi" ? "लॉग इन करें" : "Login"}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
