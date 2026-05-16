"use client";

import * as React from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, doc, collectionGroup, query, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { Editor } from '@tinymce/tinymce-react';
import { 
  Trash2, 
  Loader2, 
  Calendar, 
  Image as ImageIcon, 
  ShieldAlert, 
  Users, 
  Bell, 
  Globe, 
  MessageSquare, 
  CheckCircle2, 
  ShieldCheck, 
  Plus,
  Search, 
  BarChart3, 
  HandCoins, 
  Clock,
  AlertTriangle,
  Wand2,
  Settings,
  History,
  UserPlus,
  UserCog,
  UserMinus,
  Crown,
  User as UserIcon,
  Activity,
  TrendingUp,
  IndianRupee,
  LogOut,
  LayoutDashboard,
  Tv,
  CheckCircle,
  XCircle,
  Zap,
  Lock,
  Mail,
  Send,
  Info,
  Sparkles,
  Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getBackendConnectionStatus, getPaymentGatewayStatus, getEmailServiceStatus, getRecaptchaStatus } from "@/app/actions";

export default function ManagementPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview");
  
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ col: string, id: string, title: string, path?: string } | null>(null);

  // TinyMCE Content States
  const [historyEn, setHistoryEn] = useState("");
  const [historyHi, setHistoryHi] = useState("");
  const [missionEn, setMissionEn] = useState("");
  const [missionHi, setMissionHi] = useState("");

  useEffect(() => {
    setMounted(true);
    Promise.all([
      getBackendConnectionStatus(),
      getPaymentGatewayStatus(),
      getEmailServiceStatus(),
      getRecaptchaStatus()
    ]).then(([backend, payments, email, recaptcha]) => {
      setApiStatus({ backend, payments, email, recaptcha });
    });
  }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  const heroContentRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : doc(firestore, "site_content", "hero"), [firestore, adminDoc]);
  const aboutContentRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : doc(firestore, "site_content", "about"), [firestore, adminDoc]);
  const websiteSettingsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : doc(firestore, "settings", "website"), [firestore, adminDoc]);

  const { data: heroData } = useDoc(heroContentRef);
  const { data: aboutData } = useDoc(aboutContentRef);
  const { data: siteSettings } = useDoc(websiteSettingsRef);

  useEffect(() => {
    if (aboutData) {
      setHistoryEn(aboutData.historyEn || "");
      setHistoryHi(aboutData.historyHi || "");
      setMissionEn(aboutData.missionEn || "");
      setMissionHi(aboutData.missionHi || "");
    }
  }, [aboutData]);

  // Operational Collections
  const requestsRef = useMemoFirebase(() => (!firestore || !adminDoc || activeTab !== 'requests') ? null : collection(firestore, "prayer_requests"), [firestore, adminDoc, activeTab]);
  const allUsersRef = useMemoFirebase(() => (!firestore || !adminDoc || activeTab !== 'overview') ? null : collection(firestore, "users"), [firestore, adminDoc, activeTab]);
  const donationsGroupRef = useMemoFirebase(() => (!firestore || !adminDoc || activeTab !== 'overview') ? null : query(collectionGroup(firestore, "donations")), [firestore, adminDoc, activeTab]);
  const eventsRef = useMemoFirebase(() => (!firestore || !adminDoc || activeTab !== 'overview') ? null : collection(firestore, "events"), [firestore, adminDoc, activeTab]);

  const { data: requests } = useCollection(requestsRef);
  const { data: allUsers } = useCollection(allUsersRef);
  const { data: allDonations } = useCollection(donationsGroupRef);
  const { data: events } = useCollection(eventsRef);

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminLoading) {
      if (!user) router.push("/login");
      else if (!adminDoc) router.push("/dashboard");
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, router, mounted]);

  const logActivity = async (action: string, entityType: string, title: string) => {
    if (!firestore || !user) return;
    try {
      await addDoc(collection(firestore, "admin_activity_logs"), {
        adminId: user.uid,
        adminName: user.displayName || user.email,
        actionType: action,
        entityType,
        entityTitle: title,
        timestamp: new Date().toISOString()
      });
    } catch (e) {}
  };

  const handleSaveHero = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !heroContentRef) return;
    setIsSavingContent(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      await setDoc(heroContentRef, data, { merge: true });
      await logActivity('UPDATE', 'site_content/hero', 'Updated Homepage Hero');
      toast({ title: "Hero Content Saved" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleSaveAbout = async () => {
    if (!firestore || !aboutContentRef) return;
    setIsSavingContent(true);
    try {
      await setDoc(aboutContentRef, {
        historyEn,
        historyHi,
        missionEn,
        missionHi
      }, { merge: true });
      await logActivity('UPDATE', 'site_content/about', 'Updated About Content');
      toast({ title: "About Content Saved" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !websiteSettingsRef) return;
    setIsSavingContent(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      await setDoc(websiteSettingsRef, data, { merge: true });
      await logActivity('UPDATE', 'settings/website', 'Updated Site Settings');
      toast({ title: "Settings Saved" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSavingContent(false);
    }
  };

  const tinyMceInit = {
    height: 300,
    menubar: true,
    plugins: [
      'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
      'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'tinymceai', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown'
    ],
    toolbar: 'undo redo | tinymceai-chat tinymceai-quickactions | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
    tinycomments_mode: 'embedded',
    tinycomments_author: 'Admin',
    mergetags_list: [
      { value: 'Devotee.Name', title: 'Devotee Name' },
      { value: 'Temple.Name', title: 'Temple Name' },
    ],
    tinymceai_token_provider: async () => {
      // Demo provider for trial purposes
      return { token: 'demo' };
    },
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 pt-16 sm:pt-20">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 sm:p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0">
              <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div>
              <h1 className={cn("text-lg sm:text-2xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {language === 'hi' ? 'दैनिक मंदिर संचालन' : 'Daily Temple Operations'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
             <Link href="/dashboard"><Button variant="outline" size="sm" className="gap-2"><LayoutDashboard className="h-4 w-4" />{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</Button></Link>
             <Link href="/"><Button variant="outline" size="sm" className="gap-2"><Globe className="h-4 w-4" />{language === 'hi' ? 'वेबसाइट' : 'Website'}</Button></Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="w-full overflow-x-auto bg-muted/40 p-1 rounded-xl touch-scroll">
            <TabsList className="flex h-auto w-max justify-start gap-1 bg-transparent border-0 flex-nowrap">
              {[
                { value: 'overview', icon: BarChart3, label: language === 'hi' ? 'सारांश' : 'Overview' },
                { value: 'content', icon: Palette, label: language === 'hi' ? 'वेबसाइट कंटेंट' : 'Tiny CMS' },
                { value: 'settings', icon: Settings, label: language === 'hi' ? 'सेटिंग्स' : 'Settings' }
              ].map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 py-2 px-3 sm:px-4 shrink-0 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                  <tab.icon className="h-4 w-4" />
                  <span className="text-xs font-bold whitespace-nowrap">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
               <Card className="shadow-md">
                 <CardHeader className="bg-primary/5"><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Homepage (Hero)</CardTitle></CardHeader>
                 <CardContent className="pt-6">
                   <form onSubmit={handleSaveHero} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2"><Label className="text-xs uppercase opacity-60">Headline (English)</Label><Input name="headlineEn" defaultValue={heroData?.headlineEn} /></div>
                       <div className="space-y-2"><Label className="text-xs uppercase opacity-60">Headline (Hindi)</Label><Input name="headlineHi" defaultValue={heroData?.headlineHi} /></div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2"><Label className="text-xs uppercase opacity-60">Subtitle (English)</Label><Textarea name="subtitleEn" rows={3} defaultValue={heroData?.subtitleEn} /></div>
                       <div className="space-y-2"><Label className="text-xs uppercase opacity-60">Subtitle (Hindi)</Label><Textarea name="subtitleHi" rows={3} defaultValue={heroData?.subtitleHi} /></div>
                     </div>
                     <Button type="submit" className="w-full" disabled={isSavingContent}>{isSavingContent ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Hero Content"}</Button>
                   </form>
                 </CardContent>
               </Card>

               <Card className="shadow-md">
                 <CardHeader className="bg-accent/5"><CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-accent" />About Page (Rich Text)</CardTitle></CardHeader>
                 <CardContent className="pt-6 space-y-8">
                   <div className="space-y-4">
                     <Label className="text-xs font-black uppercase tracking-widest text-primary">History & Heritage (English)</Label>
                     <Editor
                       apiKey=""
                       init={tinyMceInit}
                       value={historyEn}
                       onEditorChange={(content) => setHistoryEn(content)}
                     />
                   </div>

                   <div className="space-y-4">
                     <Label className="text-xs font-black uppercase tracking-widest text-primary">मंदिर का इतिहास (Hindi)</Label>
                     <Editor
                       apiKey=""
                       init={tinyMceInit}
                       value={historyHi}
                       onEditorChange={(content) => setHistoryHi(content)}
                     />
                   </div>

                   <div className="space-y-4">
                     <Label className="text-xs font-black uppercase tracking-widest text-accent">Mission & Vision (English)</Label>
                     <Editor
                       apiKey=""
                       init={tinyMceInit}
                       value={missionEn}
                       onEditorChange={(content) => setMissionEn(content)}
                     />
                   </div>

                   <div className="space-y-4">
                     <Label className="text-xs font-black uppercase tracking-widest text-accent">हमारा लक्ष्य (Hindi)</Label>
                     <Editor
                       apiKey=""
                       init={tinyMceInit}
                       value={missionHi}
                       onEditorChange={(content) => setMissionHi(content)}
                     />
                   </div>

                   <Button onClick={handleSaveAbout} className="w-full h-12" disabled={isSavingContent}>
                     {isSavingContent ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Save Rich Content"}
                   </Button>
                 </CardContent>
               </Card>
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t.mgmtStatTotalCollection, value: `₹${allDonations?.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString() || 0}`, color: 'bg-primary/10 border-primary/20', icon: HandCoins },
                { label: t.mgmtStatPendingRequests, value: requests?.filter(r => r.status === 'pending').length || 0, color: 'bg-green-50 border-green-200', icon: MessageSquare },
                { label: t.mgmtStatActiveEvents, value: events?.length || 0, color: 'bg-amber-50 border-amber-200', icon: Calendar },
                { label: t.mgmtStatTotalDevotees, value: allUsers?.length || 0, color: 'bg-blue-50 border-blue-200', icon: Users }
              ].map((stat, i) => (
                <Card key={i} className={cn("relative overflow-hidden group transition-all hover:shadow-md", stat.color)}>
                  <stat.icon className="absolute -right-2 -bottom-2 h-16 w-16 opacity-10 rotate-12 transition-transform group-hover:scale-110" />
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">{stat.label}</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stat.value}</div></CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="bg-primary/5"><CardTitle className="text-lg">Site Identity & Live Stream</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Site Title (English)</Label><Input name="siteTitleEn" defaultValue={siteSettings?.siteTitleEn} /></div>
                    <div className="space-y-2"><Label>Site Title (Hindi)</Label><Input name="siteTitleHi" defaultValue={siteSettings?.siteTitleHi} /></div>
                  </div>
                  <div className="space-y-2"><Label>YouTube Live Aarti URL</Label><Input name="liveAartiUrl" defaultValue={siteSettings?.liveAartiUrl} /></div>
                  <div className="space-y-2"><Label>Favicon / Logo URL</Label><Input name="favicon" defaultValue={siteSettings?.favicon} /></div>
                  <Button type="submit" className="w-fit px-8" disabled={isSavingContent}>Save Global Settings</Button>
                </form>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-secondary/30">
              <CardHeader className="bg-secondary/30 border-b"><CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Infrastructure Status</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {apiStatus ? ([
                    { label: apiStatus.backend.firebase.label, active: apiStatus.backend.firebase.active, icon: Globe },
                    { label: "Stripe", active: apiStatus.payments.stripe, icon: HandCoins },
                    { label: "Cashfree", active: apiStatus.payments.cashfree, icon: Zap },
                    { label: "Resend", active: apiStatus.email.isLive, icon: MessageSquare }
                  ].map((api, idx) => (
                    <div key={idx} className="p-4 rounded-xl border bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3"><api.icon className="h-4 w-4" /><span className="text-xs font-bold">{api.label}</span></div>
                      <Badge variant={api.active ? "default" : "destructive"}>{api.active ? "LIVE" : "OFFLINE"}</Badge>
                    </div>
                  ))) : (<div className="col-span-full py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
          <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle><AlertDialogDescription>Are you sure you want to remove "{deleteConfirm?.title}"? This is permanent.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={async () => { if (!firestore || !deleteConfirm) return; const { col, id, title, path } = deleteConfirm; await logActivity('DELETE', col, title); const ref = path ? doc(firestore, path) : doc(firestore, col, id); await deleteDoc(ref); toast({ title: "Deleted Successfully" }); setDeleteConfirm(null); }} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
