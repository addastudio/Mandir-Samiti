"use client";

import * as React from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, doc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Trash2, Loader2, Calendar, Image as ImageIcon, ShieldAlert, Users, UserPlus, UserMinus, Bell, Globe, LayoutDashboard, MessageSquare, CheckCircle2, LogOut, ShieldCheck, Mail, Shield, ArrowLeft, Upload, X, FileVideo, Info, Zap, Settings, AlertCircle, Ghost, Eye, EyeOff, History, Activity, UserCog, ChevronDown, ChevronUp, Pencil, Plus, Wand2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getEmailServiceStatus } from "@/app/actions";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { generateTempleContent } from "@/ai/flows/admin-ai-flow";

const ROLE_HIERARCHY: Record<string, number> = {
  'president': 100,
  'secretary': 90,
  'treasurer': 90,
  'official': 70,
  'committee_member': 50,
  'member': 30,
  'devotee': 10,
};

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  const [pendingRoleUpdate, setPendingRoleUpdate] = useState<{
    userId: string;
    targetCurrentRole: string;
    newRole: string;
    userName: string;
  } | null>(null);

  const [pendingAdminToggle, setPendingAdminToggle] = useState<{
    userId: string;
    isCurrentAdmin: boolean;
    userName: string;
    role: string;
  } | null>(null);

  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const [isResigningInProgress, setIsResigningInProgress] = useState(false);
  const [resignPassword, setResignPassword] = useState("");
  const [galleryMediaPreview, setGalleryMediaPreview] = useState<string | null>(null);
  const [eventMediaPreview, setEventMediaPreview] = useState<string | null>(null);
  const [editEventMediaPreview, setEditEventMediaPreview] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ isLive: boolean; provider: string } | null>(null);

  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [expandedNotices, setExpandedNotices] = useState<Record<string, boolean>>({});

  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);

  // AI Content Form States
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDescription] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
    getEmailServiceStatus().then(setEmailStatus);
  }, []);

  const toggleEvent = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleNotice = (id: string) => {
    setExpandedNotices((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: currentUserProfile } = useDoc(currentUserRef);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);

  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  const eventsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "events");
  }, [firestore]);

  const galleryRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "gallery");
  }, [firestore]);

  const usersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "users");
  }, [firestore]);

  const adminsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "roles_admin");
  }, [firestore]);

  const noticesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "notices");
  }, [firestore]);

  const requestsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "prayer_requests");
  }, [firestore]);

  const activityLogsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "admin_activity_logs");
  }, [firestore]);

  const { data: events } = useCollection(eventsRef);
  const { data: gallery } = useCollection(galleryRef);
  const { data: allUsers } = useCollection(usersRef);
  const { data: allAdmins } = useCollection(adminsRef);
  const { data: notices } = useCollection(noticesRef);
  const { data: requests } = useCollection(requestsRef);
  const { data: activityLogs } = useCollection(activityLogsRef);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminLoading) {
      if (!user) {
        router.push("/login");
      } else if (!adminDoc) {
        router.push("/dashboard");
      }
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, router, mounted]);

  const combinedUserList = React.useMemo(() => {
    const userMap = new Map<string, any>();
    allUsers?.forEach(u => {
      userMap.set(u.id, { ...u, hasProfile: true, isGhost: false });
    });
    allAdmins?.forEach(a => {
      if (userMap.has(a.id)) {
        const existing = userMap.get(a.id);
        userMap.set(a.id, { ...existing, isAdminRecord: true });
      } else {
        userMap.set(a.id, {
          id: a.id,
          name: language === 'hi' ? 'हटाया गया खाता' : 'Deleted Account',
          email: 'N/A',
          role: 'devotee',
          hasProfile: false,
          isGhost: true,
          isAdminRecord: true
        });
      }
    });
    return Array.from(userMap.values());
  }, [allUsers, allAdmins, language]);

  const handleAiGenerate = async (type: 'event' | 'notice') => {
    const topic = type === 'event' ? eventTitle : noticeTitle;
    if (!topic) {
      toast({ variant: "destructive", title: "Missing Topic", description: "Please enter a topic first." });
      return;
    }

    setIsAiGenerating(true);
    try {
      const result = await generateTempleContent({
        topic,
        type,
        language: language as 'hi' | 'en'
      });
      if (type === 'event') {
        setEventTitle(result.title);
        setEventDescription(result.content);
      } else {
        setNoticeTitle(result.title);
        setNoticeContent(result.content);
      }
      toast({ title: "AI Generation Successful", description: "Content has been updated." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate content. Ensure AI is configured." });
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminDoc) return null;

  const currentRole = currentUserProfile?.role || 'devotee';
  const isPresident = currentRole === 'president';

  const canManageUser = (targetUserId: string, targetRole: string) => {
    if (user?.uid === targetUserId) return false;
    if (isPresident) return true;
    const myPower = ROLE_HIERARCHY[currentRole] || 0;
    const targetPower = ROLE_HIERARCHY[targetRole || 'devotee'] || 0;
    return myPower > targetPower;
  };

  const logAction = (action: string, entityType: string, entityTitle: string) => {
    if (!firestore || !user) return;
    addDocumentNonBlocking(collection(firestore, "admin_activity_logs"), {
      adminId: user.uid,
      adminName: user.displayName || user.email,
      actionType: action,
      entityType,
      entityTitle,
      timestamp: new Date().toISOString()
    });
  };

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventsRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const imageURL = eventMediaPreview || (formData.get("image") as string);

    if (imageURL && imageURL.length > 1000000) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "फ़ाइल बहुत बड़ी है" : "File Too Large", 
        description: "Max 1MB" 
      });
      setIsSubmitting(false);
      return;
    }

    const eventData = {
      title,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      image: imageURL || "https://picsum.photos/seed/event/600/400",
    };
    addDocumentNonBlocking(eventsRef, eventData);
    logAction("CREATE", "Event", title);
    toast({ title: language === 'hi' ? "ईवेंट सफलतापूर्वक जोड़ा गया" : "Event Added Successfully" });
    (e.target as HTMLFormElement).reset();
    setEventMediaPreview(null);
    setEventTitle("");
    setEventDescription("");
    setIsSubmitting(false);
  };

  const handleEditEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !editingEvent) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const imageURL = editEventMediaPreview || (formData.get("image") as string);

    if (imageURL && imageURL.length > 1000000) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "फ़ाइल बहुत बड़ी है" : "File Too Large", 
        description: "Max 1MB" 
      });
      setIsSubmitting(false);
      return;
    }

    const eventData = {
      title,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      image: imageURL || editingEvent.image,
    };
    updateDocumentNonBlocking(doc(firestore, "events", editingEvent.id), eventData);
    logAction("UPDATE", "Event", title);
    toast({ title: language === 'hi' ? "ईवेंट सफलतापूर्वक अपडेट किया गया" : "Event Updated Successfully" });
    setEditingEvent(null);
    setEditEventMediaPreview(null);
    setIsSubmitting(false);
  };

  const handleAddNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!noticesRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const noticeData = {
      title,
      content: formData.get("content") as string,
      importance: formData.get("importance") as string || "normal",
      createdAt: new Date().toISOString(),
    };
    addDocumentNonBlocking(noticesRef, noticeData);
    logAction("CREATE", "Notice", title);
    toast({ title: language === 'hi' ? "सूचना सफलतापूर्वक जोड़ी गई" : "Notice Added Successfully" });
    (e.target as HTMLFormElement).reset();
    setNoticeTitle("");
    setNoticeContent("");
    setIsSubmitting(false);
  };

  const handleEditNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !editingNotice) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const noticeData = {
      title,
      content: formData.get("content") as string,
      importance: formData.get("importance") as string || "normal",
    };
    updateDocumentNonBlocking(doc(firestore, "notices", editingNotice.id), noticeData);
    logAction("UPDATE", "Notice", title);
    toast({ title: language === 'hi' ? "सूचना सफलतापूर्वक अपडेट की गई" : "Notice Updated Successfully" });
    setEditingNotice(null);
    setIsSubmitting(false);
  };

  const handleAddGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!galleryRef || !user) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const caption = formData.get("caption") as string;
    const imageURL = galleryMediaPreview || (formData.get("imageURL") as string);
    
    if (!imageURL) {
      toast({ variant: "destructive", title: "Media Required" });
      setIsSubmitting(false);
      return;
    }

    if (imageURL.length > 1000000) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "फ़ाइल बहुत बड़ी है" : "File Too Large", 
        description: language === 'hi' 
          ? "कृपया 1MB से छोटी फ़ाइल चुनें या किसी बाहरी लिंक (URL) का उपयोग करें।" 
          : "Please choose a file smaller than 1MB or use an external URL." 
      });
      setIsSubmitting(false);
      return;
    }

    const galleryData = {
      imageURL,
      caption,
      uploadedBy: user.uid,
    };

    addDocumentNonBlocking(galleryRef, galleryData);
    logAction("CREATE", "Gallery", caption);
    toast({ title: language === 'hi' ? "गैलरी आइटम जोड़ा गया" : "Gallery Item Added" });
    (e.target as HTMLFormElement).reset();
    setGalleryMediaPreview(null);
    setIsSubmitting(false);
  };

  const handleDelete = (col: string, id: string, title: string = "Item") => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, col, id));
    logAction("DELETE", col.charAt(0).toUpperCase() + col.slice(1), title);
    toast({ title: language === 'hi' ? "हटा दिया गया" : "Deleted" });
  };

  const confirmAdminToggle = async () => {
    if (!pendingAdminToggle || !firestore || !user) return;
    setIsActionProcessing(true);
    try {
      if (user.providerData.some(p => p.providerId === 'password')) {
        const credential = EmailAuthProvider.credential(user.email!, adminConfirmPassword);
        await reauthenticateWithCredential(user, credential);
      }
      const { userId, isCurrentAdmin, userName } = pendingAdminToggle;
      const roleRef = doc(firestore, "roles_admin", userId);
      if (isCurrentAdmin) {
        deleteDocumentNonBlocking(roleRef);
        logAction("REMOVE_ADMIN", "Admin Rights", userName);
      } else {
        setDocumentNonBlocking(roleRef, { assignedAt: new Date().toISOString() }, { merge: true });
        logAction("GRANT_ADMIN", "Admin Rights", userName);
      }
      setPendingAdminToggle(null);
      setAdminConfirmPassword("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsActionProcessing(false);
    }
  };

  const confirmRoleUpdate = async () => {
    if (!pendingRoleUpdate || !firestore || !user) return;
    setIsActionProcessing(true);
    try {
      if (user.providerData.some(p => p.providerId === 'password')) {
        const credential = EmailAuthProvider.credential(user.email!, adminConfirmPassword);
        await reauthenticateWithCredential(user, credential);
      }
      const { userId, targetCurrentRole, newRole, userName } = pendingRoleUpdate;
      updateDocumentNonBlocking(doc(firestore, "users", userId), { role: newRole });
      logAction("UPDATE_ROLE", "User Role", `${userName}: ${targetCurrentRole} to ${newRole}`);
      setPendingRoleUpdate(null);
      setAdminConfirmPassword("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleResign = async () => {
    if (!firestore || !user) return;
    setIsResigningInProgress(true);
    try {
      if (user.providerData.some(p => p.providerId === 'password')) {
        const credential = EmailAuthProvider.credential(user.email!, resignPassword);
        await reauthenticateWithCredential(user, credential);
      }
      updateDocumentNonBlocking(doc(firestore, "users", user.uid), { role: "devotee" });
      deleteDocumentNonBlocking(doc(firestore, "roles_admin", user.uid));
      logAction("RESIGN", "Self", user.displayName || user.email || "Admin");
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsResigningInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16 sm:pt-20">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 md:px-8 space-y-6 pt-4">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className={cn("text-xl sm:text-2xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
              </h1>
              <Badge variant="outline" className="mt-1 bg-primary/5">{currentRole}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/"><Button variant="outline" className="gap-2 h-9 text-xs sm:text-sm"><Globe className="h-4 w-4" />{language === 'hi' ? 'वेबसाइट' : 'Website'}</Button></Link>
            <Link href="/dashboard"><Button variant="outline" className="gap-2 h-9 text-xs sm:text-sm"><LayoutDashboard className="h-4 w-4" />{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</Button></Link>
            {currentRole !== 'devotee' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2 h-9 text-xs sm:text-sm"><LogOut className="h-4 w-4" />{language === 'hi' ? 'पद त्यागें' : 'Resign'}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95%] max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{language === 'hi' ? 'क्या आप पद छोड़ना चाहते हैं?' : 'Resign Post?'}</AlertDialogTitle>
                    <AlertDialogDescription>{language === 'hi' ? 'यह आपके प्रशासनिक अधिकार हटा देगा।' : 'This will remove your administrative rights.'}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4 space-y-2">
                    <Label>{language === 'hi' ? 'पासवर्ड' : 'Password'}</Label>
                    <Input type="password" value={resignPassword} onChange={(e) => setResignPassword(e.target.value)} />
                  </div>
                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                    <AlertDialogCancel onClick={() => setResignPassword("")}>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResign} disabled={isResigningInProgress || !resignPassword}>
                      {isResigningInProgress ? '...' : (language === 'hi' ? 'पुष्टि करें' : 'Confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <div className="pb-6 pt-2">
            <TabsList className="flex w-full items-center justify-start gap-2 overflow-x-auto bg-muted/40 p-1.5 rounded-xl border border-primary/10 shadow-sm touch-pan-x scroll-smooth overscroll-x-contain select-none">
              <TabsTrigger value="events" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 px-4 text-xs sm:text-sm shrink-0 shadow-sm rounded-lg transition-all"><Calendar className="h-4 w-4" /> {language === 'hi' ? 'कार्यक्रम' : 'Events'}</TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 px-4 text-xs sm:text-sm shrink-0 shadow-sm rounded-lg transition-all"><ImageIcon className="h-4 w-4" /> {language === 'hi' ? 'गैलरी' : 'Gallery'}</TabsTrigger>
              <TabsTrigger value="notices" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 px-4 text-xs sm:text-sm shrink-0 shadow-sm rounded-lg transition-all"><Bell className="h-4 w-4" /> {language === 'hi' ? 'सूचना' : 'Notice'}</TabsTrigger>
              <TabsTrigger value="requests" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 px-4 text-xs sm:text-sm shrink-0 shadow-sm rounded-lg transition-all"><MessageSquare className="h-4 w-4" /> {language === 'hi' ? 'निवेदन' : 'Requests'}</TabsTrigger>
              <TabsTrigger value="users" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 px-4 text-xs sm:text-sm shrink-0 shadow-sm rounded-lg transition-all"><Users className="h-4 w-4" /> {language === 'hi' ? 'उपयोगकर्ता' : 'Users'}</TabsTrigger>
              <TabsTrigger value="activity" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 px-4 text-xs sm:text-sm shrink-0 shadow-sm rounded-lg transition-all"><Activity className="h-4 w-4" /> {language === 'hi' ? 'गतिविधि' : 'Activity'}</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 px-4 text-xs sm:text-sm shrink-0 shadow-sm rounded-lg transition-all"><Settings className="h-4 w-4" /> {language === 'hi' ? 'सेटिंग्स' : 'Settings'}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="events" className="space-y-6 outline-none mt-4">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center justify-between">
                  {language === 'hi' ? 'नया कार्यक्रम जोड़ें' : 'Add New Event'}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-xs border-primary/20 hover:bg-primary/5"
                    onClick={() => handleAiGenerate('event')}
                    disabled={isAiGenerating || !eventTitle}
                  >
                    {isAiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                    {language === 'hi' ? 'AI से विवरण लिखें' : 'Generate with AI'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">{language === 'hi' ? 'ईवेंट का नाम' : 'Event Title'}</Label>
                        <Input id="title" name="title" required className="bg-secondary/10" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder={language === 'hi' ? 'उदाहरण: महा शिवरात्रि उत्सव' : 'e.g., Maha Shivratri Celebration'} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">{language === 'hi' ? 'तारीख और समय' : 'Date & Time'}</Label>
                        <Input id="date" name="date" type="datetime-local" required className="bg-secondary/10" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">{language === 'hi' ? 'विवरण' : 'Description'}</Label>
                        <Textarea id="description" name="description" required className="bg-secondary/10 min-h-[100px]" value={eventDesc} onChange={(e) => setEventDescription(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{language === 'hi' ? 'ईवेंट इमेज' : 'Event Image'}</Label>
                        <div 
                          className={cn(
                            "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-primary/5",
                            eventMediaPreview ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                          )}
                          onClick={() => document.getElementById('event-file-input')?.click()}
                        >
                          <input 
                            id="event-file-input" 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEventMediaPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {eventMediaPreview ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm">
                              <img src={eventMediaPreview} className="w-full h-full object-cover" />
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEventMediaPreview(null);
                                  const input = document.getElementById('event-file-input') as HTMLInputElement;
                                  if (input) input.value = '';
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <Upload className="h-6 w-6" />
                              </div>
                              <p className="text-xs font-medium text-muted-foreground">{language === 'hi' ? 'इमेज चुनें' : 'Choose Image'}</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-background px-2 text-muted-foreground">{language === 'hi' ? 'या' : 'OR'}</span></div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="image">{language === 'hi' ? 'इमेज URL (वैकल्पिक)' : 'Image URL (Optional)'}</Label>
                        <Input id="image" name="image" placeholder="https://..." className="bg-secondary/10" disabled={!!eventMediaPreview} />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>{isSubmitting ? '...' : (language === 'hi' ? 'कार्यक्रम जोड़ें' : 'Add Event')}</Button>
                </form>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events?.map((event) => {
                const isExpanded = !!expandedEvents[event.id];
                return (
                  <Card key={event.id} className="group overflow-hidden border-primary/5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative h-40 bg-muted">
                      <img src={event.image} alt={event.title} className="object-cover w-full h-full" />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-8 w-8 shadow-lg"
                          onClick={() => setEditingEvent(event)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8 shadow-lg"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-[95%] max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{language === 'hi' ? 'ईवेंट हटाएं?' : 'Delete Event?'}</AlertDialogTitle>
                              <AlertDialogDescription>{language === 'hi' ? 'क्या आप वाकई इसे हटाना चाहते हैं?' : 'Are you sure you want to delete this event?'}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                              <AlertDialogCancel>{language === 'hi' ? 'रद्द' : 'Cancel'}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete("events", event.id, event.title)} className="bg-destructive text-destructive-foreground">{language === 'hi' ? 'हटाएं' : 'Delete'}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg truncate">{event.title}</CardTitle>
                      <CardDescription className="text-xs">{new Date(event.date).toLocaleString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="border-t pt-2 mt-2">
                        <p className={cn(
                          "text-sm text-muted-foreground leading-relaxed italic",
                          !isExpanded && "line-clamp-3"
                        )}>
                          {event.description}
                        </p>
                        {event.description && event.description.length > 80 && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleEvent(event.id)}
                            className="p-0 h-auto mt-1 text-primary font-bold hover:no-underline flex items-center gap-1 text-[10px] sm:text-xs"
                          >
                            {isExpanded ? (
                              <> {language === 'hi' ? 'कम दिखाएं' : 'Show Less'} <ChevronUp className="h-3 w-3" /> </>
                            ) : (
                              <> {language === 'hi' ? 'और पढ़ें' : 'Read More'} <ChevronDown className="h-3 w-3" /> </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="notices" className="space-y-6 outline-none mt-4">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center justify-between">
                  {language === 'hi' ? 'नई सूचना जोड़ें' : 'Add Notice'}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-xs border-primary/20 hover:bg-primary/5"
                    onClick={() => handleAiGenerate('notice')}
                    disabled={isAiGenerating || !noticeTitle}
                  >
                    {isAiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {language === 'hi' ? 'AI संदेश लिखें' : 'Draft with AI'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddNotice} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="notice-title">{language === 'hi' ? 'शीर्षक' : 'Title'}</Label>
                      <Input id="notice-title" name="title" required className="bg-secondary/10" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder={language === 'hi' ? 'उदाहरण: मंदिर की सफाई सूचना' : 'e.g., Temple Cleaning Drive'} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="importance">{language === 'hi' ? 'महत्व' : 'Importance'}</Label>
                      <select name="importance" className="h-10 w-full rounded-md border border-input bg-secondary/10 px-3 py-2 text-sm shadow-sm ring-offset-background">
                        <option value="normal">{language === 'hi' ? 'सामान्य' : 'Normal'}</option>
                        <option value="urgent">{language === 'hi' ? 'महत्वपूर्ण' : 'Urgent'}</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">{language === 'hi' ? 'संदेश' : 'Message'}</Label>
                    <Textarea id="content" name="content" required className="bg-secondary/10 min-h-[100px]" value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>{isSubmitting ? '...' : (language === 'hi' ? 'जारी करें' : 'Post Notice')}</Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><History className="h-5 w-5" /> {language === 'hi' ? 'सूचना इतिहास' : 'Notice History'}</h3>
              <div className="grid grid-cols-1 gap-4">
                {notices?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notice) => {
                  const isExpanded = !!expandedNotices[notice.id];
                  return (
                    <Card key={notice.id} className={cn("border-l-4 shadow-sm", notice.importance === 'urgent' ? 'border-l-destructive' : 'border-l-primary')}>
                      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-bold truncate">{notice.title}</h4>
                            <Badge variant={notice.importance === 'urgent' ? 'destructive' : 'outline'} className="text-[10px] uppercase">{notice.importance}</Badge>
                          </div>
                          <p className={cn(
                            "text-sm text-muted-foreground leading-relaxed",
                            !isExpanded && "line-clamp-3"
                          )}>{notice.content}</p>
                          {notice.content && notice.content.length > 120 && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => toggleNotice(notice.id)}
                              className="p-0 h-auto mt-2 text-primary font-bold hover:no-underline flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <> {language === 'hi' ? 'कम दिखाएं' : 'Show Less'} <ChevronUp className="h-3 w-3" /> </>
                              ) : (
                                <> {language === 'hi' ? 'और पढ़ें' : 'Read More'} <ChevronDown className="h-3 w-3" /> </>
                              )}
                            </Button>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1 font-medium"><Calendar className="h-3 w-3" /> {new Date(notice.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-primary h-9 w-9 shrink-0 hover:bg-primary/5"
                            onClick={() => setEditingNotice(notice)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 shrink-0 hover:bg-destructive/5"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[95%] max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle>{language === 'hi' ? 'हटाएं?' : 'Delete?'}</AlertDialogTitle>
                                <AlertDialogDescription>{language === 'hi' ? 'क्या आप वाकई इसे हटाना चाहते हैं?' : 'Are you sure?'}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                                <AlertDialogCancel>{language === 'hi' ? 'रद्द' : 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete("notices", notice.id, notice.title)} className="bg-destructive text-destructive-foreground">{language === 'hi' ? 'हटाएं' : 'Delete'}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6 outline-none mt-4">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg">{language === 'hi' ? 'गैलरी आइटम' : 'Add Gallery'}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddGallery} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{language === 'hi' ? 'मीडिया अपलोड' : 'Upload Media'}</Label>
                        <div 
                          className={cn(
                            "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-primary/5",
                            galleryMediaPreview ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                          )}
                          onClick={() => document.getElementById('gallery-file-input')?.click()}
                        >
                          <input 
                            id="gallery-file-input" 
                            type="file" 
                            className="hidden" 
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setGalleryMediaPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {galleryMediaPreview ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm">
                              {galleryMediaPreview.startsWith('data:video') ? (
                                <video src={galleryMediaPreview} className="w-full h-full object-cover" />
                              ) : (
                                <img src={galleryMediaPreview} className="w-full h-full object-cover" />
                              )}
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGalleryMediaPreview(null);
                                  const input = document.getElementById('gallery-file-input') as HTMLInputElement;
                                  if (input) input.value = '';
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <Upload className="h-6 w-6" />
                              </div>
                              <p className="text-xs font-medium text-muted-foreground">{language === 'hi' ? 'फ़ाइल चुनें या यहाँ खींचें' : 'Choose file or drag here'}</p>
                              <p className="text-[10px] text-muted-foreground opacity-60">PNG, JPG, MP4 (Max 1MB recommended)</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-background px-2 text-muted-foreground">{language === 'hi' ? 'या' : 'OR'}</span></div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="imageURL">{language === 'hi' ? 'मीडिया URL' : 'Media URL'}</Label>
                        <Input 
                          id="imageURL" 
                          name="imageURL" 
                          placeholder="https://..." 
                          className="bg-secondary/10" 
                          disabled={!!galleryMediaPreview}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="caption">{language === 'hi' ? 'कैप्शन' : 'Caption'}</Label>
                        <Input id="caption" name="caption" required className="bg-secondary/10" placeholder={language === 'hi' ? 'विवरण लिखें...' : 'Enter caption...'} />
                      </div>
                      <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                          {language === 'hi' ? 'गैलरी में जोड़ें' : 'Add to Gallery'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {gallery?.map((item) => (
                <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <img src={item.imageURL} alt={item.caption} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-10 w-10 shadow-xl"><Trash2 className="h-5 w-5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[95%] max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Media?</AlertDialogTitle>
                          <AlertDialogDescription>This action is permanent.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete("gallery", item.id, item.caption)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] text-white truncate font-medium">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 outline-none mt-4">
            <Card className="border-primary/20 shadow-md overflow-hidden">
              <CardHeader className="bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> {language === 'hi' ? 'प्रशासनिक गतिविधि' : 'Admin Activity Log'}</CardTitle>
                <Badge variant="secondary" className="w-fit">{activityLogs?.length || 0} Records</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {activityLogs?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50).map((log) => {
                    const getActionIcon = (type: string) => {
                      if (type === 'DELETE' || type === 'REMOVE_ADMIN') return <Trash2 className="h-4 w-4" />;
                      if (type === 'GRANT_ADMIN' || type === 'UPDATE_ROLE' || type === 'UPDATE') return <UserCog className="h-4 w-4" />;
                      return <Upload className="h-4 w-4" />;
                    };

                    const getActionVerb = (type: string) => {
                      switch(type) {
                        case 'DELETE': return language === 'hi' ? 'ने हटाया' : 'deleted';
                        case 'CREATE': return language === 'hi' ? 'ने जोड़ा' : 'added';
                        case 'UPDATE': return language === 'hi' ? 'ने अपडेट किया' : 'updated';
                        case 'GRANT_ADMIN': return language === 'hi' ? 'ने व्यवस्थापक बनाया' : 'granted admin rights to';
                        case 'REMOVE_ADMIN': return language === 'hi' ? 'से व्यवस्थापक अधिकार हटाए' : 'removed admin rights from';
                        case 'UPDATE_ROLE': return language === 'hi' ? 'की भूमिका बदली' : 'updated role for';
                        case 'RESIGN': return language === 'hi' ? 'ने इस्तीफा दिया' : 'resigned as';
                        default: return language === 'hi' ? 'ने कार्य किया' : 'performed action on';
                      }
                    };

                    return (
                      <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className={cn(
                          "p-2.5 rounded-full shrink-0", 
                          (log.actionType === 'DELETE' || log.actionType === 'REMOVE_ADMIN') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        )}>
                          {getActionIcon(log.actionType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="text-sm font-bold">
                              <span className="text-primary">{log.adminName}</span> {getActionVerb(log.actionType)} <span className="text-foreground">{log.entityType}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded-full w-fit">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-xs italic text-muted-foreground mt-1.5 p-2 bg-secondary/20 rounded border border-primary/5 break-words">"{log.entityTitle}"</p>
                        </div>
                      </div>
                    );
                  })}
                  {(!activityLogs || activityLogs.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground italic px-4">No activity logs found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6 outline-none mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests?.map((req) => (
                <Card key={req.id} className="shadow-sm border-primary/5 flex flex-col h-full overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-secondary/10 flex flex-row items-center justify-between shrink-0">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">{req.requestType}</CardTitle>
                    <Badge className={cn("text-[9px] uppercase", req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{req.status}</Badge>
                  </CardHeader>
                  <CardContent className="pt-4 px-4 pb-4 space-y-3 flex-grow flex flex-col">
                    <div className="border-b border-primary/5 pb-2">
                      <p className="font-bold text-sm truncate">{req.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{req.email} | {req.phone}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium flex items-center gap-1 opacity-60"><Calendar className="h-2.5 w-2.5" /> {new Date(req.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-xs italic p-3 bg-muted/20 rounded-lg flex-grow leading-relaxed">"{req.message}"</p>
                    <div className="flex gap-2 pt-2 mt-auto">
                      <Button size="sm" variant="outline" className="flex-1 text-[10px] h-8" onClick={() => updateDocumentNonBlocking(doc(firestore, "prayer_requests", req.id), { status: 'completed' })} disabled={req.status === 'completed'}>Mark Complete</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95%] max-w-md">
                          <AlertDialogHeader><AlertDialogTitle>Delete Request?</AlertDialogTitle></AlertDialogHeader>
                          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete("prayer_requests", req.id, `${req.name}'s Request`)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 outline-none mt-4">
            <div className="space-y-4">
              {combinedUserList?.sort((a, b) => (ROLE_HIERARCHY[b.role] || 0) - (ROLE_HIERARCHY[a.role] || 0)).map((u) => {
                const isUserAdmin = allAdmins?.some(admin => admin.id === u.id);
                const canIManage = !u.isGhost && canManageUser(u.id, u.role || 'devotee');
                return (
                  <Card key={u.id} className={cn("shadow-sm border-primary/5 overflow-hidden", u.isGhost && "border-destructive/30 bg-destructive/5")}>
                    <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-primary shrink-0 shadow-inner">
                          {u.isGhost ? <Ghost className="h-6 w-6 text-destructive" /> : (u.name?.charAt(0) || "?")}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="font-bold flex items-center gap-2">
                            <span className="truncate">{u.name}</span>
                            {u.id === user?.uid && <Badge variant="outline" className="text-[8px] bg-white">YOU</Badge>}
                            {isUserAdmin && <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20">ADMIN</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          <p className="text-[10px] font-mono opacity-50 uppercase mt-1 tracking-tighter">{u.role || 'devotee'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-primary/5">
                        {!u.isGhost && (
                          <>
                            <select 
                              disabled={!canIManage} 
                              className="h-9 rounded-lg border border-primary/10 bg-secondary/10 text-xs px-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              value={u.role || 'devotee'} 
                              onChange={(e) => setPendingRoleUpdate({ userId: u.id, targetCurrentRole: u.role || 'devotee', newRole: e.target.value, userName: u.name || 'User' })}
                            >
                              <option value="devotee">Devotee</option>
                              <option value="member">Member</option>
                              <option value="official">Official</option>
                              <option value="president">President</option>
                            </select>
                            <Button 
                              disabled={!canIManage} 
                              variant={isUserAdmin ? "outline" : "default"} 
                              size="sm" 
                              className="h-9 text-xs flex-grow sm:flex-grow-0 rounded-lg px-4"
                              onClick={() => setPendingAdminToggle({ userId: u.id, isCurrentAdmin: !!isUserAdmin, userName: u.name || 'User', role: u.role || 'devotee' })}
                            >
                              {isUserAdmin ? <UserMinus className="h-3 w-3 mr-1.5" /> : <UserPlus className="h-3 w-3 mr-1.5" />}
                              {isUserAdmin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </>
                        )}
                        {isPresident && u.isGhost && (
                          <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 rounded-lg hover:bg-destructive/10" onClick={() => handleDelete("roles_admin", u.id, `Ghost Record ${u.id}`)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 outline-none mt-4">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> {language === 'hi' ? 'सिस्टम स्थिति' : 'System Status'}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 rounded-xl border border-primary/5 bg-secondary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg"><Mail className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-sm font-bold">{language === 'hi' ? 'ईमेल सेवा' : 'Email Service'}</p>
                      <p className="text-xs text-muted-foreground">{emailStatus?.isLive ? 'Active (Resend)' : 'Prototype Mode'}</p>
                    </div>
                  </div>
                  <Badge className={cn("w-fit px-3 py-1", emailStatus?.isLive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>{emailStatus?.isLive ? 'Live' : 'Simulated'}</Badge>
                </div>
                <div className="p-4 rounded-xl border border-primary/5 bg-secondary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg"><Shield className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-sm font-bold">{language === 'hi' ? 'सुरक्षा' : 'Security'}</p>
                      <p className="text-xs text-muted-foreground">Firestore RBAC Active</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 w-fit px-3 py-1">Protected</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(o) => {
        if (!o) {
          setEditingEvent(null);
          setEditEventMediaPreview(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] w-[95%]">
          <DialogHeader>
            <DialogTitle>{language === 'hi' ? 'ईवेंट संपादित करें' : 'Edit Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditEvent} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-event-title">{language === 'hi' ? 'ईवेंट का नाम' : 'Event Title'}</Label>
                  <Input id="edit-event-title" name="title" defaultValue={editingEvent?.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-event-date">{language === 'hi' ? 'तारीख और समय' : 'Date & Time'}</Label>
                  <Input id="edit-event-date" name="date" type="datetime-local" defaultValue={editingEvent?.date} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-event-description">{language === 'hi' ? 'विवरण' : 'Description'}</Label>
                  <Textarea id="edit-event-description" name="description" defaultValue={editingEvent?.description} required className="min-h-[120px]" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'hi' ? 'ईवेंट इमेज' : 'Event Image'}</Label>
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-primary/5",
                      (editEventMediaPreview || editingEvent?.image) ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                    )}
                    onClick={() => document.getElementById('edit-event-file-input')?.click()}
                  >
                    <input 
                      id="edit-event-file-input" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditEventMediaPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {(editEventMediaPreview || editingEvent?.image) ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm">
                        <img src={editEventMediaPreview || editingEvent?.image} className="w-full h-full object-cover" />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditEventMediaPreview(null);
                            const input = document.getElementById('edit-event-file-input') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                          <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">{language === 'hi' ? 'इमेज बदलें' : 'Change Image'}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-background px-2 text-muted-foreground">{language === 'hi' ? 'या' : 'OR'}</span></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-event-image">{language === 'hi' ? 'इमेज URL' : 'Image URL'}</Label>
                  <Input id="edit-event-image" name="image" defaultValue={editingEvent?.image} disabled={!!editEventMediaPreview} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => {
                setEditingEvent(null);
                setEditEventMediaPreview(null);
              }}>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '...' : (language === 'hi' ? 'सहेजें' : 'Save Changes')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Notice Dialog */}
      <Dialog open={!!editingNotice} onOpenChange={(o) => !o && setEditingNotice(null)}>
        <DialogContent className="sm:max-w-[600px] w-[95%]">
          <DialogHeader>
            <DialogTitle>{language === 'hi' ? 'सूचना संपादित करें' : 'Edit Notice'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditNotice} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-notice-title">{language === 'hi' ? 'शीर्षक' : 'Title'}</Label>
                <Input id="edit-notice-title" name="title" defaultValue={editingNotice?.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notice-importance">{language === 'hi' ? 'महत्व' : 'Importance'}</Label>
                <select name="importance" defaultValue={editingNotice?.importance} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background">
                  <option value="normal">{language === 'hi' ? 'सामान्य' : 'Normal'}</option>
                  <option value="urgent">{language === 'hi' ? 'महत्वपूर्ण' : 'Urgent'}</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notice-content">{language === 'hi' ? 'संदेश' : 'Message'}</Label>
              <Textarea id="edit-notice-content" name="content" defaultValue={editingNotice?.content} required className="min-h-[120px]" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditingNotice(null)}>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '...' : (language === 'hi' ? 'सहेजें' : 'Save Changes')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <AlertDialog open={!!pendingRoleUpdate} onOpenChange={(o) => !o && setPendingRoleUpdate(null)}>
        <AlertDialogContent className="w-[95%] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your password to change {pendingRoleUpdate?.userName}'s role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label>Admin Password</Label>
            <Input type="password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} className="bg-secondary/10" />
          </div>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setAdminConfirmPassword("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleUpdate} disabled={isActionProcessing || !adminConfirmPassword}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingAdminToggle} onOpenChange={(o) => !o && setPendingAdminToggle(null)}>
        <AlertDialogContent className="w-[95%] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Admin Toggle</AlertDialogTitle>
            <AlertDialogDescription>
              Enter password to toggle administrative access for {pendingAdminToggle?.userName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label>Admin Password</Label>
            <Input type="password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} className="bg-secondary/10" />
          </div>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setAdminConfirmPassword("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAdminToggle} disabled={isActionProcessing || !adminConfirmPassword}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
