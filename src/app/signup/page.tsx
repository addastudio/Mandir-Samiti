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
  Auth,
  Firestore,
  sendEmailVerification,
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { doc } from "firebase/firestore";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function SignupPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Next.js 15: params and searchParams are Promises
  const params = React.use(props.params);
  const searchParams = React.use(props.searchParams);

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

  const [auth, setAuth] = useState<Auth | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  
  const firebaseAuth = useAuth();
  const firebaseFirestore = useFirestore();

  useEffect(() => {
    setMounted(true);
    setAuth(firebaseAuth);
    setFirestore(firebaseFirestore);
  }, [firebaseAuth, firebaseFirestore]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
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
      await sendEmailVerification(user);

      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        id: user.uid,
        name: name,
        email: user.email,
        role: "user",
        language: language,
      };

      setDocumentNonBlocking(userDocRef, userData, { merge: true });

      toast({ 
        title: language === "hi" ? "सफलता" : "Success",
        description: t.signupEmailSent 
      });
      router.push("/dashboard");
    } catch (err: any) {
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = t.authErrorEmailInUse;
      } else if (err.code === 'auth/weak-password') {
        errorMessage = t.authErrorWeakPassword;
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = t.authErrorInvalidEmail;
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: language === "hi" ? "साइनअप विफल" : "Signup failed",
        description: errorMessage,
      });
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        role: "user",
        language: language,
      };

      setDocumentNonBlocking(userDocRef, userData, { merge: true });

      toast({ title: language === "hi" ? "Google के साथ सफलतापूर्वक साइन अप किया गया" : "Signed up successfully with Google" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: language === "hi" ? "साइनअप विफल" : "Signup failed",
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
            {language === "hi" ? "खाता बनाएं" : "Create an Account"}
          </CardTitle>
          <CardDescription className={cn(language === "hi" ? "font-hindi" : "")}>
            {language === "hi"
              ? "शुरू करने के लिए नीचे दिए गए फॉर्म को भरें"
              : "Fill out the form below to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignup} className="space-y-4">
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
                className="border-primary/20 focus:border-primary"
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
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signup" className={cn(language === 'hi' ? 'font-hindi' : '')}>
                {language === 'hi' ? 'पासवर्ड' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password-signup"
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
              {isLoading ? (language === 'hi' ? "साइन अप हो रहा है..." : "Signing up...") : (language === 'hi' ? "साइन अप करें" : "Sign up")}
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
            onClick={handleGoogleSignup}
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
              ? "Google के साथ साइन अप करें"
              : "Sign up with Google"}
          </Button>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {language === "hi"
              ? "पहले से ही एक खाता है?"
              : "Already have an account?"}{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              {language === "hi" ? "लॉग इन करें" : "Login"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
