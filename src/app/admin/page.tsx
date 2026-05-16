
"use client";

import * as React from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { doc, setDoc } from "firebase/firestore";
import { Editor } from '@tinymce/tinymce-react';
import { 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  Info, 
  Settings, 
  LayoutDashboard, 
  Globe, 
  ArrowLeft,
  Tv,
  Palette,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

/**
 * Tiny CMS Root Content Component
 */
function AdminCMSContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // TinyMCE Content States
  const [historyEn, setHistoryEn] = useState("");
  const [historyHi, setHistoryHi] = useState("");
  const [missionEn, setMissionEn] = useState("");
  const [missionHi, setMissionHi] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  const heroRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : doc(firestore, "site_content", "hero"), [firestore, adminDoc]);
  const aboutRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : doc(firestore, "site_content", "about"), [firestore, adminDoc]);
  const settingsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : doc(firestore, "settings", "website"), [firestore, adminDoc]);

  const { data: heroData } = useDoc(heroRef);
  const { data: aboutData } = useDoc(aboutRef);
  const { data: siteSettings } = useDoc(settingsRef);

  useEffect(() => {
    if (aboutData) {
      setHistoryEn(aboutData.historyEn || "");
      setHistoryHi(aboutData.historyHi || "");
      setMissionEn(aboutData.missionEn || "");
      setMissionHi(aboutData.missionHi || "");
    }
  }, [aboutData]);

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminLoading) {
      if (!user) router.push("/login");
      else if (!adminDoc) router.push("/dashboard");
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, router, mounted]);

  const handleSaveHero = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !heroRef) return;
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      await setDoc(heroRef, data, { merge: true });
      toast({ title: "Hero Content Saved Successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAbout = async () => {
    if (!firestore || !aboutRef) return;
    setIsSaving(true);
    try {
      await setDoc(aboutRef, {
        historyEn,
        historyHi,
        missionEn,
        missionHi
      }, { merge: true });
      toast({ title: "About Content Saved Successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !settingsRef) return;
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      await setDoc(settingsRef, data, { merge: true });
      toast({ title: "Global Settings Saved Successfully" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const tinyMceInit = {
    height: 400,
    menubar: true,
    plugins: [
      'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
      'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'tinymceai', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf'
    ],
    toolbar: 'undo redo | tinymceai-chat tinymceai-quickactions tinymceai-review | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
    tinycomments_mode: 'embedded',
    tinycomments_author: 'Admin',
    mergetags_list: [
      { value: 'First.Name', title: 'First Name' },
      { value: 'Email', title: 'Email' },
    ],
    tinymceai_token_provider: async () => {
      await fetch(`https://demo.api.tiny.cloud/1/jdufhga52csjp4vaqivcwaa029sbkc1d17pjqg8ro54ws7qg/auth/random`, { method: "POST", credentials: "include" });
      return { token: await fetch(`https://demo.api.tiny.cloud/1/jdufhga52csjp4vaqivcwaa029sbkc1d17pjqg8ro54ws7qg/jwt/tinymceai`, { credentials: "include" }).then(r => r.text()) };
    },
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user || !adminDoc) return null;

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 pt-16 sm:pt-20">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'वेबसाइट एडिटर' : 'Website Editor' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 sm:p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0">
              <Palette className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div>
              <h1 className={cn("text-lg sm:text-2xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                Tiny CMS
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {language === 'hi' ? 'वेबसाइट कंटेंट मैनेजमेंट' : 'Visual Content Management'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
             <Link href="/management"><Button variant="outline" size="sm" className="gap-2"><LayoutDashboard className="h-4 w-4" />{language === 'hi' ? 'प्रबंधन' : 'Management'}</Button></Link>
             <Link href="/"><Button variant="outline" size="sm" className="gap-2"><Globe className="h-4 w-4" />{language === 'hi' ? 'वेबसाइट' : 'View Site'}</Button></Link>
          </div>
        </div>

        <Tabs defaultValue="hero" className="w-full space-y-6">
          <div className="w-full overflow-x-auto bg-muted/40 p-1 rounded-xl touch-scroll">
            <TabsList className="flex h-auto w-max justify-start gap-1 bg-transparent border-0 flex-nowrap">
              <TabsTrigger value="hero" className="flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold">Homepage</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-bold">About Page</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                <Settings className="h-4 w-4" />
                <span className="text-xs font-bold">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="hero" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="shadow-md">
               <CardHeader className="bg-primary/5">
                 <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Hero Section Configuration</CardTitle>
                 <CardDescription>Update the primary headline and subtitle shown on the home page.</CardDescription>
               </CardHeader>
               <CardContent className="pt-6">
                 <form onSubmit={handleSaveHero} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Headline (English)</Label>
                        <Input name="headlineEn" defaultValue={heroData?.headlineEn} placeholder="Welcome to Surya Mandir" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Headline (Hindi)</Label>
                        <Input name="headlineHi" defaultValue={heroData?.headlineHi} className="font-hindi" placeholder="सूर्य मंदिर में आपका स्वागत है" />
                     </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Subtitle (English)</Label>
                        <Textarea name="subtitleEn" rows={3} defaultValue={heroData?.subtitleEn} placeholder="Preserving Faith..." />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Subtitle (Hindi)</Label>
                        <Textarea name="subtitleHi" rows={3} defaultValue={heroData?.subtitleHi} className="font-hindi" placeholder="आस्था का संरक्षण..." />
                     </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Video Background URL</Label>
                        <Input name="videoUrl" defaultValue={heroData?.videoUrl} placeholder="https://assets.mixkit.co/..." />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Fallback Image URL</Label>
                        <Input name="fallbackImage" defaultValue={heroData?.fallbackImage} placeholder="https://picsum.photos/..." />
                     </div>
                   </div>
                   <Button type="submit" className="w-full h-12 font-bold" disabled={isSaving}>
                     {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Publish Hero Changes"}
                   </Button>
                 </form>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="about" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="shadow-md">
               <CardHeader className="bg-accent/5">
                 <CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-accent" />About Page Rich Text Editor</CardTitle>
                 <CardDescription>Use TinyMCE Premium to format your temple's history and mission.</CardDescription>
               </CardHeader>
               <CardContent className="pt-6 space-y-10">
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <Label className="text-xs font-black uppercase tracking-widest text-primary">History & Heritage (English)</Label>
                     <Badge variant="outline" className="text-[10px]">Premium Editor</Badge>
                   </div>
                   <Editor
                     apiKey=""
                     init={tinyMceInit as any}
                     value={historyEn}
                     onEditorChange={(content) => setHistoryEn(content)}
                   />
                 </div>

                 <div className="space-y-4">
                   <Label className="text-xs font-black uppercase tracking-widest text-primary">मंदिर का इतिहास (Hindi)</Label>
                   <Editor
                     apiKey=""
                     init={tinyMceInit as any}
                     value={historyHi}
                     onEditorChange={(content) => setHistoryHi(content)}
                   />
                 </div>

                 <div className="space-y-4">
                   <Label className="text-xs font-black uppercase tracking-widest text-accent">Mission & Vision (English)</Label>
                   <Editor
                     apiKey=""
                     init={tinyMceInit as any}
                     value={missionEn}
                     onEditorChange={(content) => setMissionEn(content)}
                   />
                 </div>

                 <div className="space-y-4">
                   <Label className="text-xs font-black uppercase tracking-widest text-accent">हमारा लक्ष्य (Hindi)</Label>
                   <Editor
                     apiKey=""
                     init={tinyMceInit as any}
                     value={missionHi}
                     onEditorChange={(content) => setMissionHi(content)}
                   />
                 </div>

                 <Button onClick={handleSaveAbout} className="w-full h-14 font-bold text-lg" disabled={isSaving}>
                   {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Publish Rich Content Changes"}
                 </Button>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="shadow-md">
              <CardHeader className="bg-secondary/30">
                <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" />Global Site Identity</CardTitle>
                <CardDescription>Manage your site titles, live stream link, and branding.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase opacity-60">Site Title (English)</Label><Input name="siteTitleEn" defaultValue={siteSettings?.siteTitleEn} /></div>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase opacity-60">Site Title (Hindi)</Label><Input name="siteTitleHi" defaultValue={siteSettings?.siteTitleHi} className="font-hindi" /></div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase opacity-60 flex items-center gap-2"><Tv className="h-3 w-3 text-red-600" /> YouTube Live Aarti URL</Label>
                    <Input name="liveAartiUrl" defaultValue={siteSettings?.liveAartiUrl} placeholder="https://www.youtube.com/watch?v=..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase opacity-60">Favicon / Logo URL</Label>
                    <Input name="favicon" defaultValue={siteSettings?.favicon} placeholder="/uploads/logo.svg" />
                  </div>
                  <Button type="submit" className="w-fit px-10 h-12 font-bold" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Global Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function AdminCMSPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AdminCMSContent />
    </Suspense>
  );
}
