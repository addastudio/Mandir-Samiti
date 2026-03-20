
"use client";

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuth, signOut, sendEmailVerification, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { collection, doc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { Loader2, LogOut, User as UserIcon, History, ShieldCheck, Globe, IndianRupee, MessageSquare, PlusCircle, CheckCircle2, Clock, AlertCircle, Trash2, Mail, RefreshCw, Shield } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
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
    const auth = getAuth();
    await signOut(auth);
    router.push("/");
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({ title: t.dashboardVerificationSent });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsResending(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      await user.reload();
      toast({ title: "Profile updated." });
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
      
      // CRITICAL: Delete Firestore docs BEFORE the Auth user.
      await deleteDoc(userRef);
      await deleteDoc(adminRef);
      await deleteUser(user);
      
      toast({ title: t.dashboardDeleteSuccess });
      router.push("/");
    } catch (error: any) {
      console.error("Account deletion error:", error);
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
    <div className="min-h-screen bg-secondary/30 pb-20 pt-28">
      <div className="container mx-auto px-4 md:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full"><UserIcon className="h-8 w-8 text-primary" /></div>
            <div className="space-y-1">
              <h1 className={cn("text-2xl font-bold flex items-center gap-2", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {t.dashboardWelcome}, {user.displayName || user.email?.split('@')[0]}
              </h1>
              <p className={cn("text-sm text-muted-foreground", language === 'hi' ? 'font-hindi' : '')}>{t.dashboardSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/"><Button variant="outline" className="gap-2"><Globe className="h-4 w-4" />{t.browseWebsite}</Button></Link>
            {adminDoc && <Link href="/admin"><Button variant="default" className="gap-2 bg-primary text-primary-foreground"><ShieldCheck className="h-4 w-4" />{t.dashboardAdminPanel}</Button></Link>}
            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" />{t.dashboardLogout}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 border-b"><CardTitle>{t.dashboardProfileInfo}</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t.dashboardEmail}</label>
                  <div className="font-medium truncate flex items-center gap-2">
                    {user.email}
                    {user.emailVerified ? <Badge className="bg-green-100 text-green-700 h-5 px-1.5"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge> : <Badge variant="outline" className="text-destructive h-5 px-1.5">Unverified</Badge>}
                  </div>
                  {!user.emailVerified && (
                    <div className="flex gap-2">
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleResendVerification} disabled={isResending}>{isResending ? '...' : t.dashboardResendVerification}</Button>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground" onClick={handleRefreshStatus} disabled={isRefreshing}><RefreshCw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />{isRefreshing ? '...' : 'Refresh'}</Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t.dashboardMemberSince}</label>
                  <p className="font-medium">{new Date(user.metadata.creationTime || "").toLocaleDateString()}</p>
                </div>
                <div className="pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive w-full justify-start gap-2"><Trash2 className="h-4 w-4" />{t.dashboardDeleteAccount}</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.dashboardDeleteConfirmTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{t.dashboardDeleteConfirmDesc}</AlertDialogDescription>
                      </AlertDialogHeader>
                      {isPasswordUser && (
                        <div className="py-4 space-y-3">
                          <Label htmlFor="delete-password">{t.dashboardDeletePasswordLabel}</Label>
                          <Input id="delete-password" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Password" />
                        </div>
                      )}
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletePassword("")}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground" disabled={isDeleting || (isPasswordUser && !deletePassword)}>{isDeleting ? '...' : 'Delete Account'}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 shadow-md bg-gradient-to-br from-white to-accent/5">
              <CardHeader className="pb-2"><CardDescription>{t.dashboardTotalContribution}</CardDescription><CardTitle className="text-4xl font-bold flex items-center gap-1 text-primary"><IndianRupee className="h-8 w-8" />{totalDonated}</CardTitle></CardHeader>
            </Card>

            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 border-b py-4"><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />{t.dashboardSecurityTab}</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label className="text-sm font-bold">{t.dashboard2FAEnable}</Label><p className="text-[10px] text-muted-foreground">{userProfile?.twoFactorEnabled ? t.dashboard2FAEnabled : t.dashboard2FADisabled}</p></div>
                  <Switch checked={userProfile?.twoFactorEnabled} onCheckedChange={handleUpdate2FA} disabled={isUpdating2FA || (!userProfile?.twoFactorEnabled && newPin.length !== 6)} />
                </div>
                {!userProfile?.twoFactorEnabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <Label htmlFor="twoFactorPin" className="text-xs">{t.dashboard2FASetPin}</Label>
                    <Input id="twoFactorPin" type="password" maxLength={6} placeholder="******" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} className="h-8" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-primary/20 shadow-md h-full overflow-hidden">
              <Tabs defaultValue="donations" className="w-full">
                <CardHeader className="border-b bg-white p-0">
                  <TabsList className="w-full justify-start h-14 bg-transparent border-b-0 p-0">
                    <TabsTrigger value="donations" className="h-full px-6 font-bold"><History className="h-4 w-4 mr-2" />{t.dashboardDonationHistory}</TabsTrigger>
                    <TabsTrigger value="requests" className="h-full px-6 font-bold"><MessageSquare className="h-4 w-4 mr-2" />{t.dashboardMyRequests}</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <TabsContent value="donations" className="m-0"><CardContent className="p-0">
                  {isDonationsLoading ? <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (donations && donations.length > 0 ? (
                    <div className="divide-y">{donations.map(d => <div key={d.id} className="p-5 flex justify-between"><div><p className="font-bold text-xl text-primary">₹{d.amount}</p><p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleString()}</p></div><Badge variant="outline">{d.mode}</Badge></div>)}</div>
                  ) : <div className="py-24 text-center text-muted-foreground">{t.dashboardNoDonations}</div>)}
                </CardContent></TabsContent>
                <TabsContent value="requests" className="m-0"><CardContent className="p-0">
                  {isRequestsLoading ? <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (userRequests && userRequests.length > 0 ? (
                    <div className="divide-y">{userRequests.map(r => <div key={r.id} className="p-5"><div><h4 className="font-bold">{r.requestType}</h4><Badge>{r.status}</Badge></div><p className="text-sm mt-2 italic">{r.message}</p></div>)}</div>
                  ) : <div className="py-24 text-center text-muted-foreground">No requests found.</div>)}
                </CardContent></TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
