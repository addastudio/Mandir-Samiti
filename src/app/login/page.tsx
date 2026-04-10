
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
  linkWithCredential,
  EmailAuthProvider,
  type User,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Loader2, RefreshCw, Info, AlertTriangle, MailCheck, KeyRound } from "lucide-react";
import { sendVerificationOtp, getEmailServiceStatus } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [isEmailLive, setIsEmailLive] = useState(false);
  
  // Default User Photo
  const defaultUserPhoto = React.useMemo(() => PlaceHolderImages.find(img => img.id === 'default-user-avatar')?.imageUrl || "https://picsum.photos/seed/standard-avatar/200/200", []);

  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [storedOtp, setStoredOtp] = useState("");
  const [tempUserId, setTempUserId] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset Password State
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Google Password Step State
  const [isSettingPasswordAfterGoogle, setIsSettingPasswordAfterGoogle] = useState(false);
  const [passwordAfterGoogle, setPasswordAfterGoogle] = useState("");
  const [tempUserForPassword, setTempUserForPassword] = useState<User | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    setMounted(true);
    getEmailServiceStatus().then(status => setIsEmailLive(status.isLive));
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
          description: isEmailLive 
            ? (language === 'hi' ? 'कृपया अपना ईमेल जांचें।' : 'Please check your email.')
            : (language === 'hi' ? 'कृपया कोड के लिए लॉग देखें।' : 'Please see the simulation log.'),
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
        description: isEmailLive 
          ? (language === 'hi' ? 'एक नया ईमेल भेजा गया है।' : 'A new email has been sent.')
          : (language === 'hi' ? 'एक नया कोड सिम्युलेट किया गया है।' : 'A new code has been simulated.'),
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
      const user = result.user;

      const hasPassword = user.providerData.some(p => p.providerId === 'password');
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() || !hasPassword) {
        setTempUserForPassword(user);
        setIsSettingPasswordAfterGoogle(true);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }
      
      let errorMessage = err.message;
      if (err.code === 'auth/unauthorized-domain') {
        errorMessage = t.authErrorUnauthorizedDomain;
      }
      
      setError(errorMessage);
      toast({ variant: "destructive", title: "Login failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishGoogleLoginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserForPassword || !auth || !firestore) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const credential = EmailAuthProvider.credential(tempUserForPassword.email!, passwordAfterGoogle);
      await linkWithCredential(tempUserForPassword, credential);
      
      const userDocRef = doc(firestore, "users", tempUserForPassword.uid);
      const userDoc = await getDoc(userDocRef);
      
      const photoToUse = tempUserForPassword.photoURL || defaultUserPhoto;

      if (!userDoc.exists()) {
        const userData = {
          id: tempUserForPassword.uid,
          name: tempUserForPassword.displayName || tempUserForPassword.email?.split('@')[0] || 'User',
          email: tempUserForPassword.email,
          role: "devotee",
          language: language,
          isVerified: true, 
          photoURL: photoToUse
        };
        await setDoc(userDocRef, userData, { merge: true });
      } else {
        await updateDoc(userDocRef, { isVerified: true });
      }

      await updateProfile(tempUserForPassword, { photoURL: photoToUse });

      toast({ title: "Success", description: "Account secured successfully!" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !resetEmail) return;
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: t.loginResetPassword,
        description: t.loginResetSuccess,
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t.loginResetError,
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (!mounted) return null;

  if (isSettingPasswordAfterGoogle) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className={cn("text-2xl font-bold", language === 'hi' ? 'font-hindi' : '')}>
              {t.signupGooglePasswordTitle}
            </CardTitle>
            <CardDescription className={cn(language === 'hi' ? 'font-hindi' : '')}>
              {t.signupGooglePasswordDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFinishGoogleLoginWithPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-google-password">{language === 'hi' ? 'पासवर्ड' : 'New Password'}</Label>
                <div className="relative">
                  <Input 
                    id="login-google-password" 
                    type={showPassword ? "text" : "password"} 
                    value={passwordAfterGoogle} 
                    onChange={(e) => setPasswordAfterGoogle(e.target.value)} 
                    required 
                    minLength={6}
                    className="border-primary/20 pr-10" 
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive font-medium p-2 rounded bg-destructive/5">{error}</p>}
              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full h-12 font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : t.signupGooglePasswordBtn}
                </Button>
                <Button variant="ghost" onClick={() => setIsSettingPasswordAfterGoogle(false)} className="w-full h-12">
                  {language === 'hi' ? 'पीछे जाएँ' : 'Go Back'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerificationStep) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className={cn("text-2xl font-bold", language === 'hi' ? 'font-hindi' : '')}>
              {language === 'hi' ? 'खाता सत्यापित करें' : 'Verify Account'}
            </CardTitle>
            <CardDescription>{t.signupOtpDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {!isEmailLive && (
              <Alert variant="default" className="bg-amber-100 border-amber-300 ring-4 ring-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800 text-sm font-black uppercase tracking-tighter">
                  {language === 'hi' ? 'विकास मोड' : 'DEVELOPMENT MODE'}
                </AlertTitle>
                <AlertDescription className="text-amber-900 font-medium mt-2">
                  <p className="text-base font-bold bg-white/50 p-2 rounded border border-amber-400">
                    {language === 'hi' 
                      ? `सत्यापन कोड: ${storedOtp}` 
                      : `Your Verification Code: ${storedOtp}`}
                  </p>
                  <p className="mt-2 text-[10px] leading-tight opacity-80">
                    {language === 'hi' 
                      ? "असली ईमेल सेवा कॉन्फ़िगर नहीं है। ऊपर दिया गया कोड उपयोग करें।" 
                      : "Real email service not configured. Use the code above."}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {isEmailLive && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center gap-3">
                <MailCheck className="h-5 w-5 text-green-600" />
                <p className="text-xs text-green-800">
                  {language === 'hi' 
                    ? `हमने ${email} पर एक कोड भेजा है।` 
                    : `A secure code was sent to ${email}.`}
                </p>
              </div>
            )}

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
        <Link href="/" className="group flex items-center gap-2 w-fit px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 active:scale-95">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{language === "hi" ? "पासवर्ड" : "Password"}</Label>
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="px-0 h-auto text-xs font-medium text-primary"
                    >
                      {t.loginForgotPassword}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95%] max-w-sm">
                    <DialogHeader>
                      <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <KeyRound className="h-6 w-6 text-primary" />
                      </div>
                      <DialogTitle className={cn("text-center", language === 'hi' ? 'font-hindi' : '')}>{t.loginResetPassword}</DialogTitle>
                      <DialogDescription className={cn("text-center", language === 'hi' ? 'font-hindi' : '')}>
                        {t.loginResetDesc}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordReset} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">{t.contactFormEmail}</Label>
                        <Input 
                          id="reset-email" 
                          type="email" 
                          value={resetEmail} 
                          onChange={(e) => setResetEmail(e.target.value)} 
                          required 
                          placeholder="devotee@example.com"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isResetting || !resetEmail}>
                        {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {t.loginResetPassword}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
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
