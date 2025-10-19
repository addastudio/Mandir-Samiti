
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
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function LoginPage() {
  const { t, language } = useLanguage();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
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
