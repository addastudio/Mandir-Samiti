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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: language === "hi" ? "सफलतापूर्वक लॉगिन किया गया" : "Logged in successfully" });
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
        await setDoc(userDocRef, {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          role: "user",
          language: language,
        });
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
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-primary/20 focus:border-primary"
              />
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
