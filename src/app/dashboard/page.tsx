"use client";

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuth, signOut, sendEmailVerification } from "firebase/auth";
import { collection, doc, query, where, orderBy } from "firebase/firestore";
import { Loader2, LogOut, User as UserIcon, History, ShieldCheck, Globe, IndianRupee, MessageSquare, PlusCircle, CheckCircle2, Clock, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const donationsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "donations");
  }, [firestore, user]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "prayer_requests"),
      where("userId", "==", user.uid)
    );
  }, [firestore, user]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);

  const { data: donations, isLoading: isDonationsLoading } = useCollection(donationsRef);
  const { data: userRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router, mounted]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/");
  };

  const handleResendEmail = async () => {
    if (!user) return;
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: language === 'hi' ? "सफलता" : "Success",
        description: t.dashboardVerificationSent,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === 'hi' ? "त्रुटि" : "Error",
        description: error.message,
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const totalDonated = donations?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 pt-28">
      <div className="container mx-auto px-4 md:px-8 space-y-8">
        {!user.emailVerified && user.providerData[0]?.providerId === 'password' && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.dashboardUnverifiedEmail}</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <span className={cn(language === 'hi' ? 'font-hindi text-sm' : 'text-sm')}>
                {language === 'hi' 
                  ? 'कृपया अपना ईमेल सत्यापित करें। यदि आपको लिंक नहीं मिला है, तो आप नीचे दिए गए बटन पर क्लिक करके इसे पुनः प्राप्त कर सकते हैं।' 
                  : 'Please verify your email to ensure full access to all features. If you haven\'t received the link, you can resend it below.'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResendEmail} 
                disabled={isResending}
                className="bg-white border-destructive/30 hover:bg-destructive/10 text-destructive h-8"
              >
                {isResending ? '...' : t.dashboardResendVerification}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className={cn("text-2xl font-bold flex items-center gap-2", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {t.dashboardWelcome}, {user.displayName || user.email?.split('@')[0]}
              </h1>
              <p className={cn("text-sm text-muted-foreground", language === 'hi' ? 'font-hindi' : '')}>
                {t.dashboardSubtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.browseWebsite}</span>
              </Button>
            </Link>
            {adminDoc && (
              <Link href="/admin">
                <Button variant="default" className="gap-2 bg-primary text-primary-foreground">
                  <ShieldCheck className="h-4 w-4" /> 
                  <span className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.dashboardAdminPanel}</span>
                </Button>
              </Link>
            )}
            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" /> 
              <span className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.dashboardLogout}</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className={cn(language === 'hi' ? 'font-hindi' : 'font-headline')}>
                  {t.dashboardProfileInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.dashboardEmail}</label>
                  <p className="font-medium truncate flex items-center gap-2">
                    {user.email}
                    {user.emailVerified ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 h-5 px-1.5">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-destructive border-destructive/30 h-5 px-1.5">Unverified</Badge>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.dashboardMemberSince}</label>
                  <p className="font-medium">{new Date(user.metadata.creationTime || "").toLocaleDateString()}</p>
                </div>
                {adminDoc && (
                  <div className="pt-2">
                    <span className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary border border-primary/30">
                      {language === 'hi' ? 'प्रशासक' : 'Administrator'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-accent/20 shadow-md bg-gradient-to-br from-white to-accent/5">
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold text-accent uppercase tracking-wider">{t.dashboardTotalContribution}</CardDescription>
                <CardTitle className="text-4xl font-bold flex items-center gap-1 text-primary">
                  <IndianRupee className="h-8 w-8" />
                  {totalDonated}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">Thank you for your generous support to the temple.</p>
              </CardContent>
            </Card>

            <Link href="/#prayer" className="block">
              <Button className="w-full gap-2 py-6 text-lg bg-white border-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm">
                <PlusCircle className="h-5 w-5" />
                {t.dashboardNewRequest}
              </Button>
            </Link>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-primary/20 shadow-md h-full overflow-hidden">
              <Tabs defaultValue="donations" className="w-full">
                <CardHeader className="border-b bg-white p-0">
                  <TabsList className="w-full justify-start rounded-none h-14 bg-transparent border-b-0 p-0">
                    <TabsTrigger 
                      value="donations" 
                      className="rounded-none h-full px-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none font-bold"
                    >
                      <History className="h-4 w-4 mr-2" />
                      {t.dashboardDonationHistory}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="requests" 
                      className="rounded-none h-full px-6 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none font-bold"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t.dashboardMyRequests}
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <TabsContent value="donations" className="m-0">
                  <CardContent className="p-0">
                    {isDonationsLoading ? (
                      <div className="flex py-20 justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : donations && donations.length > 0 ? (
                      <div className="divide-y">
                        {donations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((donation) => (
                          <div key={donation.id} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                            <div className="space-y-1">
                              <p className="font-bold text-xl text-primary">₹{donation.amount}</p>
                              <p className="text-xs text-muted-foreground">{new Date(donation.date).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-secondary-foreground border">
                                {donation.mode}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-24 text-muted-foreground">
                        <History className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className={cn("text-lg", language === 'hi' ? 'font-hindi' : '')}>{t.dashboardNoDonations}</p>
                        <Link href="/#donate" className="text-primary hover:underline mt-4 inline-block font-bold">
                          {t.navDonate}
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>

                <TabsContent value="requests" className="m-0">
                  <CardContent className="p-0">
                    {isRequestsLoading ? (
                      <div className="flex py-20 justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : userRequests && userRequests.length > 0 ? (
                      <div className="divide-y">
                        {userRequests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((req) => (
                          <div key={req.id} className="p-5 hover:bg-muted/30 transition-colors space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-lg">{req.requestType === 'puja' ? t.prayerTypePuja : req.requestType === 'prayer' ? t.prayerTypePrayer : t.prayerTypeOther}</h4>
                                  <Badge variant={req.status === 'completed' ? 'default' : req.status === 'viewed' ? 'secondary' : 'outline'}>
                                    {req.status === 'completed' ? t.prayerStatusCompleted : req.status === 'viewed' ? t.prayerStatusViewed : t.prayerStatusPending}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleString()}</p>
                              </div>
                              {req.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-amber-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded italic border-l-2 border-primary/20 line-clamp-2">
                              {req.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-24 text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className={cn("text-lg", language === 'hi' ? 'font-hindi' : '')}>
                          {language === 'hi' ? 'कोई निवेदन नहीं मिला।' : 'No requests found.'}
                        </p>
                        <Link href="/#prayer" className="text-primary hover:underline mt-4 inline-block font-bold">
                          {t.dashboardNewRequest}
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
