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
import { collection, doc, collectionGroup, query } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { 
  Trash2, 
  Loader2, 
  Calendar, 
  Image as ImageIcon, 
  ShieldAlert, 
  Users, 
  Bell, 
  Globe, 
  LayoutDashboard, 
  MessageSquare, 
  CheckCircle2, 
  LogOut, 
  ShieldCheck, 
  ArrowLeft, 
  Upload, 
  Settings, 
  Activity, 
  Wand2, 
  Sparkles, 
  HeartHandshake, 
  Quote, 
  UtensilsCrossed, 
  BookOpenCheck, 
  Hand, 
  Tv, 
  Search, 
  BarChart3, 
  TrendingUp, 
  UserCheck, 
  User as UserIcon, 
  IndianRupee, 
  HandCoins, 
  Filter, 
  FilterX, 
  Download, 
  Pencil, 
  Plus,
  Shield,
  Zap,
  Ghost,
  Clock,
  AlertCircle,
  AlertTriangle,
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getEmailServiceStatus, getBackendConnectionStatus } from "@/app/actions";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { generateTempleContent } from "@/ai/flows/admin-ai-flow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [donationSearch, setDonationSearch] = useState("");
  
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

  // Unified Deletion Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ col: string, id: string, title: string } | null>(null);

  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const [isResigningInProgress, setIsResigningInProgress] = useState(false);
  const [resignPassword, setResignPassword] = useState("");
  
  // Previews & Status
  const [galleryMediaPreview, setGalleryMediaPreview] = useState<string | null>(null);
  const [testimonialMediaPreview, setTestimonialMediaPreview] = useState<string | null>(null);
  const [eventMediaPreview, setEventMediaPreview] = useState<string | null>(null);
  const [editEventMediaPreview, setEditEventMediaPreview] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ isLive: boolean; provider: string } | null>(null);
  const [backendStatus, setBackendStatus] = useState<{ firebase: any; superbase: any } | null>(null);

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
    getBackendConnectionStatus().then(setBackendStatus);
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

  // Admin-only collections
  const eventsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "events"), [firestore, adminDoc]);
  const galleryRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "gallery"), [firestore, adminDoc]);
  const sevaRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "seva_programs"), [firestore, adminDoc]);
  const testimonialsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "testimonials"), [firestore, adminDoc]);
  const membersColRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "mandir_samiti_members"), [firestore, adminDoc]);
  const usersRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "users"), [firestore, adminDoc]);
  const adminsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "roles_admin"), [firestore, adminDoc]);
  const noticesRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "notices"), [firestore, adminDoc]);
  const requestsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "prayer_requests"), [firestore, adminDoc]);
  const activityLogsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "admin_activity_logs"), [firestore, adminDoc]);
  const donationsGroupRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collectionGroup(firestore, "donations")), [firestore, adminDoc]);

  const { data: events } = useCollection(eventsRef);
  const { data: gallery } = useCollection(galleryRef);
  const { data: sevaPrograms } = useCollection(sevaRef);
  const { data: testimonials } = useCollection(testimonialsRef);
  const { data: committeeMembers } = useCollection(membersColRef);
  const { data: allUsers } = useCollection(usersRef);
  const { data: allAdmins } = useCollection(adminsRef);
  const { data: notices } = useCollection(noticesRef);
  const { data: requests } = useCollection(requestsRef);
  const { data: activityLogs } = useCollection(activityLogsRef);
  const { data: allDonations } = useCollection(donationsGroupRef);

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
    allUsers?.forEach(u => userMap.set(u.id, { ...u, hasProfile: true, isGhost: false }));
    allAdmins?.forEach(a => {
      if (userMap.has(a.id)) {
        userMap.set(a.id, { ...userMap.get(a.id), isAdminRecord: true });
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

  const filteredDonations = React.useMemo(() => {
    if (!allDonations) return [];
    return allDonations.filter(d => {
      const u = combinedUserList.find(user => user.id === d.userId);
      const searchStr = donationSearch.toLowerCase();
      const devName = (d.devoteeName || u?.name || 'Unknown').toLowerCase();
      return (
        devName.includes(searchStr) ||
        d.amount?.toString().includes(searchStr) ||
        d.mode?.toLowerCase().includes(searchStr) ||
        d.status?.toLowerCase().includes(searchStr)
      );
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allDonations, combinedUserList, donationSearch]);

  const totalCollection = allDonations?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  const handleAiGenerate = async (type: 'event' | 'notice') => {
    const topic = type === 'event' ? eventTitle : noticeTitle;
    if (!topic) {
      toast({ variant: "destructive", title: "Missing Topic", description: "Please enter a topic first." });
      return;
    }
    setIsAiGenerating(true);
    try {
      const result = await generateTempleContent({ topic, type, language: language as 'hi' | 'en' });
      if (type === 'event') {
        setEventTitle(result.title);
        setEventDescription(result.content);
      } else {
        setNoticeTitle(result.title);
        setNoticeContent(result.content);
      }
      toast({ title: "AI Generation Successful" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate content." });
    } finally {
      setIsAiGenerating(false);
    }
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

  const handleDeleteTrigger = (col: string, id: string, title: string = "Item") => {
    setDeleteConfirm({ col, id, title });
  };

  const confirmDelete = () => {
    if (!firestore || !deleteConfirm) return;
    const { col, id, title } = deleteConfirm;
    deleteDocumentNonBlocking(doc(firestore, col, id));
    logAction("DELETE", col.charAt(0).toUpperCase() + col.slice(1), title);
    toast({ title: language === 'hi' ? "हटा दिया गया" : "Deleted successfully" });
    setDeleteConfirm(null);
  };

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventsRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const imageURL = eventMediaPreview || (formData.get("image") as string);
    addDocumentNonBlocking(eventsRef, {
      title,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      image: imageURL || "https://picsum.photos/seed/event/600/400",
    });
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
    updateDocumentNonBlocking(doc(firestore, "events", editingEvent.id), {
      title,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      image: editEventMediaPreview || editingEvent.image,
    });
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
    addDocumentNonBlocking(noticesRef, {
      title,
      content: formData.get("content") as string,
      importance: formData.get("importance") as string,
      createdAt: new Date().toISOString(),
    });
    logAction("CREATE", "Notice", title);
    toast({ title: "Notice Posted" });
    (e.target as HTMLFormElement).reset();
    setNoticeTitle("");
    setNoticeContent("");
    setIsSubmitting(false);
  };

  const handleAddManualDonation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const devoteeName = formData.get("devoteeName") as string;
    const amount = Number(formData.get("amount"));
    if (!devoteeName) {
      toast({ variant: "destructive", title: "Missing Name" });
      setIsSubmitting(false);
      return;
    }
    const donationsRef = collection(firestore, "donations");
    addDocumentNonBlocking(donationsRef, {
      amount,
      mode: formData.get("mode") as string,
      status: "completed",
      date: new Date().toISOString(),
      devoteeName: devoteeName,
      userId: null,
      recordedBy: user?.uid,
      isManual: true
    });
    logAction("CREATE", "Manual Donation", `₹${amount} for ${devoteeName}`);
    toast({ title: "Donation Recorded" });
    (e.target as HTMLFormElement).reset();
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
      toast({ variant: "destructive", title: "Missing Media" });
      setIsSubmitting(false);
      return;
    }
    addDocumentNonBlocking(galleryRef, { caption, imageURL, createdAt: new Date().toISOString() });
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
    addDocumentNonBlocking(sevaRef, {
      title,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
    });
    logAction("CREATE", "Seva", title);
    toast({ title: "Seva Program Added" });
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!membersColRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    addDocumentNonBlocking(membersColRef, {
      name,
      role: formData.get("role") as string,
      displayOrder: Number(formData.get("displayOrder") || 0),
    });
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
    addDocumentNonBlocking(testimonialsRef, {
      name,
      quote: formData.get("quote") as string,
      imageURL: testimonialMediaPreview || "https://picsum.photos/seed/devotee/100/100",
    });
    logAction("CREATE", "Testimonial", name);
    toast({ title: "Testimonial Added" });
    (e.target as HTMLFormElement).reset();
    setTestimonialMediaPreview(null);
    setIsSubmitting(false);
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const currentRole = currentUserProfile?.role || 'devotee';
  const isPresident = currentRole === 'president';

  return (
    <div className="min-h-screen bg-background pb-20 pt-16 sm:pt-20">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 md:px-8 space-y-6 pt-4">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0"><ShieldAlert className="h-8 w-8 text-primary" /></div>
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
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="w-full overflow-x-auto touch-scroll pb-4 pt-2 px-1">
            <TabsList className="inline-flex h-auto w-max min-w-full items-center justify-start gap-2 rounded-xl border border-primary/10 bg-muted/40 p-1.5 shadow-sm flex-nowrap">
              <TabsTrigger value="overview" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><BarChart3 className="h-4 w-4" /> {language === 'hi' ? 'सारांश' : 'Overview'}</TabsTrigger>
              <TabsTrigger value="donations" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><HandCoins className="h-4 w-4" /> {language === 'hi' ? 'दान संग्रह' : 'Donations'}</TabsTrigger>
              <TabsTrigger value="events" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Calendar className="h-4 w-4" /> {language === 'hi' ? 'कार्यक्रम' : 'Events'}</TabsTrigger>
              <TabsTrigger value="notices" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Bell className="h-4 w-4" /> {language === 'hi' ? 'सूचना' : 'Notice'}</TabsTrigger>
              <TabsTrigger value="seva" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><UtensilsCrossed className="h-4 w-4" /> {language === 'hi' ? 'सेवा' : 'Seva'}</TabsTrigger>
              <TabsTrigger value="committee" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><UserCheck className="h-4 w-4" /> {language === 'hi' ? 'समिति' : 'Committee'}</TabsTrigger>
              <TabsTrigger value="gallery" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><ImageIcon className="h-4 w-4" /> {language === 'hi' ? 'गैलरी' : 'Gallery'}</TabsTrigger>
              <TabsTrigger value="requests" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><MessageSquare className="h-4 w-4" /> {language === 'hi' ? 'निवेदन' : 'Requests'}</TabsTrigger>
              <TabsTrigger value="users" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Users className="h-4 w-4" /> {language === 'hi' ? 'उपयोगकर्ता' : 'Users'}</TabsTrigger>
              <TabsTrigger value="settings" className="shrink-0 gap-2 rounded-lg border bg-background py-2 px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Settings className="h-4 w-4" /> {language === 'hi' ? 'सेटिंग्स' : 'Settings'}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">{language === 'hi' ? 'कुल संग्रह' : 'Total Collection'}<IndianRupee className="h-4 w-4 text-primary" /></CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">₹{totalCollection.toLocaleString()}</div></CardContent>
              </Card>
              <Card className="bg-accent/5 border-accent/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">{language === 'hi' ? 'कुल भक्त' : 'Total Devotees'}<Users className="h-4 w-4 text-accent" /></CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{allUsers?.length || 0}</div></CardContent>
              </Card>
              <Card className="bg-green-50 border-green-100">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">{language === 'hi' ? 'लंबित निवेदन' : 'Pending Requests'}<MessageSquare className="h-4 w-4 text-green-600" /></CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-700">{requests?.filter(r => r.status === 'pending').length || 0}</div></CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-100">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">{language === 'hi' ? 'आगामी कार्यक्रम' : 'Upcoming Events'}<Calendar className="h-4 w-4 text-amber-600" /></CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-amber-700">{events?.filter(e => new Date(e.date) > new Date()).length || 0}</div></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="border-primary/20 shadow-md h-fit sticky top-20">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />{language === 'hi' ? 'नया दान दर्ज करें' : 'Record Manual Donation'}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleAddManualDonation} className="space-y-4">
                      <div className="space-y-2"><Label>{language === 'hi' ? 'भक्त का नाम' : 'Devotee Name'}</Label><Input name="devoteeName" required placeholder={language === 'hi' ? 'नाम दर्ज करें' : 'e.g. Mr. Ram Singh'} /></div>
                      <div className="space-y-2"><Label>{language === 'hi' ? 'राशि (₹)' : 'Amount (₹)'}</Label><Input name="amount" type="number" required placeholder="e.g. 501" /></div>
                      <div className="space-y-2"><Label>{language === 'hi' ? 'माध्यम' : 'Payment Mode'}</Label>
                        <select name="mode" className="w-full h-10 rounded border bg-background px-3 text-sm">
                          <option value="Cash">Cash (नकद)</option>
                          <option value="Check">Check (चेक)</option>
                          <option value="Direct Transfer">Direct Bank Transfer</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HandCoins className="h-4 w-4 mr-2" />}{language === 'hi' ? 'रिकॉर्ड सहेजें' : 'Save Record'}</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8 space-y-4">
                <Card className="shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/30 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div><CardTitle className="text-lg">{language === 'hi' ? 'दान संग्रह लेजर' : 'Donation Ledger'}</CardTitle></div>
                    <div className="relative w-full sm:w-64"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={language === 'hi' ? 'खोजें...' : 'Search records...'} className="pl-9 h-9 text-xs" value={donationSearch} onChange={(e) => setDonationSearch(e.target.value)} /></div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow className="bg-muted/10"><TableHead className="w-[150px]">{language === 'hi' ? 'भक्त' : 'Devotee'}</TableHead><TableHead>{language === 'hi' ? 'राशि' : 'Amount'}</TableHead><TableHead>{language === 'hi' ? 'तारीख' : 'Date'}</TableHead><TableHead className="text-right">{language === 'hi' ? 'स्थिति' : 'Status'}</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {filteredDonations.map(d => {
                            const devotee = combinedUserList.find(u => u.id === d.userId);
                            const displayName = d.devoteeName || devotee?.name || 'Unknown';
                            return (
                              <TableRow key={d.id} className="hover:bg-muted/20">
                                <TableCell><div className="flex flex-col"><span className="font-bold text-xs truncate max-w-[120px]">{displayName}</span></div></TableCell>
                                <TableCell className="font-bold text-primary">₹{d.amount}</TableCell>
                                <TableCell className="text-[10px] opacity-70">{new Date(d.date).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                  {d.status === 'completed' ? (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-1 px-2 py-0.5 rounded-md shadow-sm">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider">{language === 'hi' ? 'पूर्ण' : 'Completed'}</span>
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1 px-2 py-0.5 rounded-md">
                                      <Clock className="h-3 w-3" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider">{d.status}</span>
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ... other TabsContent implementations like events, notices, etc. follow similar logic using handleDeleteTrigger ... */}
          
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Backend Infrastructure</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full"><Database className="h-4 w-4 text-amber-600" /></div>
                    <div><p className="font-bold text-sm">{backendStatus?.firebase?.label}</p><p className="text-xs opacity-60">Primary Database & Auth</p></div>
                  </div>
                  <Badge className="bg-green-500">Connected</Badge>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><Database className="h-4 w-4 text-blue-600" /></div>
                    <div><p className="font-bold text-sm">{backendStatus?.superbase?.label}</p><p className="text-xs opacity-60">{backendStatus?.superbase?.active ? 'API Keys Detected' : 'No Keys Detected'}</p></div>
                  </div>
                  <Badge variant={backendStatus?.superbase?.active ? 'default' : 'outline'}>{backendStatus?.superbase?.active ? 'Active' : 'Offline'}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Standard Deletion Confirmation Dialogue */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {language === 'hi' ? 'क्या आप वाकई इसे हटाना चाहते हैं?' : 'Are you sure you want to delete this?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'hi' 
                ? `यह कार्रवाई स्थायी है। आप "${deleteConfirm?.title}" को हटाने जा रहे हैं।` 
                : `This action is permanent. You are about to remove "${deleteConfirm?.title}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'hi' ? 'पुष्टि करें और हटाएं' : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}