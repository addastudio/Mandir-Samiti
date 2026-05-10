"use client";

import * as React from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from "firebase/auth";
import { collection, doc, query, where, deleteDoc, updateDoc } from "firebase/firestore";
import { Loader2, LogOut, User as UserIcon, History, ShieldCheck, Globe, IndianRupee, MessageSquare, Trash2, RefreshCw, Plus, AlertCircle, Calendar, CreditCard, Banknote, QrCode, Settings, Search, Sparkles, Star, Heart, Camera, Upload, CheckCircle2, TrendingUp, Trophy, Info, Shield, Gem, Crown, Clock } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function DashboardContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // Profile Form States
  const [profileName, setProfileName] = useState("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && searchParams.get('success') === 'true') {
      toast({
        title: language === 'hi' ? "दान सफल!" : "Donation Successful!",
        description: language === 'hi' 
          ? "आपके उदार योगदान के लिए धन्यवाद।" 
          : "Thank you for your generous contribution.",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [mounted, searchParams, toast, language]);

  const donationsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "donations");
  }, [firestore, user]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "prayer_requests"), where("userId", "==", user.uid));
  }, [firestore, user]);

  const eventsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "events");
  }, [firestore]);

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
  const { data: events, isLoading: isEventsLoading } = useCollection(eventsRef);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);
  const { data: adminDoc } = useDoc(adminRoleRef);

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || user?.displayName || "");
      setProfilePhotoPreview(userProfile.photoURL || user?.photoURL || null);
    }
  }, [userProfile, user]);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading, router, mounted]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleRefreshStatus = async () => {
    if (!user || !auth) return;
    setIsRefreshing(true);
    try {
      await auth.currentUser?.reload();
      router.refresh();
      toast({ title: "Updated", description: "Profile status refreshed successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;
    setIsUpdatingProfile(true);
    try {
      await updateProfile(user, {
        displayName: profileName,
        photoURL: profilePhotoPreview
      });

      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        name: profileName,
        photoURL: profilePhotoPreview
      });

      toast({ title: "Success", description: t.dashboardProfileSuccess });
      router.refresh();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !firestore) return;
    
    if (adminDoc) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "इस्तीफा आवश्यक" : "Resignation Required", 
        description: t.dashboardDeleteResignFirst 
      });
      return;
    }

    setIsDeleting(true);
    try {
      if (user.providerData.some(p => p.providerId === 'password')) {
        const credential = EmailAuthProvider.credential(user.email!, confirmPassword);
        await reauthenticateWithCredential(user, credential);
      }
      const userRef = doc(firestore, "users", user.uid);
      await deleteDoc(userRef).catch(() => {});
      await deleteUser(user);
      toast({ title: "Account Deleted", description: "Your account has been successfully removed." });
      router.push("/");
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/requires-recent-login' || error.code === 'auth/wrong-password') {
        msg = t.dashboardDeleteRecentLogin;
      }
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setConfirmPassword("");
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
  
  const getTierInfo = (amount: number) => {
    if (amount >= 100000) {
      return { 
        label: t.dashboardTierGrandPatron, 
        badge: 'bg-indigo-600 text-white', 
        icon: Crown,
        progress: 100,
        nextTier: null,
        needed: 0,
        barColor: 'bg-indigo-600',
        textColor: 'text-indigo-900',
        bgTheme: 'bg-indigo-50/50'
      };
    }
    if (amount >= 10000) {
      return { 
        label: t.dashboardTierGuardian, 
        badge: 'bg-emerald-600 text-white', 
        icon: Shield,
        progress: ((amount - 10000) / (100000 - 10000)) * 100,
        nextTier: t.dashboardTierGrandPatron,
        needed: 100000 - amount,
        barColor: 'bg-emerald-600',
        textColor: 'text-emerald-900',
        bgTheme: 'bg-emerald-50/30'
      };
    }
    if (amount >= 5000) {
      return { 
        label: t.dashboardTierPatron, 
        badge: 'bg-primary text-primary-foreground', 
        icon: Sparkles,
        progress: ((amount - 5000) / (10000 - 5000)) * 100,
        nextTier: t.dashboardTierGuardian,
        needed: 10000 - amount,
        barColor: 'bg-primary',
        textColor: 'text-primary',
        bgTheme: 'bg-primary/5'
      };
    }
    if (amount >= 1000) {
      return { 
        label: t.dashboardTierPillar, 
        badge: 'bg-amber-100 text-amber-700 border-amber-200', 
        icon: Star,
        progress: ((amount - 1000) / (5000 - 1000)) * 100,
        nextTier: t.dashboardTierPatron,
        needed: 5000 - amount,
        barColor: 'bg-amber-500',
        textColor: 'text-amber-800',
        bgTheme: 'bg-amber-50/20'
      };
    }
    return { 
      label: t.dashboardTierSupporter, 
      badge: 'bg-secondary text-secondary-foreground', 
      icon: Heart,
      progress: Math.min((amount / 1000) * 100, 100),
      nextTier: t.dashboardTierPillar,
      needed: 1000 - amount,
      barColor: 'bg-muted-foreground/40',
      textColor: 'text-muted-foreground',
      bgTheme: 'bg-transparent'
    };
  };

  const tier = getTierInfo(totalDonated);
  const TierIcon = tier.icon;

  const filteredDonations = donations 
    ? [...donations]
        .filter(d => 
          d.amount?.toString().includes(historySearch) || 
          d.mode?.toLowerCase().includes(historySearch.toLowerCase()) ||
          new Date(d.date).toLocaleDateString().includes(historySearch)
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 pt-24 sm:pt-28">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 sm:p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary shadow-sm">
              <AvatarImage src={profilePhotoPreview || user.photoURL || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                <UserIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <h1 className={cn("text-xl sm:text-2xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {t.dashboardWelcome}, {user.displayName || user.email?.split('@')[0]}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.dashboardSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/"><Button variant="outline" size="sm" className="gap-2"><Globe className="h-4 w-4" />{t.browseWebsite}</Button></Link>
            {adminDoc && <Link href="/management"><Button variant="default" size="sm" className="gap-2 bg-primary text-primary-foreground"><ShieldCheck className="h-4 w-4" />{t.dashboardAdminPanel}</Button></Link>}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-destructive"><LogOut className="h-4 w-4" />{t.dashboardLogout}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <Card className={cn("border-primary/20 shadow-md overflow-hidden", tier.bgTheme)}>
              <CardHeader className="bg-primary/5 py-4 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{t.dashboardProfileInfo}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleRefreshStatus} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
              </CardHeader>
              <CardContent className="pt-6 px-5 space-y-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.dashboardTierLabel}</span>
                    <Badge className={cn("gap-1 px-3 py-1 uppercase tracking-wider", tier.badge)}>
                      <TierIcon className="h-3 w-3" /> {tier.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <p className={cn("text-[10px] font-bold uppercase", tier.textColor)}>
                        {tier.nextTier ? `Target: ${tier.nextTier}` : 'Peak Recognition'}
                      </p>
                      {tier.nextTier && <span className="text-[10px] font-black text-primary">₹{totalDonated} / ₹{tier.needed + totalDonated}</span>}
                    </div>
                    <div className="h-2.5 w-full bg-black/5 rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all duration-1000", tier.barColor)} style={{ width: `${tier.progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">{t.dashboardEmail}</label>
                    <p className="font-medium text-sm truncate">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">{t.dashboardMemberSince}</label>
                    <p className="font-medium text-sm">{new Date(user.metadata.creationTime || "").toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-gradient-to-br from-white to-accent/5 p-5 shadow-sm relative overflow-hidden">
              <Trophy className="absolute -right-4 -bottom-4 h-24 w-24 text-accent/10 rotate-12" />
              <CardDescription className="text-xs font-bold uppercase tracking-widest">{t.dashboardTotalContribution}</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center gap-1 text-primary mt-1">
                <IndianRupee className="h-7 w-7" />{totalDonated}
              </CardTitle>
              <div className="mt-4 pt-4 border-t border-accent/10">
                <Link href="/donate"><Button variant="secondary" className="w-full h-10 text-xs font-bold uppercase" size="sm">{t.navDonate}</Button></Link>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-primary/20 shadow-md h-full overflow-hidden flex flex-col">
              <Tabs defaultValue="donations" className="w-full flex-grow">
                <div className="border-b bg-white overflow-x-auto touch-scroll">
                  <TabsList className="flex w-max min-w-full justify-start h-12 bg-transparent p-0">
                    <TabsTrigger value="donations" className="h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><History className="h-4 w-4 mr-2" />{t.dashboardDonationHistory}</TabsTrigger>
                    <TabsTrigger value="requests" className="h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><MessageSquare className="h-4 w-4 mr-2" />{t.dashboardMyRequests}</TabsTrigger>
                    <TabsTrigger value="profile" className="h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><UserIcon className="h-4 w-4 mr-2" />{t.dashboardProfileTab}</TabsTrigger>
                    <TabsTrigger value="settings" className="h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><Settings className="h-4 w-4 mr-2" />{t.dashboardSettingsTab}</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="donations" className="m-0">
                  <div className="p-4 border-b bg-muted/10">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder={t.dashboardHistorySearch} className="pl-10 h-9" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                    </div>
                  </div>
                  <CardContent className="p-0">
                    {isDonationsLoading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : filteredDonations.length > 0 ? (
                      <div className="divide-y">
                        {filteredDonations.map(d => (
                          <div key={d.id} className="p-4 sm:p-6 flex flex-col sm:row justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-primary/5 rounded-full text-primary"><IndianRupee className="h-5 w-5" /></div>
                              <div>
                                <p className="font-bold text-lg">₹{d.amount}</p>
                                <p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleString()}</p>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60">{d.mode}</p>
                              </div>
                            </div>
                            <Badge className={d.status === 'completed' ? "bg-emerald-500" : "bg-amber-500"}>{d.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-muted-foreground px-4">
                        <History className="h-12 w-12 mx-auto opacity-20 mb-4" />
                        <p>{t.dashboardNoDonations}</p>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>

                <TabsContent value="requests" className="m-0">
                  <CardContent className="p-6">
                    <div className="flex justify-end mb-6">
                      <Link href="/prayer-request"><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />{t.dashboardNewRequest}</Button></Link>
                    </div>
                    {isRequestsLoading ? (
                      <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : userRequests && userRequests.length > 0 ? (
                      <div className="space-y-4">
                        {userRequests.map(r => (
                          <Card key={r.id} className="p-4 border-l-4 border-l-primary">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-sm uppercase">{r.requestType}</h4>
                              <Badge variant="outline">{r.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground italic">"{r.message}"</p>
                            <p className="text-[10px] text-muted-foreground mt-2">{new Date(r.createdAt).toLocaleString()}</p>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-muted-foreground">
                        <p>No prayer requests found.</p>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>

                <TabsContent value="profile" className="m-0 p-6">
                  <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-lg mx-auto">
                    <div className="space-y-4 flex flex-col items-center">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboardUpdatePhoto}</Label>
                      <div className="relative group cursor-pointer" onClick={() => document.getElementById('dash-img-input')?.click()}>
                        <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                          <AvatarImage src={profilePhotoPreview || user.photoURL || undefined} />
                          <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold"><UserIcon className="h-12 w-12" /></AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                        <input id="dash-img-input" type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="d-prof-name" className="text-xs font-bold uppercase text-muted-foreground">{t.dashboardUpdateName}</Label>
                        <Input id="d-prof-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                      </div>
                      <Button type="submit" className="w-full h-12" disabled={isUpdatingProfile}>
                        {isUpdatingProfile ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        {t.dashboardUpdateBtn}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="settings" className="m-0 p-6 space-y-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.dashboardLanguagePref}</h3>
                    <div className="flex gap-2">
                      <Button variant={language === 'hi' ? 'default' : 'outline'} className="flex-1 h-12" onClick={() => setLanguage('hi')}>हिंदी</Button>
                      <Button variant={language === 'en' ? 'default' : 'outline'} className="flex-1 h-12" onClick={() => setLanguage('en')}>English</Button>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8 border-t">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-destructive">Danger Zone</h3>
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full justify-start h-12"><Trash2 className="h-4 w-4 mr-2" />{t.dashboardDeleteAccount}</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95%] max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t.dashboardDeleteConfirmTitle}</AlertDialogTitle>
                          <AlertDialogDescription>{t.dashboardDeleteConfirmDesc}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Enter password to confirm" />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-white" disabled={isDeleting || !confirmPassword}>
                            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}