
"use client";

import { useState } from "react";
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
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function SignupPage() {
  const { t, language } = useLanguage();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Update user profile with name
      await updateProfile(user, { displayName: name });
      
      // Create user document in Firestore
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

      // Check if user exists in Firestore, if not create a new profile
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
            {language === "hi" ? "खाता बनाएं" : "Create an Account"}
          </CardTitle>
          <CardDescription>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className={cn(language === 'hi' ? 'font-hindi' : '')}>
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
              <Label htmlFor="password" className={cn(language === 'hi' ? 'font-hindi' : '')}>
                {language === 'hi' ? 'पासवर्ड' : 'Password'}
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
              {isLoading ? (language === 'hi' ? "साइन अप हो रहा है..." : "Signing up...") : (language === 'hi' ? "साइन अप करें" : "Sign up")}
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
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
             <Image src="/google.svg" width={20} height={20} alt="Google logo" className="mr-2" />
            {language === 'hi' ? 'Google के साथ साइन अप करें' : 'Sign up with Google'}
          </Button>
          <div className="mt-4 text-center text-sm">
            {language === 'hi' ? 'पहले से ही एक खाता है?' : "Already have an account?"}{" "}
            <Link href="/login" className="underline">
              {language === 'hi' ? 'लॉग इन करें' : 'Login'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
