
"use client";

import * as React from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut, sendEmailVerification, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { collection, doc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { Loader2, LogOut, User as UserIcon, History, ShieldCheck, Globe, IndianRupee, MessageSquare, CheckCircle2, Trash2, RefreshCw, Shield, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DashboardPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  const params = React.use(props.params);
  const searchParams = React.use(props.searchParams);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isUpdating2FA, setIsUpdating2FA] = useState(false);
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const donationsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "donations");
  }, [firestore, user]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "prayer_requests"), where("userId", "==", user.uid));
  }, [firestore, user]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: donations, isLoading: isDonationsLoading } = useCollection(donationsRef);
  const { data: userRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);
  const { data: userProfile } = useDoc(userDocRef);

  const isPasswordUser = user?.providerData.some(p => p.providerId === 'password');

  useEffect(() => {
    if (mounted && !isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading, router, mounted]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleResendVerification = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ variant: "destructive", title: "Error", description: "User session not found. Please log in again." });
      return;
    }
    
    setIsResending(true);
    try {
      await sendEmailVerification(currentUser);
      toast({ 
        title: language === 'hi' ? "सत्यापन लिंक भेजा गया" : "Verification Link Sent",
        description: language === 'hi' 
          ? "सत्यापन लिंक आपके ईमेल पर भेज दिया गया है। कृपया अपना स्पैम फोल्डर भी जांचें।" 
          : "Verification link sent to your email. Please check your inbox and spam folder."
      });
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/too-many-requests') {
        errorMessage = language === 'hi' 
          ? "बहुत अधिक प्रयास। कृपया थोड़ी देर बाद फिर से प्रयास करें।" 
          : "Too many attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = language === 'hi'
          ? "नेटवर्क त्रुटि। कृपया अपने इंटरनेट कनेक्शन की जांच करें।"
          : "Network error. Please check your internet connection.";
      }
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsResending(false);
    }
  };

  const handleRefreshStatus = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsRefreshing(true);
    try {
      await currentUser.reload();
      toast({ 
        title: language === 'hi' ? "प्रोफ़ाइल अपडेट की गई" : "Profile Updated",
        description: language === 'hi' ? "ताज़ा स्थिति सफलतापूर्वक प्राप्त की गई।" : "Latest status fetched successfully."
      });
      router.refresh();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdate2FA = async (enabled: boolean) => {
    if (!userDocRef) return;
    setIsUpdating2FA(true);
    try {
      const updateData: any = { twoFactorEnabled: enabled };
      if (enabled && newPin.length === 6) updateData.twoFactorPin = newPin;
      await updateDoc(userDocRef, updateData);
      toast({ title: t.dashboard2FAUpdateSuccess });
      setNewPin("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsUpdating2FA(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !firestore) return;

    const role = userProfile?.role || 'devotee';
    if (role !== 'devotee') {
      toast({
        variant: "destructive",
        title: language === 'hi' ? "इस्तीफा आवश्यक है" : "Resignation Required",
        description: t.dashboardDeleteResignFirst
      });
      return;
    }

    setIsDeleting(true);
    try {
      if (isPasswordUser) {
        if (!deletePassword) {
          toast({ variant: "destructive", title: "Password Required" });
          setIsDeleting(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email!, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }

      const userRef = doc(firestore, "users", user.uid);
      const adminRef = doc(firestore, "roles_admin", user.uid);
      
      await deleteDoc(userRef).catch(() => {});
      await deleteDoc(adminRef).catch(() => {});
      await deleteUser(user);
      
      toast({ title: t.dashboardDeleteSuccess });
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsDeleting(false);
      setDeletePassword("");
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
    <div className="min-h-screen bg-secondary/30 pb-20 pt-24 sm:pt-28">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 space-y-6 sm:space-y-8">
        <div className="flex items-center -mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/")}
            className="gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.backToHome}</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 sm:p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-full shrink-0"><UserIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /></div>
            <div className="space-y-0.5">
              <h1 className={cn("text-xl sm:text-2xl font-bold flex items-center gap-2", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {t.dashboardWelcome}, <span className="truncate max-w-[150px] sm:max-w-none">{user.displayName || user.email?.split('@')[0]}</span>
              </h1>
              <p className={cn("text-xs sm:text-sm text-muted-foreground", language === 'hi' ? 'font-hindi' : '')}>{t.dashboardSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link href="/" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full gap-2 h-9 text-xs sm:text-sm">
                <Globe className="h-4 w-4" />
                <span className={cn(language === "hi" ? "font-hindi" : "")}>{t.browseWebsite}</span>
              </Button>
            </Link>
            {adminDoc && (
              <Link href="/admin" className="flex-1 sm:flex-none">
                <Button variant="default" className="w-full gap-2 bg-primary text-primary-foreground h-9 text-xs sm:text-sm">
                  <ShieldCheck className="h-4 w-4" />{t.dashboardAdminPanel}
                </Button>
              </Link>
            )}
            <Button variant="ghost" onClick={handleLogout} className="w-full sm:w-auto gap-2 text-destructive hover:bg-destructive/10 h-9 text-xs sm:text-sm">
              <LogOut className="h-4 w-4" />{t.dashboardLogout}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-4 space-y-6 sm:space-y-8">
            <Card className="border-primary/20 shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5 border-b py-4 px-5"><CardTitle className="text-lg">{t.dashboardProfileInfo}</CardTitle></CardHeader>
              <CardContent className="pt-6 px-5 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">{t.dashboardEmail}</label>
                  <div className="font-medium text-sm truncate flex flex-wrap items-center gap-2">
                    <span className="truncate max-w-full">{user.email}</span>
                    {user.emailVerified ? (
                      <Badge className="bg-green-100 text-green-700 h-5 px-1.5 text-[9px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-destructive h-5 px-1.5 text-[9px]">Unverified</Badge>
                    )}
                  </div>
                  {!user.emailVerified && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 text-[10px] px-3" 
                        onClick={handleResendVerification} 
                        disabled={isResending}
                      >
                        {isResending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        {t.dashboardResendVerification}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[10px] px-3" 
                        onClick={handleRefreshStatus} 
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />
                        {isRefreshing ? '...' : (language === 'hi' ? 'ताज़ा करें' : 'Refresh')}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">{t.dashboardMemberSince}</label>
                  <p className="font-medium text-sm">{new Date(user.metadata.creationTime || "").toLocaleDateString()}</p>
                </div>
                <div className="pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive w-full justify-start gap-2 h-8 text-xs"><Trash2 className="h-4 w-4" />{t.dashboardDeleteAccount}</Button></AlertDialogTrigger>
                    <AlertDialogContent className="w-[95%] max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.dashboardDeleteConfirmTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{t.dashboardDeleteConfirmDesc}</AlertDialogDescription>
                      </AlertDialogHeader>
                      {isPasswordUser && (
                        <div className="py-4 space-y-3">
                          <Label htmlFor="delete-password" className="text-sm">{t.dashboardDeletePasswordLabel}</Label>
                          <Input id="delete-password" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Password" />
                        </div>
                      )}
                      <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                        <AlertDialogCancel onClick={() => setDeletePassword("")} className="mt-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground" disabled={isDeleting || (isPasswordUser && !deletePassword)}>{isDeleting ? '...' : 'Delete Account'}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 shadow-md bg-gradient-to-br from-white to-accent/5 p-5">
              <CardDescription className="text-xs">{t.dashboardTotalContribution}</CardDescription>
              <CardTitle className="text-3xl sm:text-4xl font-bold flex items-center gap-1 text-primary mt-1"><IndianRupee className="h-7 w-7 sm:h-8 sm:w-8" />{totalDonated}</CardTitle>
            </Card>

            <Card className="border-primary/20 shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5 border-b py-4 px-5"><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />{t.dashboardSecurityTab}</CardTitle></CardHeader>
              <CardContent className="pt-6 px-5 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5"><Label className="text-sm font-bold">{t.dashboard2FAEnable}</Label><p className="text-[10px] text-muted-foreground">{userProfile?.twoFactorEnabled ? t.dashboard2FAEnabled : t.dashboard2FADisabled}</p></div>
                  <Switch checked={userProfile?.twoFactorEnabled} onCheckedChange={handleUpdate2FA} disabled={isUpdating2FA || (!userProfile?.twoFactorEnabled && newPin.length !== 6)} />
                </div>
                {!userProfile?.twoFactorEnabled && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="twoFactorPin" className="text-xs">{t.dashboard2FASetPin}</Label>
                    <Input id="twoFactorPin" type="password" maxLength={6} placeholder="******" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} className="h-9 text-center tracking-[0.5em] font-bold" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-primary/20 shadow-md h-full overflow-hidden">
              <Tabs defaultValue="donations" className="w-full">
                <CardHeader className="border-b bg-white p-0">
                  <TabsList className="w-full justify-start h-12 sm:h-14 bg-transparent border-b-0 p-0 rounded-none overflow-x-auto no-scrollbar">
                    <TabsTrigger value="donations" className="h-full px-4 sm:px-6 font-bold rounded-none data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs sm:text-sm shrink-0"><History className="h-4 w-4 mr-2" />{t.dashboardDonationHistory}</TabsTrigger>
                    <TabsTrigger value="requests" className="h-full px-4 sm:px-6 font-bold rounded-none data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs sm:text-sm shrink-0"><MessageSquare className="h-4 w-4 mr-2" />{t.dashboardMyRequests}</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <TabsContent value="donations" className="m-0 focus-visible:ring-0">
                  <CardContent className="p-0">
                    {isDonationsLoading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : donations && donations.length > 0 ? (
                      <div className="divide-y">
                        {donations.map(d => (
                          <div key={d.id} className="p-4 sm:p-5 flex justify-between items-center group hover:bg-muted/30 transition-colors">
                            <div>
                              <p className="font-bold text-lg sm:text-xl text-primary">₹{d.amount}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{new Date(d.date).toLocaleString()}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px]">{d.mode}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 sm:py-24 text-center text-muted-foreground px-4">
                        <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">{t.dashboardNoDonations}</p>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>
                <TabsContent value="requests" className="m-0 focus-visible:ring-0">
                  <CardContent className="p-0">
                    {isRequestsLoading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : userRequests && userRequests.length > 0 ? (
                      <div className="divide-y">
                        <div className="p-4 bg-muted/20 flex justify-end">
                          <Link href="/prayer-request">
                            <Button size="sm" className="gap-2 h-8 text-xs">
                              <Plus className="h-3 w-3" />
                              {t.dashboardNewRequest}
                            </Button>
                          </Link>
                        </div>
                        {userRequests.map(r => (
                          <div key={r.id} className="p-4 sm:p-5 hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h4 className="font-bold text-sm sm:text-base">{r.requestType}</h4>
                              <Badge className={cn(
                                "text-[9px] sm:text-[10px] h-5",
                                r.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                r.status === 'viewed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                              )}>
                                {r.status}
                              </Badge>
                            </div>
                            <p className="text-[11px] sm:text-sm text-muted-foreground bg-muted/30 p-2 sm:p-3 rounded-md italic">"{r.message}"</p>
                            <p className="text-[9px] text-muted-foreground/60 mt-2">{new Date(r.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 sm:py-24 text-center text-muted-foreground px-4 flex flex-col items-center gap-4">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">{language === 'hi' ? 'कोई निवेदन नहीं मिला।' : 'No requests found.'}</p>
                        <Link href="/prayer-request">
                          <Button variant="default" className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t.dashboardNewRequest}
                          </Button>
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
