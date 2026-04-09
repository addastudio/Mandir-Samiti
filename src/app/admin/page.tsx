
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
import { Trash2, Loader2, Calendar, Image as ImageIcon, ShieldAlert, Users, UserPlus, UserMinus, Bell, Globe, LayoutDashboard, MessageSquare, CheckCircle2, LogOut, ShieldCheck, Mail, Shield, ArrowLeft, Upload, X, FileVideo, Info, Zap, Settings, AlertCircle, Ghost, Eye, EyeOff, History, Activity, UserCog, ChevronDown, ChevronUp, Pencil, Plus, Wand2, Sparkles, HeartHandshake, Quote, UtensilsCrossed, BookOpenCheck, Hand, Tv, Search, BarChart3, TrendingUp, UserCheck } from "lucide-react";
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

const SEVA_ICONS = {
  UtensilsCrossed: UtensilsCrossed,
  HeartHandshake: HeartHandshake,
  BookOpenCheck: BookOpenCheck,
  Users: Users,
  Hand: Hand,
  Shield: Shield
};

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  // Search and Filter States
  const [userSearch, setUserSearch] = useState("");
  
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
  
  // Previews
  const [galleryMediaPreview, setGalleryMediaPreview] = useState<string | null>(null);
  const [testimonialMediaPreview, setTestimonialMediaPreview] = useState<string | null>(null);
  const [eventMediaPreview, setEventMediaPreview] = useState<string | null>(null);
  const [editEventMediaPreview, setEditEventMediaPreview] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ isLive: boolean; provider: string } | null>(null);

  // Edit States
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

  const websiteSettingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "website");
  }, [firestore]);
  const { data: websiteSettings } = useDoc(websiteSettingsRef);

  const eventsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "events");
  }, [firestore]);

  const galleryRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "gallery");
  }, [firestore]);

  const sevaRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "seva_programs");
  }, [firestore]);

  const testimonialsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "testimonials");
  }, [firestore]);

  const membersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "mandir_samiti_members");
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
  const { data: sevaPrograms } = useCollection(sevaRef);
  const { data: testimonials } = useCollection(testimonialsRef);
  const { data: committeeMembers } = useCollection(membersRef);
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

  const filteredUsers = combinedUserList.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

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

    const eventData = {
      title,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      image: imageURL || "https://picsum.photos/seed/event/600/400",
    };
    addDocumentNonBlocking(eventsRef, eventData);
    logAction("CREATE", "Event", title);
    toast({ title: "Event Added" });
    (e.target as HTMLFormElement).reset();
    setEventMediaPreview(null);
    setEventTitle("");
    setEventDescription("");
    setIsSubmitting(false);
  };

  const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !editingEvent) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const imageURL = editEventMediaPreview || editingEvent.image;

    const eventData = {
      title,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      image: imageURL,
    };
    updateDocumentNonBlocking(doc(firestore, "events", editingEvent.id), eventData);
    logAction("UPDATE", "Event", title);
    toast({ title: "Event Updated" });
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
      importance: formData.get("importance") as string,
      createdAt: new Date().toISOString(),
    };
    addDocumentNonBlocking(noticesRef, noticeData);
    logAction("CREATE", "Notice", title);
    toast({ title: "Notice Posted" });
    (e.target as HTMLFormElement).reset();
    setNoticeTitle("");
    setNoticeContent("");
    setIsSubmitting(false);
  };

  const handleUpdateNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !editingNotice) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const noticeData = {
      title,
      content: formData.get("content") as string,
      importance: formData.get("importance") as string,
    };
    updateDocumentNonBlocking(doc(firestore, "notices", editingNotice.id), noticeData);
    logAction("UPDATE", "Notice", title);
    toast({ title: "Notice Updated" });
    setEditingNotice(null);
    setIsSubmitting(false);
  };

  const handleAddGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!galleryRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const caption = formData.get("caption") as string;
    const imageURL = galleryMediaPreview || (formData.get("imageURL") as string);

    if (!imageURL) {
      toast({ variant: "destructive", title: "Missing Media", description: "Please upload an image or provide a URL." });
      setIsSubmitting(false);
      return;
    }

    const galleryData = {
      caption,
      imageURL,
      createdAt: new Date().toISOString(),
    };
    addDocumentNonBlocking(galleryRef, galleryData);
    logAction("CREATE", "Gallery", caption);
    toast({ title: "Media Added to Gallery" });
    (e.target as HTMLFormElement).reset();
    setGalleryMediaPreview(null);
    setIsSubmitting(false);
  };

  const handleAddSeva = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sevaRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const sevaData = {
      title,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
    };
    addDocumentNonBlocking(sevaRef, sevaData);
    logAction("CREATE", "Seva", title);
    toast({ title: "Seva Program Added" });
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!membersRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const memberData = {
      name,
      role: formData.get("role") as string,
      displayOrder: Number(formData.get("displayOrder") || 0),
    };
    addDocumentNonBlocking(membersRef, memberData);
    logAction("CREATE", "Committee Member", name);
    toast({ title: "Member Added" });
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  const handleAddTestimonial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!testimonialsRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const testimonialData = {
      name,
      quote: formData.get("quote") as string,
      imageURL: testimonialMediaPreview || "https://picsum.photos/seed/devotee/100/100",
    };
    addDocumentNonBlocking(testimonialsRef, testimonialData);
    logAction("CREATE", "Testimonial", name);
    toast({ title: "Testimonial Added" });
    (e.target as HTMLFormElement).reset();
    setTestimonialMediaPreview(null);
    setIsSubmitting(false);
  };

  const handleUpdateWebsiteSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!websiteSettingsRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const liveAartiUrl = formData.get("liveAartiUrl") as string;
    setDocumentNonBlocking(websiteSettingsRef, { liveAartiUrl }, { merge: true });
    logAction("UPDATE", "Settings", "Website Configuration");
    toast({ title: "Settings Updated" });
    setIsSubmitting(false);
  };

  const handleDelete = (col: string, id: string, title: string = "Item") => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, col, id));
    logAction("DELETE", col.charAt(0).toUpperCase() + col.slice(1), title);
    toast({ title: "Deleted" });
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
              <Badge variant="outline" className="mt-1 bg-primary/5 capitalize">{currentRole}</Badge>
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
                    <input type="password" value={resignPassword} onChange={(e) => setResignPassword(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
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

        <Tabs defaultValue="overview" className="w-full">
          <div className="pb-6 pt-2 overflow-x-auto no-scrollbar touch-scroll">
            <TabsList className="inline-flex w-max min-w-full items-center justify-start gap-2 bg-muted/40 p-1.5 rounded-xl border border-primary/10 shadow-sm flex-nowrap h-auto">
              <TabsTrigger value="overview" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><BarChart3 className="h-4 w-4" /> {language === 'hi' ? 'सारांश' : 'Overview'}</TabsTrigger>
              <TabsTrigger value="events" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><Calendar className="h-4 w-4" /> {language === 'hi' ? 'कार्यक्रम' : 'Events'}</TabsTrigger>
              <TabsTrigger value="notices" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><Bell className="h-4 w-4" /> {language === 'hi' ? 'सूचना' : 'Notice'}</TabsTrigger>
              <TabsTrigger value="seva" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><UtensilsCrossed className="h-4 w-4" /> {language === 'hi' ? 'सेवा' : 'Seva'}</TabsTrigger>
              <TabsTrigger value="committee" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><UserCheck className="h-4 w-4" /> {language === 'hi' ? 'समिति' : 'Committee'}</TabsTrigger>
              <TabsTrigger value="testimonials" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><Quote className="h-4 w-4" /> {language === 'hi' ? 'अनुभव' : 'Reviews'}</TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><ImageIcon className="h-4 w-4" /> {language === 'hi' ? 'गैलरी' : 'Gallery'}</TabsTrigger>
              <TabsTrigger value="requests" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><MessageSquare className="h-4 w-4" /> {language === 'hi' ? 'निवेदन' : 'Requests'}</TabsTrigger>
              <TabsTrigger value="users" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><Users className="h-4 w-4" /> {language === 'hi' ? 'उपयोगकर्ता' : 'Users'}</TabsTrigger>
              <TabsTrigger value="activity" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><Activity className="h-4 w-4" /> {language === 'hi' ? 'गतिविधि' : 'Activity'}</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 bg-background border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs sm:text-sm shrink-0 rounded-lg"><Settings className="h-4 w-4" /> {language === 'hi' ? 'सेटिंग्स' : 'Settings'}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    {language === 'hi' ? 'कुल भक्त' : 'Total Devotees'}
                    <Users className="h-4 w-4 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {language === 'hi' ? 'निरंतर वृद्धि' : 'Growing community'}</p>
                </CardContent>
              </Card>
              <Card className="bg-accent/5 border-accent/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    {language === 'hi' ? 'आगामी कार्यक्रम' : 'Upcoming Events'}
                    <Calendar className="h-4 w-4 text-accent" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{events?.filter(e => new Date(e.date) > new Date()).length || 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">{language === 'hi' ? 'अगले ३० दिनों में' : 'In next 30 days'}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    {language === 'hi' ? 'लंबित निवेदन' : 'Pending Requests'}
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{requests?.filter(r => r.status === 'pending').length || 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">{language === 'hi' ? 'त्वरित कार्रवाई आवश्यक' : 'Immediate action needed'}</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    {language === 'hi' ? 'नई सूचनाएं' : 'Recent Notices'}
                    <Bell className="h-4 w-4 text-amber-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">{notices?.filter(n => (Date.now() - new Date(n.createdAt).getTime()) < 86400000 * 7).length || 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">{language === 'hi' ? 'पिछले ७ दिनों में' : 'Posted this week'}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm border-primary/10">
                <CardHeader><CardTitle className="text-lg">{language === 'hi' ? 'हाल की गतिविधि' : 'Recent Activity'}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {activityLogs?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10).map(log => (
                      <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-muted/30">
                        <div className="bg-primary/5 p-2 rounded-full"><Activity className="h-4 w-4 text-primary" /></div>
                        <div>
                          <p className="text-xs"><span className="font-bold">{log.adminName}</span> {log.actionType.toLowerCase()}ed <span className="font-bold">{log.entityType}</span>: {log.entityTitle}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-primary/10">
                <CardHeader><CardTitle className="text-lg">{language === 'hi' ? 'शीर्ष सेवा कार्यक्रम' : 'Seva Highlights'}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {sevaPrograms?.slice(0, 4).map(s => {
                    const Icon = SEVA_ICONS[s.icon as keyof typeof SEVA_ICONS] || Hand;
                    return (
                      <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                        <div className="bg-primary/10 p-2 rounded-full"><Icon className="h-5 w-5 text-primary" /></div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{s.title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{s.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center justify-between">
                  {language === 'hi' ? 'नया कार्यक्रम जोड़ें' : 'Add New Event'}
                  <Button variant="outline" size="sm" onClick={() => handleAiGenerate('event')} disabled={isAiGenerating || !eventTitle}>
                    {isAiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                    {language === 'hi' ? 'AI से लिखें' : 'AI Assistant'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input id="title" name="title" required value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date & Time</Label>
                        <Input id="date" name="date" type="datetime-local" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" required value={eventDesc} onChange={(e) => setEventDescription(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Event Image</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer" onClick={() => document.getElementById('event-img-input')?.click()}>
                        <input id="event-img-input" type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setEventMediaPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                        {eventMediaPreview ? <img src={eventMediaPreview} className="aspect-video w-full object-cover rounded" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting}>Add Event</Button>
                </form>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {events?.map(e => (
                <Card key={e.id} className="overflow-hidden group">
                  <div className="aspect-video relative">
                    <img src={e.image} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setEditingEvent(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete('events', e.id, e.title)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <CardHeader className="p-4"><CardTitle className="text-sm truncate">{e.title}</CardTitle></CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notices" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center justify-between">
                  {language === 'hi' ? 'नई सूचना जोड़ें' : 'Add Notice'}
                  <Button variant="outline" size="sm" onClick={() => handleAiGenerate('notice')} disabled={isAiGenerating || !noticeTitle}>
                    {isAiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {language === 'hi' ? 'AI संदेश' : 'AI Draft'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddNotice} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Title</Label><Input name="title" required value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Importance</Label><select name="importance" className="h-10 w-full rounded border bg-background px-3"><option value="normal">Normal</option><option value="urgent">Urgent</option></select></div>
                  </div>
                  <div className="space-y-2"><Label>Content</Label><Textarea name="content" required value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} /></div>
                  <Button type="submit" disabled={isSubmitting}>Post Notice</Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-4">
              {notices?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(n => (
                <Card key={n.id} className={cn("border-l-4 group", n.importance === 'urgent' ? 'border-l-destructive' : 'border-l-primary')}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="min-w-0 flex-1"><h4 className="font-bold truncate">{n.title}</h4><p className="text-xs text-muted-foreground line-clamp-1">{n.content}</p></div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => setEditingNotice(n)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete('notices', n.id, n.title)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={language === 'hi' ? 'नाम या ईमेल खोजें...' : 'Search users by name or email...'} className="pl-10" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="grid gap-4">
              {filteredUsers?.sort((a,b) => (ROLE_HIERARCHY[b.role] || 0) - (ROLE_HIERARCHY[a.role] || 0)).map(u => {
                const isUserAdmin = allAdmins?.some(a => a.id === u.id);
                const canIManage = !u.isGhost && canManageUser(u.id, u.role);
                return (
                  <Card key={u.id} className={cn("p-4 flex flex-col md:flex-row justify-between items-center gap-4", u.isGhost && "opacity-50")}>
                    <div className="flex items-center gap-4"><div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">{u.name?.charAt(0)}</div><div><p className="font-bold flex items-center gap-2">{u.name}{isUserAdmin && <Badge className="text-[8px]">ADMIN</Badge>}</p><p className="text-xs text-muted-foreground">{u.email}</p><p className="text-[10px] uppercase opacity-50">{u.role || 'devotee'}</p></div></div>
                    <div className="flex items-center gap-2">
                      {!u.isGhost && (
                        <><select disabled={!canIManage} className="h-8 rounded border bg-background px-2 text-xs" value={u.role || 'devotee'} onChange={(e) => setPendingRoleUpdate({ userId: u.id, targetCurrentRole: u.role || 'devotee', newRole: e.target.value, userName: u.name || 'User' })}><option value="devotee">Devotee</option><option value="member">Member</option><option value="official">Official</option><option value="president">President</option></select><Button disabled={!canIManage} variant={isUserAdmin ? "outline" : "default"} size="sm" className="h-8 text-xs" onClick={() => setPendingAdminToggle({ userId: u.id, isCurrentAdmin: !!isUserAdmin, userName: u.name || 'User', role: u.role || 'devotee' })}>{isUserAdmin ? 'Revoke' : 'Grant'} Admin</Button></>
                      )}
                    </div>
                  </Card>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">
                  <Ghost className="h-12 w-12 mx-auto opacity-20" />
                  <p className="mt-4">{language === 'hi' ? 'कोई उपयोगकर्ता नहीं मिला।' : 'No users found matching your search.'}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="seva" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Add Seva Program</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddSeva} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input name="title" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <select name="icon" className="w-full h-10 rounded border bg-background px-3">
                        <option value="UtensilsCrossed">Bhandara (Food)</option>
                        <option value="HeartHandshake">Health / Social</option>
                        <option value="BookOpenCheck">Education</option>
                        <option value="Users">Community</option>
                        <option value="Hand">Seva / Hand</option>
                        <option value="Shield">Protection</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" required />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>Add Program</Button>
                </form>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sevaPrograms?.map(s => {
                const Icon = SEVA_ICONS[s.icon as keyof typeof SEVA_ICONS] || Hand;
                return (
                  <Card key={s.id} className="relative">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-destructive" onClick={() => handleDelete('seva_programs', s.id, s.title)}><Trash2 className="h-4 w-4" /></Button>
                    <CardHeader className="text-center pt-8">
                      <Icon className="h-8 w-8 mx-auto text-primary" />
                      <CardTitle className="text-base">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">{s.description}</CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="committee" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>{language === 'hi' ? 'समिति सदस्य जोड़ें' : 'Add Samiti Member'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Member Name</Label><Input name="name" required placeholder="e.g. Mr. Ram Singh" /></div>
                    <div className="space-y-2"><Label>Official Role</Label><Input name="role" required placeholder="e.g. President" /></div>
                    <div className="space-y-2"><Label>Display Order (Num)</Label><Input name="displayOrder" type="number" defaultValue="0" /></div>
                  </div>
                  <Button type="submit" disabled={isSubmitting}>Add Member</Button>
                </form>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {committeeMembers?.sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map(m => (
                <Card key={m.id} className="relative group">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete('mandir_samiti_members', m.id, m.name)}><Trash2 className="h-4 w-4" /></Button>
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg font-bold">{m.name}</CardTitle>
                    <CardDescription className="uppercase tracking-widest text-xs font-medium text-primary">{m.role}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
              {committeeMembers?.length === 0 && (
                <div className="col-span-full py-10 text-center text-muted-foreground italic border-2 border-dashed rounded-xl">
                  {language === 'hi' ? 'कोई आधिकारिक सदस्य नहीं जोड़ा गया है। वेबसाइट डिफ़ॉल्ट सदस्यों को दिखाएगी।' : 'No official members added. The website will show default members.'}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Add Testimonial</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddTestimonial} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2"><Label>Name</Label><Input name="name" required /></div>
                      <div className="space-y-2"><Label>Quote</Label><Textarea name="quote" required /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer h-32" onClick={() => document.getElementById('test-img-input')?.click()}>
                        <input id="test-img-input" type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setTestimonialMediaPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                        {testimonialMediaPreview ? <img src={testimonialMediaPreview} className="h-full aspect-square object-cover rounded-full" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting}>Add Testimonial</Button>
                </form>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonials?.map(t => (
                <Card key={t.id} className="relative">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-destructive" onClick={() => handleDelete('testimonials', t.id, t.name)}><Trash2 className="h-4 w-4" /></Button>
                  <CardHeader className="flex flex-row items-center gap-3">
                    <img src={t.imageURL} className="h-10 w-10 rounded-full object-cover" />
                    <CardTitle className="text-sm">{t.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs italic">"{t.quote}"</CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card><CardHeader><CardTitle>Add Gallery Media</CardTitle></CardHeader>
              <CardContent><form onSubmit={handleAddGallery} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Media Upload</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer h-40" onClick={() => document.getElementById('gal-img-input')?.click()}>
                      <input id="gal-img-input" type="file" className="hidden" accept="image/*,video/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setGalleryMediaPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                      {galleryMediaPreview ? <img src={galleryMediaPreview} className="h-full object-cover rounded" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Caption</Label><Input name="caption" required /></div>
                    <div className="space-y-2"><Label>Or Media URL</Label><Input name="imageURL" placeholder="https://..." disabled={!!galleryMediaPreview} /></div>
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting}>Add Media</Button>
              </form></CardContent></Card>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {gallery?.map(g => (
                <div key={g.id} className="relative aspect-square rounded-lg overflow-hidden group border"><img src={g.imageURL} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Button variant="destructive" size="icon" onClick={() => handleDelete('gallery', g.id, g.caption)}><Trash2 className="h-4 w-4" /></Button></div></div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {requests?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()).map(r => (
                <Card key={r.id} className="border-l-4 border-l-primary">
                  <CardHeader className="py-3 px-4 flex flex-row justify-between items-center bg-muted/30">
                    <CardTitle className="text-xs uppercase font-black">{r.requestType}</CardTitle>
                    <Badge className={r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{r.status}</Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <p className="font-bold text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground break-all">{r.email} | {r.phone}</p>
                    <p className="text-xs italic bg-secondary/20 p-2 rounded">"{r.message}"</p>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px]" onClick={() => updateDocumentNonBlocking(doc(firestore, "prayer_requests", r.id), { status: 'completed' })} disabled={r.status === 'completed'}>Mark Done</Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete('prayer_requests', r.id, `${r.name}'s Request`)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {requests?.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto opacity-20" />
                  <p className="mt-4">{language === 'hi' ? 'कोई निवेदन नहीं है।' : 'No devotee requests yet.'}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="overflow-hidden"><CardHeader className="bg-muted/30"><CardTitle className="text-lg">Recent Admin Logs</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {activityLogs?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50).map(log => (
                    <div key={log.id} className="p-4 flex items-start gap-4 text-xs hover:bg-muted/30">
                      <div className="bg-primary/5 p-2 rounded-full shrink-0"><Activity className="h-4 w-4 text-primary" /></div>
                      <div className="flex-1">
                        <p><span className="font-bold text-primary">{log.adminName}</span> {log.actionType.toLowerCase()}ed <span className="font-bold">{log.entityType}</span>: {log.entityTitle}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Website Configuration</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateWebsiteSettings} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Live Darshan YouTube URL</Label>
                    <Input name="liveAartiUrl" defaultValue={websiteSettings?.liveAartiUrl} placeholder="https://www.youtube.com/watch?v=..." />
                    <p className="text-[10px] text-muted-foreground">This updates the live stream link on the homepage and gallery.</p>
                  </div>
                  <Button type="submit" disabled={isSubmitting}>Save Settings</Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> System Status</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/20 flex justify-between items-center"><div><p className="font-bold text-sm">Email Service</p><p className="text-xs opacity-60">{emailStatus?.isLive ? 'Live (Resend)' : 'Prototype Mode'}</p></div><Badge variant={emailStatus?.isLive ? 'default' : 'outline'}>{emailStatus?.isLive ? 'Online' : 'Simulated'}</Badge></div>
                <div className="p-4 rounded-lg bg-secondary/20 flex justify-between items-center"><div><p className="font-bold text-sm">Security</p><p className="text-xs opacity-60">Firestore Protected</p></div><Badge>Active</Badge></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(o) => !o && setEditingEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{language === 'hi' ? 'कार्यक्रम संपादित करें' : 'Edit Event'}</DialogTitle></DialogHeader>
          {editingEvent && (
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Title</Label><Input name="title" defaultValue={editingEvent.title} required /></div>
                  <div className="space-y-2"><Label>Date</Label><Input name="date" type="datetime-local" defaultValue={editingEvent.date} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={editingEvent.description} required /></div>
                </div>
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer h-40" onClick={() => document.getElementById('edit-event-img')?.click()}>
                    <input id="edit-event-img" type="file" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setEditEventMediaPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                    {editEventMediaPreview || editingEvent.image ? <img src={editEventMediaPreview || editingEvent.image} className="h-full object-cover rounded" /> : <Upload className="h-8 w-8" />}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditingEvent(null)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>Update Event</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Notice Dialog */}
      <Dialog open={!!editingNotice} onOpenChange={(o) => !o && setEditingNotice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === 'hi' ? 'सूचना संपादित करें' : 'Edit Notice'}</DialogTitle></DialogHeader>
          {editingNotice && (
            <form onSubmit={handleUpdateNotice} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input name="title" defaultValue={editingNotice.title} required /></div>
              <div className="space-y-2"><Label>Importance</Label><select name="importance" defaultValue={editingNotice.importance} className="h-10 w-full rounded border bg-background px-3"><option value="normal">Normal</option><option value="urgent">Urgent</option></select></div>
              <div className="space-y-2"><Label>Content</Label><Textarea name="content" defaultValue={editingNotice.content} required /></div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditingNotice(null)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>Update Notice</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <AlertDialog open={!!pendingRoleUpdate} onOpenChange={(o) => !o && setPendingRoleUpdate(null)}>
        <AlertDialogContent className="w-[95%] max-w-md">
          <AlertDialogHeader><AlertDialogTitle>Confirm Role Change</AlertDialogTitle><AlertDialogDescription>Enter password to change {pendingRoleUpdate?.userName}'s role to {pendingRoleUpdate?.newRole}.</AlertDialogDescription></AlertDialogHeader>
          <div className="py-4"><Input type="password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} placeholder="Admin Password" /></div>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setAdminConfirmPassword("")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmRoleUpdate} disabled={isActionProcessing || !adminConfirmPassword}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingAdminToggle} onOpenChange={(o) => !o && setPendingAdminToggle(null)}>
        <AlertDialogContent className="w-[95%] max-w-md">
          <AlertDialogHeader><AlertDialogTitle>Confirm Admin Toggle</AlertDialogTitle><AlertDialogDescription>Enter password to toggle administrative access for {pendingAdminToggle?.userName}.</AlertDialogDescription></AlertDialogHeader>
          <div className="py-4"><Input type="password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} placeholder="Admin Password" /></div>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setAdminConfirmPassword("")}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmAdminToggle} disabled={isActionProcessing || !adminConfirmPassword}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
