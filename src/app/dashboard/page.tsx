
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
import { Loader2, LogOut, User as UserIcon, History, ShieldCheck, Globe, IndianRupee, MessageSquare, Trash2, RefreshCw, Plus, AlertCircle, Calendar, CreditCard, Banknote, QrCode, Settings, Search, Sparkles, Star, Heart, Camera, Upload, CheckCircle2, TrendingUp, Trophy, Info } from "lucide-react";
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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Progress } from "@/components/ui/progress";

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

  // Default Man Profile
  const defaultManPhoto = React.useMemo(() => PlaceHolderImages.find(img => img.id === 'default-man-profile')?.imageUrl || "https://picsum.photos/seed/avatar-man-1/200/200", []);

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
          ? "आपके उदार योगदान के लिए धन्यवाद। हम आपकी सहायता की सराहना करते हैं।" 
          : "Thank you for your generous contribution. We appreciate your support!",
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
      setProfilePhotoPreview(userProfile.photoURL || user?.photoURL || defaultManPhoto);
    }
  }, [userProfile, user, defaultManPhoto]);

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
      // 1. Update Auth Profile
      await updateProfile(user, {
        displayName: profileName,
        photoURL: profilePhotoPreview
      });

      // 2. Update Firestore Doc
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
    if (userProfile?.role && !['devotee'].includes(userProfile.role)) {
      toast({ variant: "destructive", title: "Resignation Required", description: t.dashboardDeleteResignFirst });
      return;
    }
    setIsDeleting(true);
    try {
      if (user.providerData.some(p => p.providerId === 'password')) {
        const credential = EmailAuthProvider.credential(user.email!, confirmPassword);
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
  const isVerified = userProfile?.isVerified ?? true;
  
  const getTierInfo = (amount: number) => {
    if (amount >= 5000) {
      return { 
        label: t.dashboardTierPatron, 
        color: 'bg-primary text-primary-foreground', 
        icon: Sparkles,
        progress: 100,
        nextTier: null,
        needed: 0
      };
    }
    if (amount >= 1000) {
      return { 
        label: t.dashboardTierPillar, 
        color: 'bg-amber-100 text-amber-700 border-amber-200', 
        icon: Star,
        progress: ((amount - 1000) / (5000 - 1000)) * 100,
        nextTier: t.dashboardTierPatron,
        needed: 5000 - amount
      };
    }
    return { 
      label: t.dashboardTierSupporter, 
      color: 'bg-secondary text-secondary-foreground', 
      icon: Heart,
      progress: (amount / 1000) * 100,
      nextTier: t.dashboardTierPillar,
      needed: 1000 - amount
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

  const upcomingEvents = events
    ? [...events]
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 pt-24 sm:pt-28">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard' }]} />

        {!isVerified && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{language === 'hi' ? 'खाता सत्यापित नहीं है' : 'Account Not Verified'}</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-4">
              <p className="text-sm">{language === 'hi' ? 'कृपया अपनी लॉगिन स्क्रीन पर जाकर खाता सत्यापित करें।' : 'Please complete your account verification to access all features.'}</p>
              <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 w-fit" onClick={() => router.push('/login')}>
                {language === 'hi' ? 'अभी सत्यापित करें' : 'Verify Now'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 sm:p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary shadow-sm">
                <AvatarImage src={user.photoURL || userProfile?.photoURL || defaultManPhoto} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white" />
            </div>
            <div className="space-y-0.5 min-w-0">
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
            <Card className="border-primary/20 shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5 py-4 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{t.dashboardProfileInfo}</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleRefreshStatus} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
              </CardHeader>
              <CardContent className="pt-6 px-5 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.dashboardTierLabel}</span>
                    <Badge className={cn("text-[10px] gap-1 px-2 py-0.5 shadow-sm", tier.color)}>
                      <TierIcon className="h-3 w-3" /> {tier.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {tier.nextTier 
                          ? (language === 'hi' ? `${tier.nextTier} बनने की प्रगति` : `Progress to ${tier.nextTier}`)
                          : (language === 'hi' ? 'उच्चतम स्तर प्राप्त!' : 'Highest Honor Achieved!')}
                      </p>
                      {tier.nextTier && <span className="text-[10px] font-bold text-primary">₹{totalDonated} / ₹{tier.needed + totalDonated}</span>}
                    </div>
                    <Progress value={tier.progress} className="h-2 bg-secondary" />
                    {tier.nextTier && (
                      <p className="text-[10px] italic text-muted-foreground leading-tight">
                        {language === 'hi' 
                          ? `केवल ₹${tier.needed} और दान करके मंदिर के ${tier.nextTier} बनें।` 
                          : `Contribute ₹${tier.needed} more to become a Temple ${tier.nextTier}.`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tighter">{t.dashboardEmail}</label>
                    <div className="font-medium text-sm flex items-center gap-2 min-w-0">
                      <span className="truncate">{user.email}</span>
                      {isVerified ? (
                        <Badge className="bg-green-100 text-green-700 h-5 text-[9px] shrink-0">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive h-5 text-[9px] shrink-0">Unverified</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tighter">{t.dashboardMemberSince}</label>
                    <p className="font-medium text-sm">{new Date(user.metadata.creationTime || "").toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patronage Honors Card */}
            <Card className="border-amber-200 shadow-sm overflow-hidden bg-amber-50/30">
              <CardHeader className="bg-amber-100/50 py-3 px-5 border-b border-amber-200">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-900">
                  <Sparkles className="h-4 w-4" /> {t.dashboardTierHonorsTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="bg-secondary p-2 rounded-lg h-fit"><Heart className="h-4 w-4 text-secondary-foreground" /></div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t.dashboardTierSupporter}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{t.dashboardTierSupporterDesc}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg h-fit border border-amber-200"><Star className="h-4 w-4 text-amber-700" /></div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t.dashboardTierPillar} (₹1,000+)</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{t.dashboardTierPillarDesc}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-primary p-2 rounded-lg h-fit"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t.dashboardTierPatron} (₹5,000+)</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{t.dashboardTierPatronDesc}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-amber-200">
                  <p className="text-[9px] italic text-amber-800 opacity-70">
                    <Info className="h-3 w-3 inline mr-1" />
                    {language === 'hi' 
                      ? 'सहयोग स्तर पिछले १२ महीनों के कुल दान पर आधारित होते हैं।' 
                      : 'Patronage levels are based on total contributions over the last 12 months.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-gradient-to-br from-white to-accent/5 p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy className="h-24 w-24 text-accent" />
              </div>
              <CardDescription className="text-xs font-bold uppercase tracking-widest relative z-10">{t.dashboardTotalContribution}</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center gap-1 text-primary mt-1 relative z-10">
                <IndianRupee className="h-7 w-7" />{totalDonated}
              </CardTitle>
              <p className="text-[10px] text-muted-foreground mt-2 relative z-10 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                {language === 'hi' ? 'आपका दान मंदिर के विकास में सहायक है।' : 'Your Sewa builds a stronger temple.'}
              </p>
              <div className="mt-4 pt-4 border-t border-accent/10 relative z-10">
                <Link href="/donate">
                  <Button variant="secondary" className="w-full h-10 text-xs font-bold uppercase tracking-wider group-hover:scale-105 transition-transform" size="sm">
                    {t.navDonate}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-primary/20 shadow-md h-full overflow-hidden flex flex-col">
              <Tabs defaultValue="donations" className="w-full flex-grow flex flex-col">
                <div className="border-b bg-white overflow-x-auto touch-scroll py-1">
                  <TabsList className="flex w-max min-w-full justify-start h-12 bg-transparent border-b-0 p-0 rounded-none flex-nowrap">
                    <TabsTrigger value="donations" className="shrink-0 h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><History className="h-4 w-4 mr-2" />{t.dashboardDonationHistory}</TabsTrigger>
                    <TabsTrigger value="requests" className="shrink-0 h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><MessageSquare className="h-4 w-4 mr-2" />{t.dashboardMyRequests}</TabsTrigger>
                    <TabsTrigger value="events" className="shrink-0 h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><Calendar className="h-4 w-4 mr-2" />{t.dashboardEventsTab}</TabsTrigger>
                    <TabsTrigger value="profile" className="shrink-0 h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><UserIcon className="h-4 w-4 mr-2" />{t.dashboardProfileTab}</TabsTrigger>
                    <TabsTrigger value="settings" className="shrink-0 h-full px-6 font-bold rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"><Settings className="h-4 w-4 mr-2" />{t.dashboardSettingsTab}</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="donations" className="m-0 flex-grow">
                  <div className="p-4 border-b bg-muted/10">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder={t.dashboardHistorySearch} 
                        className="pl-10 h-9 text-xs" 
                        value={historySearch} 
                        onChange={(e) => setHistorySearch(e.target.value)} 
                      />
                    </div>
                  </div>
                  <CardContent className="p-0">
                    {isDonationsLoading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : filteredDonations.length > 0 ? (
                      <div className="divide-y">
                        {filteredDonations.map(d => (
                          <div key={d.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "p-2 sm:p-3 rounded-full",
                                d.mode?.includes('Stripe') ? "bg-blue-50 text-blue-600" : 
                                d.mode?.includes('UPI') ? "bg-green-50 text-green-600" : "bg-primary/5 text-primary"
                              )}>
                                {d.mode?.includes('Stripe') ? <CreditCard className="h-5 w-5" /> : 
                                 d.mode?.includes('UPI') ? <QrCode className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-lg text-primary flex items-center gap-1"><IndianRupee className="h-4 w-4" />{d.amount}</p>
                                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" /> {new Date(d.date).toLocaleString()}
                                </div>
                                <div className="text-[9px] uppercase font-bold tracking-tighter text-muted-foreground/60">{d.mode || 'Direct'}</div>
                              </div>
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                              <Badge className={cn(
                                "text-[9px] uppercase font-black",
                                d.status === 'completed' ? "bg-green-100 text-green-700" :
                                d.status === 'failed' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {d.status || 'completed'}
                              </Badge>
                              {d.id && <span className="text-[8px] font-mono text-muted-foreground opacity-40">Ref: {d.id.slice(0, 8)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-muted-foreground px-4 space-y-4">
                        <History className="h-12 w-12 mx-auto opacity-20" />
                        <p>{t.dashboardNoDonations}</p>
                        <Link href="/donate"><Button variant="outline" size="sm" className="gap-2"><Plus className="h-4 w-4" /> {t.navDonate}</Button></Link>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>

                <TabsContent value="requests" className="m-0 flex-grow">
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
                              <h4 className="font-bold text-sm uppercase tracking-wider">{r.requestType}</h4>
                              <Badge className={cn("text-[9px] h-5", r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'viewed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}>{r.status}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-md italic">"{r.message}"</p>
                            <p className="text-[9px] text-muted-foreground/60 mt-2">{new Date(r.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 sm:py-24 text-center text-muted-foreground px-4">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="mb-4">{language === 'hi' ? 'कोई निवेदन नहीं मिला।' : 'No requests found.'}</p>
                        <Link href="/prayer-request">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t.dashboardNewRequest}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>

                <TabsContent value="events" className="m-0 flex-grow">
                  <CardContent className="p-6">
                    {isEventsLoading ? (
                      <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : upcomingEvents.length > 0 ? (
                      <div className="grid gap-4">
                        {upcomingEvents.map(e => (
                          <Card key={e.id} className="overflow-hidden flex items-stretch border-primary/10 hover:shadow-md transition-shadow">
                            {e.image && <div className="w-24 sm:w-32 shrink-0"><img src={e.image} className="h-full w-full object-cover" /></div>}
                            <div className="p-4 flex flex-col justify-center min-w-0">
                              <h4 className="font-bold text-sm sm:text-base truncate">{e.title}</h4>
                              <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(e.date).toLocaleDateString()}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-2">{e.description}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-muted-foreground px-4">
                        <Calendar className="h-12 w-12 mx-auto opacity-20 mb-4" />
                        <p>{t.dashboardNoEvents}</p>
                      </div>
                    )}
                  </CardContent>
                </TabsContent>

                <TabsContent value="profile" className="m-0 flex-grow p-6">
                  <form onSubmit={handleUpdateProfile} className="space-y-8 max-w-lg mx-auto">
                    <div className="space-y-4">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboardUpdatePhoto}</Label>
                      <div className="flex flex-col items-center gap-4">
                        <div 
                          className="relative group cursor-pointer"
                          onClick={() => document.getElementById('profile-img-input')?.click()}
                        >
                          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white shadow-xl ring-1 ring-primary/10">
                            <AvatarImage src={profilePhotoPreview || defaultManPhoto} />
                            <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold">
                              {user.displayName?.charAt(0) || user.email?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                          </div>
                          <div className="absolute bottom-1 right-1 bg-primary text-white p-1.5 rounded-full shadow-lg">
                            <Upload className="h-4 w-4" />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">{language === 'hi' ? 'फोटो बदलने के लिए क्लिक करें' : 'Click to change profile picture'}</p>
                        <input 
                          id="profile-img-input" 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="prof-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboardUpdateName}</Label>
                        <Input 
                          id="prof-name" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Your Name"
                          className="h-12 text-base"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dashboardEmail}</Label>
                        <Input 
                          value={user.email || ""} 
                          disabled 
                          className="h-12 bg-muted/50 text-muted-foreground"
                        />
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {language === 'hi' ? 'ईमेल पता बदला नहीं जा सकता।' : 'Email address cannot be changed.'}</p>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12 gap-2 shadow-lg" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                      {t.dashboardUpdateBtn}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="settings" className="m-0 flex-grow p-6 space-y-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">{t.dashboardLanguagePref}</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant={language === 'hi' ? 'default' : 'outline'} 
                        className="flex-1 h-12 gap-2" 
                        onClick={() => setLanguage('hi')}
                      >
                        <span className="text-lg">🇮🇳</span> हिंदी
                      </Button>
                      <Button 
                        variant={language === 'en' ? 'default' : 'outline'} 
                        className="flex-1 h-12 gap-2" 
                        onClick={() => setLanguage('en')}
                      >
                        <span className="text-lg">🇬🇧</span> English
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-8 border-t">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-destructive">{language === 'hi' ? 'खतरनाक जोन' : 'Danger Zone'}</h3>
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full justify-start gap-2 h-12">
                          <Trash2 className="h-4 w-4" />{t.dashboardDeleteAccount}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95%] max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t.dashboardDeleteConfirmTitle}</AlertDialogTitle>
                          <AlertDialogDescription>{t.dashboardDeleteConfirmDesc}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="del-password">{t.dashboardDeletePasswordLabel}</Label>
                            <Input 
                              id="del-password" 
                              type="password" 
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder={t.dashboardDeletePasswordPlaceholder}
                            />
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setConfirmPassword("")}>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAccount} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                            disabled={isDeleting || !confirmPassword}
                          >
                            {isDeleting ? '...' : 'Delete'}
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
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
