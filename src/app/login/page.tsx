
"use client";

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
  Auth,
  Firestore,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

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
  
  // 2FA state
  const [is2FAChallenge, setIs2FAChallenge] = useState(false);
  const [pin, setPin] = useState("");
  const [tempUserDoc, setTempUserDoc] = useState<any>(null);
  
  const [auth, setAuth] = useState<Auth | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  
  const firebaseAuth = useAuth();
  const firebaseFirestore = useFirestore();

  useEffect(() => {
    setMounted(true);
    setAuth(firebaseAuth);
    setFirestore(firebaseFirestore);
  }, [firebaseAuth, firebaseFirestore]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Check for 2FA in Firestore
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      if (userData?.twoFactorEnabled) {
        setIs2FAChallenge(true);
        setTempUserDoc(userData);
        setIsLoading(false);
        return;
      }

      toast({ title: language === "hi" ? "सफलतापूर्वक लॉगिन किया गया" : "Logged in successfully" });
      router.push("/dashboard");
    } catch (err: any) {
      // Intentionally not logging expected auth errors to console.error to avoid triggering global error listeners/overlays
      let errorMessage = err.message;
      
      // Map specific Firebase error codes to translated messages
      if (err.code === 'auth/user-not-found') {
        errorMessage = t.authErrorUserNotFound;
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = t.authErrorWrongPassword;
      } else if (err.code === 'auth/invalid-credential') {
        // Many modern Firebase projects return this generic code for security.
        // It covers both "user not found" and "wrong password".
        errorMessage = t.authErrorInvalidCredential;
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = t.authErrorInvalidEmail;
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = language === 'hi' ? "बहुत अधिक प्रयास। कृपया बाद में पुनः प्रयास करें।" : "Too many attempts. Please try again later.";
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: language === "hi" ? "लॉगिन विफल" : "Login failed",
        description: errorMessage,
      });
      setIsLoading(false);
    }
  };

  const handleVerify2FA = () => {
    if (pin === tempUserDoc?.twoFactorPin) {
      toast({ title: language === "hi" ? "सफलतापूर्वक लॉगिन किया गया" : "Logged in successfully" });
      router.push("/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: language === "hi" ? "अमान्य पिन" : "Invalid PIN",
        description: t.authError2FAPin,
      });
      setPin("");
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const userData = {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          role: "user",
          language: language,
        };
        const { setDocumentNonBlocking } = await import("@/firebase/non-blocking-updates");
        setDocumentNonBlocking(userDocRef, userData, { merge: true });
      }

      toast({ title: language === "hi" ? "Google के साथ सफलतापूर्वक लॉगिन किया गया" : "Logged in successfully with Google" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: language === "hi" ? "लॉगिन विफल" : "Login failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md animate-pulse">
          <div className="h-64 bg-muted rounded-lg" />
        </Card>
      </div>
    );
  }

  if (is2FAChallenge) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className={cn("text-2xl font-bold", language === 'hi' ? 'font-hindi' : '')}>
              {t.dashboard2FAEnable}
            </CardTitle>
            <CardDescription>{language === 'hi' ? 'अपना 6-अंकीय पिन दर्ज करें' : 'Enter your 6-digit PIN'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="******"
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            <Button onClick={handleVerify2FA} className="w-full" disabled={pin.length !== 6}>
              {language === 'hi' ? 'सत्यापित करें' : 'Verify'}
            </Button>
            <Button variant="ghost" onClick={() => setIs2FAChallenge(false)} className="w-full">
              {t.navHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6 w-full max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className={cn(language === "hi" ? "font-hindi" : "")}>
            {t.backToHome}
          </span>
        </Link>
      </div>
      
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-1">
          <CardTitle
            className={cn(
              "text-3xl font-bold text-primary",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {language === "hi" ? "लॉग इन करें" : "Login"}
          </CardTitle>
          <CardDescription className={cn(language === "hi" ? "font-hindi" : "")}>
            {language === "hi"
              ? "अपने खाते तक पहुंचने के लिए विवरण दर्ज करें"
              : "Enter your details to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={cn(language === "hi" ? "font-hindi" : "")}
              >
                {t.contactFormEmail}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className={cn(language === "hi" ? "font-hindi" : "")}
              >
                {language === "hi" ? "पासवर्ड" : "Password"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-primary/20 focus:border-primary pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading
                ? language === "hi"
                  ? "लॉग इन हो रहा है..."
                  : "Logging in..."
                : language === "hi"
                ? "लॉग इन करें"
                : "Login"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {language === "hi" ? "या" : "OR"}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-primary/20 hover:bg-primary/5"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Image
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              width={20}
              height={20}
              alt="Google logo"
              className="mr-2"
              unoptimized
            />
            {language === "hi"
              ? "Google के साथ जारी रखें"
              : "Continue with Google"}
          </Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {language === "hi" ? "खाता नहीं है?" : "Don't have an account?"}{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              {language === "hi" ? "साइन अप करें" : "Sign up"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
