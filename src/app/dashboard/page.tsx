"use client";

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuth, signOut } from "firebase/auth";
import { collection, doc } from "firebase/firestore";
import { Loader2, LogOut, User as UserIcon, History, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { t, language } = useLanguage();

  const donationsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "donations");
  }, [firestore, user]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);

  const { data: donations, isLoading: isDonationsLoading } = useCollection(donationsRef);
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/");
  };

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 mt-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className={cn("text-3xl font-bold flex items-center gap-2", language === 'hi' ? 'font-hindi' : 'font-headline')}>
            <UserIcon className="h-8 w-8 text-primary" />
            {language === 'hi' ? `नमस्ते, ${user.displayName || user.email}` : `Welcome, ${user.displayName || user.email}`}
          </h1>
          <p className={cn("text-muted-foreground", language === 'hi' ? 'font-hindi' : '')}>
            {language === 'hi' ? 'अपनी प्रोफ़ाइल प्रबंधित करें और अपना दान इतिहास देखें।' : 'Manage your profile and view donation history.'}
          </p>
        </div>
        <div className="flex gap-2">
          {adminDoc && (
            <Link href="/admin">
              <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
                <ShieldCheck className="h-4 w-4" /> 
                <span className={cn(language === 'hi' ? 'font-hindi' : '')}>
                  {language === 'hi' ? 'एडमिन पैनल' : 'Admin Panel'}
                </span>
              </Button>
            </Link>
          )}
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> 
            <span className={cn(language === 'hi' ? 'font-hindi' : '')}>
              {language === 'hi' ? 'लॉगआउट' : 'Logout'}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-primary/20">
          <CardHeader>
            <CardTitle className={cn(language === 'hi' ? 'font-hindi' : 'font-headline')}>
              {language === 'hi' ? 'प्रोफ़ाइल जानकारी' : 'Profile Info'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">{language === 'hi' ? 'ईमेल' : 'Email'}</label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">{language === 'hi' ? 'सदस्यता की तारीख' : 'Member Since'}</label>
              <p className="font-medium">{new Date(user.metadata.creationTime || "").toLocaleDateString()}</p>
            </div>
            {adminDoc && (
              <div className="pt-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {language === 'hi' ? 'प्रशासक' : 'Administrator'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-primary/20">
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", language === 'hi' ? 'font-hindi' : 'font-headline')}>
              <History className="h-5 w-5" /> {language === 'hi' ? 'दान इतिहास' : 'Donation History'}
            </CardTitle>
            <CardDescription className={cn(language === 'hi' ? 'font-hindi' : '')}>
              {language === 'hi' ? 'मंदिर में आपके द्वारा दिए गए योगदान की सूची।' : 'A list of your contributions to the temple.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDonationsLoading ? (
              <div className="flex py-8 justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : donations && donations.length > 0 ? (
              <div className="space-y-4">
                {donations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/40 transition-colors">
                    <div>
                      <p className="font-bold text-lg text-primary">₹{donation.amount}</p>
                      <p className="text-xs text-muted-foreground">{new Date(donation.date).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium px-2 py-1 rounded bg-secondary">{donation.mode}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className={cn(language === 'hi' ? 'font-hindi' : '')}>{language === 'hi' ? 'कोई दान रिकॉर्ड नहीं मिला।' : 'No donation records found.'}</p>
                <Link href="/#donate" className="text-primary hover:underline mt-2 inline-block font-medium">
                  {t.navDonate}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
