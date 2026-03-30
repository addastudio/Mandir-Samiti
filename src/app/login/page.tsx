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
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Loader2, RefreshCw, Info } from "lucide-react";
import { sendVerificationOtp } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [storedOtp, setStoredOtp] = useState("");
  const [tempUserId, setTempUserId] = useState("");
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      // Check for legacy users who were created but not verified
      if (userData && userData.isVerified === false) {
        setTempUserId(user.uid);
        const currentOtp = userData.verificationOtp || Math.floor(100000 + Math.random() * 900000).toString();
        
        if (!userData.verificationOtp) {
          await updateDoc(userDocRef, { verificationOtp: currentOtp });
        }
        
        setStoredOtp(currentOtp);
        setIsVerificationStep(true);
        setResendCooldown(60);
        await sendVerificationOtp(email, currentOtp);
        
        toast({
          title: language === 'hi' ? 'सत्यापन आवश्यक' : 'Verification Required',
          description: language === 'hi' ? 'कृपया अपना ईमेल सिमुलेशन जांचें।' : 'Please check your email simulation.',
        });
        
        setIsLoading(false);
        return;
      }

      toast({ title: "Success", description: "Logged in successfully" });
      router.push("/dashboard");
    } catch (err: any) {
      let errorMessage = err.message;
      if (err.code === 'auth/invalid-credential') {
        errorMessage = t.authErrorInvalidCredential;
      }
      setError(errorMessage);
      toast({ variant: "destructive", title: "Login failed", description: errorMessage });
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!firestore || !tempUserId || !email || resendCooldown > 0) return;
    setIsResending(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const userDocRef = doc(firestore, "users", tempUserId);
      await updateDoc(userDocRef, { verificationOtp: newOtp });
      setStoredOtp(newOtp);
      await sendVerificationOtp(email, newOtp);
      
      toast({
        title: t.signupOtpSent,
        description: language === 'hi' ? 'एक नया कोड भेजा गया है (सिमुलेशन)।' : 'A new code has been sent (simulated).',
      });
      setResendCooldown(60);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!firestore || !tempUserId) return;
    setIsLoading(true);
    
    if (otp === storedOtp) {
      try {
        const userDocRef = doc(firestore, "users", tempUserId);
        await updateDoc(userDocRef, { 
          isVerified: true,
          verificationOtp: null 
        });
        toast({ title: "Success", description: "Verification successful!" });
        router.push("/dashboard");
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    } else {
      toast({ variant: "destructive", title: t.signupOtpError });
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }
      setError(err.message);
      toast({ variant: "destructive", title: "Login failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (isVerificationStep) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className={cn("text-2xl font-bold", language === 'hi' ? 'font-hindi' : '')}>
              {language === 'hi' ? 'खाता सत्यापित करें' : 'Verify Account'}
            </CardTitle>
            <CardDescription>{t.signupOtpDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Development Hint Alert */}
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 text-xs font-bold">DEVELOPMENT MODE</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs mt-1">
                {language === 'hi' 
                  ? `ईमेल सिमुलेशन कोड: ${storedOtp}` 
                  : `Simulated Email Code: ${storedOtp}`}
                <p className="mt-1 opacity-70">
                  {language === 'hi' 
                    ? "(वास्तविक उत्पादन में यह कोड केवल ईमेल पर भेजा जाएगा)" 
                    : "(In production, this code is sent privately via email)"}
                </p>
              </AlertDescription>
            </Alert>

            <Input 
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="******"
              className="text-center text-3xl tracking-[0.5em] font-bold h-14"
              autoFocus
            />
            
            <div className="space-y-3">
              <Button onClick={handleVerifyOtp} className="w-full h-12" disabled={otp.length !== 6 || isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {t.signupVerifyBtn}
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
                
                <Button variant="ghost" onClick={() => setIsVerificationStep(false)} className="w-full h-12">
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
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          <span className={cn(language === "hi" ? "font-hindi" : "")}>{t.backToHome}</span>
        </Link>
      </div>
      
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-1">
          <CardTitle className={cn("text-3xl font-bold text-primary", language === "hi" ? "font-hindi" : "font-headline")}>
            {language === "hi" ? "लॉग इन" : "Login"}
          </CardTitle>
          <CardDescription>{language === "hi" ? "अपने खाते में वापस जाएँ" : "Welcome back to your account"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.contactFormEmail}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{language === "hi" ? "पासवर्ड" : "Password"}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive font-medium p-2 rounded bg-destructive/5">{error}</p>}
            <Button type="submit" className="w-full h-12 font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : (language === "hi" ? "लॉग इन करें" : "Login")}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{language === "hi" ? "या" : "OR"}</span></div>
          </div>

          <Button variant="outline" className="w-full h-12 border-primary/20 hover:bg-primary/5" onClick={handleGoogleLogin} disabled={isLoading}>
            <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="Google" className="mr-2" />
            {language === "hi" ? "Google के साथ लॉगिन" : "Continue with Google"}
          </Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {language === "hi" ? "खाता नहीं है?" : "Don't have an account?"}{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">{language === "hi" ? "साइन अप करें" : "Sign up"}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
