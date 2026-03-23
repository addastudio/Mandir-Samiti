"use client";

import * as React from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { collection, doc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { Loader2, LogOut, User as UserIcon, History, ShieldCheck, Globe, IndianRupee, MessageSquare, CheckCircle2, Trash2, RefreshCw, Shield, ArrowLeft, Plus, AlertCircle } from "lucide-react";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);

  const { data: donations, isLoading: isDonationsLoading } = useCollection(donationsRef);
  const { data: userRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);
  const { data: adminDoc } = useDoc(adminRoleRef);

  const isPasswordUser = user?.providerData.some(p => p.providerId === 'password');

  useEffect(() => {
    if (mounted && !isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading, router, mounted]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleRefreshStatus = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      // In a real app, this would re-fetch the userDoc to check for isVerified status
      router.refresh();
      toast({ title: "Updated", description: "Profile status refreshed successfully." });
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

    if (userProfile?.role && userProfile?.role !== 'devotee') {
      toast({ variant: "destructive", title: "Resignation Required", description: t.dashboardDeleteResignFirst });
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
      
      toast({ title: "Account Deleted", description: "Your account has been successfully removed." });
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsDeleting(false);
      setDeletePassword("");
    }
  };

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const totalDonated = donations?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const isVerified = userProfile?.isVerified ?? true;

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 pt-24 sm:pt-28">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.backToHome}</span>
          </Button>
        </div>

        {!isVerified && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{language === 'hi' ? 'खाता सत्यापित नहीं है' : 'Account Not Verified'}</AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
              <span className="text-sm">{language === 'hi' ? 'कृपया अपनी लॉगिन स्क्रीन पर जाकर खाता सत्यापित करें।' : 'Please complete your account verification to access all features.'}</span>
              <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => router.push('/login')}>
                {language === 'hi' ? 'अभी सत्यापित करें' : 'Verify Now'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 sm:p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-full"><UserIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /></div>
            <div className="space-y-0.5">
              <h1 className={cn("text-xl sm:text-2xl font-bold flex items-center gap-2", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {t.dashboardWelcome}, <span className="truncate max-w-[150px] sm:max-w-none">{user.displayName || user.email?.split('@')[0]}</span>
              </h1>
              <p className={cn("text-xs sm:text-sm text-muted-foreground", language === 'hi' ? 'font-hindi' : '')}>{t.dashboardSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/"><Button variant="outline" size="sm" className="gap-2 h-9 text-xs sm:text-sm"><Globe className="h-4 w-4" />{t.browseWebsite}</Button></Link>
            {adminDoc && <Link href="/admin"><Button variant="default" size="sm" className="gap-2 bg-primary text-primary-foreground h-9 text-xs sm:text-sm"><ShieldCheck className="h-4 w-4" />{t.dashboardAdminPanel}</Button></Link>}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-destructive hover:bg-destructive/10 h-9 text-xs sm:text-sm"><LogOut className="h-4 w-4" />{t.dashboardLogout}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 py-4 px-5"><CardTitle className="text-lg">{t.dashboardProfileInfo}</CardTitle></CardHeader>
              <CardContent className="pt-6 px-5 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">{t.dashboardEmail}</label>
                  <div className="font-medium text-sm flex items-center gap-2">
                    <span className="truncate">{user.email}</span>
                    {isVerified ? (
                      <Badge className="bg-green-100 text-green-700 h-5 text-[9px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-destructive h-5 text-[9px]">Unverified</Badge>
                    )}
                  </div>
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
                          <Label htmlFor="delete-password">{t.dashboardDeletePasswordLabel}</Label>
                          <Input id="delete-password" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
                        </div>
                      )}
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletePassword("")}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive" disabled={isDeleting || (isPasswordUser && !deletePassword)}>{isDeleting ? '...' : 'Delete'}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-gradient-to-br from-white to-accent/5 p-5">
              <CardDescription className="text-xs">{t.dashboardTotalContribution}</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center gap-1 text-primary mt-1"><IndianRupee className="h-7 w-7" />{totalDonated}</CardTitle>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-primary/20 shadow-md h-full overflow-hidden">
              <Tabs defaultValue="donations" className="w-full">
                <CardHeader className="border-b bg-white p-0">
                  <TabsList className="w-full justify-start h-12 bg-transparent border-b-0 p-0 rounded-none">
                    <TabsTrigger value="donations" className="h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><History className="h-4 w-4 mr-2" />{t.dashboardDonationHistory}</TabsTrigger>
                    <TabsTrigger value="requests" className="h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><MessageSquare className="h-4 w-4 mr-2" />{t.dashboardMyRequests}</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <TabsContent value="donations" className="m-0">
                  <CardContent className="p-0">
                    {isDonationsLoading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : donations && donations.length > 0 ? (
                      <div className="divide-y">
                        {donations.map(d => (
                          <div key={d.id} className="p-4 flex justify-between items-center hover:bg-muted/30">
                            <div><p className="font-bold text-lg text-primary">₹{d.amount}</p><p className="text-[10px] text-muted-foreground">{new Date(d.date).toLocaleString()}</p></div>
                            <Badge variant="outline" className="text-[10px]">{d.mode}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-muted-foreground px-4"><History className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>{t.dashboardNoDonations}</p></div>
                    )}
                  </CardContent>
                </TabsContent>
                <TabsContent value="requests" className="m-0">
                  <CardContent className="p-0">
                    <div className="p-4 bg-muted/20 flex justify-end">
                      <Link href="/prayer-request"><Button size="sm" className="gap-2 h-8 text-xs"><Plus className="h-3 w-3" />{t.dashboardNewRequest}</Button></Link>
                    </div>
                    {isRequestsLoading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : userRequests && userRequests.length > 0 ? (
                      <div className="divide-y">
                        {userRequests.map(r => (
                          <div key={r.id} className="p-4 hover:bg-muted/30">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <h4 className="font-bold text-sm">{r.requestType}</h4>
                              <Badge className={cn("text-[9px] h-5", r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'viewed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}>{r.status}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md italic">"{r.message}"</p>
                            <p className="text-[9px] text-muted-foreground/60 mt-2">{new Date(r.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-muted-foreground px-4"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>{language === 'hi' ? 'कोई निवेदन नहीं मिला।' : 'No requests found.'}</p></div>
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
