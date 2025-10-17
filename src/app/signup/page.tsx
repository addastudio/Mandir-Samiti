
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
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extend window type to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}


export default function SignupPage() {
  const { t, language } = useLanguage();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
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
    // This effect should only run on the client side.
    if (isClient && auth && !window.recaptchaVerifier) {
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
    }
  }, [isClient, auth]);


  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(firestore, "users", user.uid), {
        id: user.uid,
        name: name,
        email: user.email,
        role: "user",
        language: language,
      });

      toast({ title: "Account created successfully" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);
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

      toast({ title: "Signed up successfully with Google" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const verifier = window.recaptchaVerifier;
      // Add country code, assuming Indian numbers
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
    if (!confirmationResult) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      await setDoc(doc(firestore, "users", user.uid), {
        id: user.uid,
        name: name,
        phone: user.phoneNumber,
        role: "user",
        language: language,
      });
      toast({ title: "Account created successfully" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            {language === "hi" ? "खाता बनाएं" : "Create an Account"}
          </CardTitle>
          <CardDescription>
            {language === "hi"
              ? "शुरू करने के लिए नीचे दिए गए फॉर्म को भरें"
              : "Fill out the form below to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">{language === 'hi' ? 'ईमेल' : 'Email'}</TabsTrigger>
              <TabsTrigger value="phone">{language === 'hi' ? 'फ़ोन' : 'Phone'}</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <form onSubmit={handleEmailSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={cn(language === 'hi' ? 'font-hindi' : '')}>
                    {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={language === 'hi' ? 'आपका नाम' : 'Your Name'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className={cn(language === 'hi' ? 'font-hindi' : '')}>
                    {t.contactFormEmail}
                  </Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup" className={cn(language === 'hi' ? 'font-hindi' : '')}>
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                  </Label>
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (language === 'hi' ? "साइन अप हो रहा है..." : "Signing up...") : (language === 'hi' ? "साइन अप करें" : "Sign up")}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="phone">
               <div style={{ display: !isClient || confirmationResult ? 'none' : 'block' }}>
                 <form onSubmit={handlePhoneSignup} className="space-y-4 pt-4">
                   <div className="space-y-2">
                    <Label htmlFor="name-phone" className={cn(language === 'hi' ? 'font-hindi' : '')}>
                      {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                    </Label>
                    <Input
                      id="name-phone"
                      type="text"
                      placeholder={language === 'hi' ? 'आपका नाम' : 'Your Name'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
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
                </div>
               <div style={{ display: !isClient || !confirmationResult ? 'none' : 'block' }}>
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
                    {isLoading ? (language === 'hi' ? "सत्यापित हो रहा है..." : "Verifying...") : (language === 'hi' ? "खाता बनाएं" : "Create Account")}
                  </Button>
                </form>
               </div>
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
            onClick={handleGoogleSignup}
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
              ? "Google के साथ साइन अप करें"
              : "Sign up with Google"}
          </Button>
          <div className="mt-4 text-center text-sm">
            {language === "hi"
              ? "पहले से ही एक खाता है?"
              : "Already have an account?"}{" "}
            <Link href="/login" className="underline">
              {language === "hi" ? "लॉग इन करें" : "Login"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
