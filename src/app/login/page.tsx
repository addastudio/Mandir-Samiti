
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
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extend window type to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function LoginPage() {
  const { t, language } = useLanguage();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (isClient && auth && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: (response: any) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            },
          }
        );
      } catch (e) {
        console.error("RecaptchaVerifier error:", e);
      }
    }
  }, [isClient, auth]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Logged in successfully" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    if (!auth || !firestore) return;
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          role: "user",
          language: language,
        });
      }

      toast({ title: "Logged in successfully with Google" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (!auth) return;
    try {
      const verifier = window.recaptchaVerifier;
      // Make sure to add country code
      const formattedPhone = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      toast({ title: "OTP sent successfully" });
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !firestore) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          phone: user.phoneNumber,
          role: "user",
          language: language,
        });
      }
      toast({ title: "Logged in successfully" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isClient) {
    return null; // Render nothing on the server
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle
            className={cn(
              "text-2xl",
              language === "hi" ? "font-hindi" : "font-headline"
            )}
          >
            {language === "hi" ? "लॉग इन करें" : "Login"}
          </CardTitle>
          <CardDescription>
            {language === "hi"
              ? "अपने खाते तक पहुंचने के लिए"
              : "to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">{language === 'hi' ? 'ईमेल' : 'Email'}</TabsTrigger>
              <TabsTrigger value="phone">{language === 'hi' ? 'फ़ोन' : 'Phone'}</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4 pt-4">
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
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className={cn(language === "hi" ? "font-hindi" : "")}
                  >
                    {language === "hi" ? "पासवर्ड" : "Password"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? language === "hi"
                      ? "लॉग इन हो रहा है..."
                      : "Logging in..."
                    : language === "hi"
                    ? "लॉग इन करें"
                    : "Login"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="phone">
              {!confirmationResult ? (
                 <form onSubmit={handlePhoneLogin} className="space-y-4 pt-4">
                    <div className="space-y-2">
                       <Label htmlFor="phone" className={cn(language === 'hi' ? 'font-hindi' : '')}>
                         {language === 'hi' ? 'फ़ोन नंबर' : 'Phone Number'}
                       </Label>
                       <Input
                         id="phone"
                         type="tel"
                         placeholder="9876543210"
                         value={phone}
                         onChange={(e) => setPhone(e.target.value)}
                         required
                       />
                     </div>
                     {error && <p className="text-sm text-destructive">{error}</p>}
                     <Button type="submit" className="w-full" disabled={isLoading}>
                       {isLoading ? (language === 'hi' ? "OTP भेजा जा रहा है..." : "Sending OTP...") : (language === 'hi' ? "OTP भेजें" : "Send OTP")}
                     </Button>
                 </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className={cn(language === 'hi' ? 'font-hindi' : '')}>
                      {language === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP'}
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (language === 'hi' ? "सत्यापित हो रहा है..." : "Verifying...") : (language === 'hi' ? "OTP सत्यापित करें" : "Verify OTP")}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center">
            <div className="flex-grow border-t border-muted" />
            <span className="mx-4 text-xs text-muted-foreground">OR</span>
            <div className="flex-grow border-t border-muted" />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Image
              src="/google.svg"
              width={20}
              height={20}
              alt="Google logo"
              className="mr-2"
            />
            {language === "hi"
              ? "Google के साथ जारी रखें"
              : "Continue with Google"}
          </Button>
          <div className="mt-4 text-center text-sm">
            {language === "hi" ? "खाता नहीं है?" : "Don't have an account?"}{" "}
            <Link href="/signup" className="underline">
              {language === "hi" ? "साइन अप करें" : "Sign up"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
