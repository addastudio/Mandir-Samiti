
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
import { collection, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Trash2, Loader2, Calendar, Image as ImageIcon, ShieldAlert, Users, UserPlus, UserMinus, Bell, Globe, LayoutDashboard, MessageSquare, CheckCircle2, LogOut, ShieldCheck, Mail, Shield, ArrowLeft, Upload, X, FileVideo, Info, Zap, Settings, AlertCircle, Ghost, Eye, EyeOff, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
import { getEmailServiceStatus } from "@/app/actions";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

const ROLE_HIERARCHY: Record<string, number> = {
  'president': 100,
  'secretary': 90,
  'treasurer': 90,
  'official': 70,
  'committee_member': 50,
  'member': 30,
  'devotee': 10,
};

export default function AdminPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  const params = React.use(props.params);
  const searchParams = React.use(props.searchParams);

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
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const [isResigningInProgress, setIsResigningInProgress] = useState(false);
  const [resignPassword, setResignPassword] = useState("");
  const [galleryMediaPreview, setGalleryMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ isLive: boolean; provider: string } | null>(null);

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

  const { data: events } = useCollection(eventsRef);
  const { data: gallery } = useCollection(galleryRef);
  const { data: allUsers } = useCollection(usersRef);
  const { data: allAdmins } = useCollection(adminsRef);
  const { data: notices } = useCollection(noticesRef);
  const { data: requests } = useCollection(requestsRef);

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
    
    // Add all users from the profiles collection
    allUsers?.forEach(u => {
      userMap.set(u.id, { ...u, hasProfile: true, isGhost: false });
    });
    
    // Add all admins, identifying those without profiles (Ghost records)
    allAdmins?.forEach(a => {
      if (userMap.has(a.id)) {
        const existing = userMap.get(a.id);
        userMap.set(a.id, { ...existing, isAdminRecord: true });
      } else {
        // This is a GHOST admin record (No profile doc but has admin doc)
        userMap.set(a.id, {
          id: a.id,
          name: language === 'hi' ? 'हटाया गया खाता (अधूरी सफ़ाई)' : 'Deleted Account (Ghost Record)',
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

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventsRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const eventData = {
      title: formData.get("title") as string,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      image: formData.get("image") as string || "https://picsum.photos/seed/event/600/400",
    };
    addDocumentNonBlocking(eventsRef, eventData);
    toast({ title: language === 'hi' ? "ईवेंट सफलतापूर्वक जोड़ा गया" : "Event Added Successfully" });
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  const handleAddNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!noticesRef) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const noticeData = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      importance: formData.get("importance") as string || "normal",
      createdAt: new Date().toISOString(),
    };
    addDocumentNonBlocking(noticesRef, noticeData);
    toast({ title: language === 'hi' ? "सूचना सफलतापूर्वक जोड़ी गई" : "Notice Added Successfully" });
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  const updateRequestStatus = (id: string, newStatus: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, "prayer_requests", id);
    updateDocumentNonBlocking(docRef, { status: newStatus });
    toast({ title: language === 'hi' ? "स्थिति अपडेट की गई" : "Status updated" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_FILE_SIZE = 750 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast({ 
          variant: "destructive", 
          title: language === 'hi' ? "फ़ाइल बहुत बड़ी है" : "File too large", 
          description: language === 'hi' 
            ? "750KB से बड़ी फ़ाइलों के लिए कृपया बाहरी 'Media URL' का उपयोग करें।" 
            : "For files larger than 750KB, please use an external 'Media URL' (e.g., Google Drive, Imgur)." 
        });
        return;
      }
      
      const type = file.type.startsWith('video') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryMediaPreview(reader.result as string);
        setMediaType(type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!galleryRef || !user) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const imageURL = galleryMediaPreview || (formData.get("imageURL") as string);
    
    if (!imageURL) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "मीडिया आवश्यक है" : "Media Required", 
        description: language === 'hi' ? "कृपया URL दर्ज करें या फ़ाइल अपलोड करें।" : "Please enter a URL or upload a file." 
      });
      setIsSubmitting(false);
      return;
    }

    const galleryData = {
      imageURL,
      caption: formData.get("caption") as string,
      uploadedBy: user.uid,
    };

    addDocumentNonBlocking(galleryRef, galleryData);
    toast({ title: language === 'hi' ? "गैलरी आइटम सफलतापूर्वक जोड़ा गया" : "Gallery Item Added Successfully" });
    (e.target as HTMLFormElement).reset();
    setGalleryMediaPreview(null);
    setMediaType(null);
    setIsSubmitting(false);
  };

  const handleDelete = (col: string, id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, col, id);
    deleteDoc(docRef);
    toast({ title: language === 'hi' ? "आइटम हटा दिया गया" : "Item deleted" });
  };

  const confirmAdminToggle = async () => {
    if (!pendingAdminToggle || !firestore || !user) return;
    setIsActionProcessing(true);
    
    try {
      // Re-authenticate admin for sensitive action
      if (user.providerData.some(p => p.providerId === 'password')) {
        const credential = EmailAuthProvider.credential(user.email!, adminConfirmPassword);
        await reauthenticateWithCredential(user, credential);
      }

      const { userId, isCurrentAdmin } = pendingAdminToggle;
      const roleRef = doc(firestore, "roles_admin", userId);
      
      if (isCurrentAdmin) {
        await deleteDoc(roleRef);
        toast({ title: language === 'hi' ? "व्यवस्थापक हटा दिया गया" : "Admin removed" });
      } else {
        await setDoc(roleRef, { assignedAt: new Date().toISOString() }, { merge: true });
        toast({ title: language === 'hi' ? "व्यवस्थापक जोड़ा गया" : "Admin added" });
      }
      setPendingAdminToggle(null);
      setAdminConfirmPassword("");
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/wrong-password') msg = language === 'hi' ? "गलत पासवर्ड" : "Incorrect password";
      toast({ variant: "destructive", title: language === 'hi' ? "त्रुटि" : "Error", description: msg });
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleUpdateUserRole = (userId: string, targetCurrentRole: string, newRole: string, userName: string) => {
    if (!firestore) return;
    if (!canManageUser(userId, targetCurrentRole)) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "अनुमति अस्वीकृत" : "Permission Denied", 
        description: language === 'hi' ? "आप उच्च पद वाले सदस्यों का ग्रेड नहीं बदल सकते।" : "You cannot change the grade of senior members." 
      });
      return;
    }
    setPendingRoleUpdate({ userId, targetCurrentRole, newRole, userName });
  };

  const confirmRoleUpdate = async () => {
    if (!pendingRoleUpdate || !firestore || !user) return;
    setIsActionProcessing(true);
    
    try {
      if (user.providerData.some(p => p.providerId === 'password')) {
        const credential = EmailAuthProvider.credential(user.email!, adminConfirmPassword);
        await reauthenticateWithCredential(user, credential);
      }

      const { userId, newRole } = pendingRoleUpdate;
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, { role: newRole });
      toast({ title: language === 'hi' ? "भूमिका अपडेट की गई" : "Role Updated" });
      setPendingRoleUpdate(null);
      setAdminConfirmPassword("");
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/wrong-password') msg = language === 'hi' ? "गलत पासवर्ड" : "Incorrect password";
      toast({ variant: "destructive", title: language === 'hi' ? "त्रुटि" : "Error", description: msg });
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
      
      const userRef = doc(firestore, "users", user.uid);
      const adminRef = doc(firestore, "roles_admin", user.uid);
      await updateDoc(userRef, { role: "devotee" });
      await deleteDoc(adminRef);
      toast({ title: language === 'hi' ? "इस्तीफा स्वीकार किया गया" : "Resignation Accepted" });
      router.push("/");
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/wrong-password') msg = language === 'hi' ? "गलत पासवर्ड" : "Incorrect password";
      toast({ variant: "destructive", title: language === 'hi' ? "त्रुटि" : "Error", description: msg });
    } finally {
      setIsResigningInProgress(false);
      setResignPassword("");
    }
  };

  const handleHardDeleteUser = async (targetUserId: string) => {
    if (!firestore || !isPresident) return;
    const userRef = doc(firestore, "users", targetUserId);
    const adminRef = doc(firestore, "roles_admin", targetUserId);
    try {
      await deleteDoc(userRef);
      await deleteDoc(adminRef);
      toast({ title: language === 'hi' ? "रिकॉर्ड हटाया गया" : "Record Purged" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const isAdminUser = (userId: string) => {
    return allAdmins?.some(admin => admin.id === userId);
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16 sm:pt-20 scroll-smooth">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 md:px-8 space-y-6 sm:y-8 pt-4">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 sm:p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-full shrink-0">
              <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className={cn("text-xl sm:text-2xl font-bold truncate", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
              </h1>
              <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[9px] sm:text-[10px] py-0 h-4 bg-primary/5 shrink-0">{currentRole}</Badge>
                <div className="flex items-center gap-1 truncate">
                  <span className="opacity-60 hidden xs:inline">{language === 'hi' ? 'ग्रेड स्तर' : 'Grade Level'}:</span>
                  <span className="font-bold text-primary">{ROLE_HIERARCHY[currentRole] || 0}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link href="/" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full gap-2 text-xs sm:text-sm h-9">
                <Globe className="h-4 w-4" />
                <span className="hidden xs:inline">{language === 'hi' ? 'वेबसाइट देखें' : 'View Website'}</span>
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full gap-2 text-xs sm:text-sm h-9">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden xs:inline">{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
              </Button>
            </Link>
            {currentRole !== 'devotee' && (
              <AlertDialog>
                <AlertDialogTrigger asChild className="flex-1 sm:flex-none">
                  <Button variant="destructive" className="w-full gap-2 text-xs sm:text-sm h-9">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden xs:inline">{language === 'hi' ? 'पद त्यागें' : 'Resign Post'}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[95%] max-w-md mx-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{language === 'hi' ? 'क्या आप पद छोड़ना चाहते हैं?' : 'Are you sure you want to resign?'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === 'hi' ? 'यह आपके वर्तमान पद और प्रशासनिक पहुँच को हटा देगा। पुष्टि के लिए अपना पासवर्ड दर्ज करें।' : 'This will remove your current role and administrative access. Enter password to confirm.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4 space-y-2">
                    <Label>{language === 'hi' ? 'पासवर्ड दर्ज करें' : 'Enter Password'}</Label>
                    <Input type="password" value={resignPassword} onChange={(e) => setResignPassword(e.target.value)} />
                  </div>
                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
                    <AlertDialogCancel className="mt-0" onClick={() => setResignPassword("")}>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResign} className="bg-destructive text-destructive-foreground" disabled={isResigningInProgress || !resignPassword}>
                      {isResigningInProgress ? '...' : (language === 'hi' ? 'पुष्टि करें' : 'Confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="flex w-full overflow-x-auto no-scrollbar justify-start h-auto gap-1 sm:gap-2 bg-transparent p-0 mb-6 sm:mb-8 pb-1 touch-scroll scroll-smooth">
            <TabsTrigger value="events" className="flex-1 sm:flex-none min-w-[100px] gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 sm:py-3 text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0">
              <Calendar className="h-4 w-4" /> {language === 'hi' ? 'कार्यक्रम' : 'Events'}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex-1 sm:flex-none min-w-[100px] gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 sm:py-3 text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0">
              <ImageIcon className="h-4 w-4" /> {language === 'hi' ? 'गैलरी' : 'Gallery'}
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex-1 sm:flex-none min-w-[100px] gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 sm:py-3 text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0">
              <Bell className="h-4 w-4" /> {language === 'hi' ? 'सूचना' : 'Notice'}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 sm:flex-none min-w-[100px] gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 sm:py-3 text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0">
              <MessageSquare className="h-4 w-4" /> {language === 'hi' ? 'निवेदन' : 'Requests'}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 sm:flex-none min-w-[100px] gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 sm:py-3 text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0">
              <Users className="h-4 w-4" /> {language === 'hi' ? 'उपयोगकर्ता' : 'Users'}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 sm:flex-none min-w-[100px] gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 sm:py-3 text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0">
              <Settings className="h-4 w-4" /> {language === 'hi' ? 'सेटिंग्स' : 'Settings'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 p-4 sm:p-6">
                <CardTitle className={cn("text-lg sm:text-xl", language === 'hi' ? 'font-hindi' : '')}>{language === 'hi' ? 'नया कार्यक्रम जोड़ें' : 'Add New Event'}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">{language === 'hi' ? 'ईवेंट का नाम' : 'Event Title'}</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">{language === 'hi' ? 'तारीख और समय' : 'Date & Time'}</Label>
                      <Input id="date" name="date" type="datetime-local" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">{language === 'hi' ? 'इमेज URL (वैकल्पिक)' : 'Image URL'}</Label>
                    <Input id="image" name="image" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{language === 'hi' ? 'विवरण' : 'Description'}</Label>
                    <Textarea id="description" name="description" required />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                    {isSubmitting ? '...' : (language === 'hi' ? 'कार्यक्रम जोड़ें' : 'Add Event')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
              {events?.map((event) => (
                <Card key={event.id} className="group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-40 sm:h-48 bg-muted">
                    <img src={event.image} alt={event.title} className="object-cover w-full h-full" />
                    <div className="absolute top-3 right-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 shadow-lg">
                            <Trash2 className="h-4 w-4 sm:h-5 w-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{language === 'hi' ? 'कार्यक्रम हटाएं?' : 'Delete Event?'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'hi' ? 'क्या आप वाकई इस कार्यक्रम को हटाना चाहते हैं?' : 'Are you sure you want to delete this event?'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                            <AlertDialogCancel className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete("events", event.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {language === 'hi' ? 'हटाएं' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardHeader className="p-4 sm:p-5">
                    <CardTitle className="text-lg sm:text-xl truncate">{event.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1"><Calendar className="h-3 w-3" /> {new Date(event.date).toLocaleString()}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 p-4 sm:p-6">
                <CardTitle className={cn("text-lg sm:text-xl", language === 'hi' ? 'font-hindi' : '')}>{language === 'hi' ? 'उपयोगकर्ता एवं पद प्रबंधन' : 'User & Position Management'}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage administrative privileges based on hierarchical grades.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <Alert className="bg-amber-50 border-amber-200 shadow-sm p-3 sm:p-4">
                  <ShieldCheck className="h-4 w-4 text-amber-800" />
                  <AlertTitle className="text-amber-800 font-bold text-xs sm:text-sm">{language === 'hi' ? 'प्रशासनिक दिशानिर्देश' : 'Administrative Guidelines'}</AlertTitle>
                  <AlertDescription className="text-amber-700 space-y-2 mt-2 text-[10px] sm:text-xs">
                    <p>• {language === 'hi' ? 'समिति के भीतर आपके निर्धारित पद के आधार पर प्रबंधन अनुमतियां प्रदान की जाती हैं।' : 'Management permissions are assigned based on your designated position within the committee.'}</p>
                    <p>• {language === 'hi' ? 'आपके पास अपने से निम्न पद वाले सदस्यों की भूमिकाओं को प्रबंधित करने का अधिकार है।' : 'You have the authority to manage the roles of members at a lower grade level than your own.'}</p>
                    <p>• {language === 'hi' ? 'कोर समिति के प्रशासनिक पदों को सुरक्षित रखा गया है और केवल अधिकृत वरिष्ठ निरीक्षण द्वारा प्रबंधित किया जाता है।' : 'Core committee administrative positions are protected and managed only by authorized senior oversight.'}</p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {combinedUserList?.slice().sort((a, b) => {
                    if (a.isGhost !== b.isGhost) return a.isGhost ? -1 : 1;
                    const weightA = a.role ? (ROLE_HIERARCHY[a.role] || 0) : 0;
                    const weightB = b.role ? (ROLE_HIERARCHY[b.role] || 0) : 0;
                    if (weightB !== weightA) return weightB - weightA;
                    return (a.name || '').localeCompare(b.name || '');
                  }).map((u) => {
                    const isUserAdmin = u.isAdminRecord || isAdminUser(u.id);
                    const canIManage = !u.isGhost && canManageUser(u.id, u.role || 'devotee');
                    const isTargetMe = u.id === user?.uid;
                    const isGhost = u.isGhost;
                    
                    return (
                      <Card key={u.id} className={cn("overflow-hidden border shadow-sm hover:shadow-md", !canIManage && !isTargetMe && !isGhost && "bg-muted/30", isGhost && "border-destructive/30 bg-destructive/5")}>
                        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={cn("h-10 w-10 sm:h-14 sm:w-14 rounded-full flex items-center justify-center font-bold text-base sm:text-xl border shadow-inner shrink-0", isGhost ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary")}>
                              {isGhost ? <Ghost className="h-6 w-6" /> : (u.name?.charAt(0) || u.email?.charAt(0).toUpperCase())}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("font-bold text-sm sm:text-lg truncate", isGhost && "text-destructive")}>{u.name || 'User'}</span>
                                {isTargetMe && <Badge variant="outline" className="text-[9px] h-4 py-0 shrink-0">{language === 'hi' ? 'आप' : 'You'}</Badge>}
                                {isGhost && <Badge variant="destructive" className="text-[8px] h-4 py-0 uppercase">{language === 'hi' ? 'भूत रिकॉर्ड' : 'Ghost'}</Badge>}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground truncate">
                                <Mail className="h-3 w-3 shrink-0" /> {u.email}
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/60 mb-1 truncate">UID: {u.id}</span>
                              <div className="flex wrap gap-1 sm:gap-2 mt-1">
                                {isUserAdmin && <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] sm:text-[10px] h-5 py-0">{language === 'hi' ? 'व्यवस्थापक' : 'Admin'}</Badge>}
                                {!isGhost && <Badge variant="secondary" className="bg-secondary/50 font-medium text-[9px] sm:text-[10px] h-5 py-0">{u.role || (language === 'hi' ? 'भक्त' : 'Devotee')}</Badge>}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            {!isGhost && (
                              <div className="flex flex-col gap-1.5 sm:w-48">
                                <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground">{language === 'hi' ? 'पद / ग्रेड असाइन करें' : 'Assign Grade'}</Label>
                                <select 
                                  disabled={!canIManage} 
                                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                                  value={u.role || 'devotee'} 
                                  onChange={(e) => handleUpdateUserRole(u.id, u.role || 'devotee', e.target.value, u.name || 'User')}
                                >
                                  <option value="devotee">{language === 'hi' ? 'भक्त' : 'Devotee'}</option>
                                  <option value="member">{language === 'hi' ? 'सदस्य' : 'Member'}</option>
                                  <option value="committee_member">{language === 'hi' ? 'समिति सदस्य' : 'Committee Member'}</option>
                                  <option value="official">{language === 'hi' ? 'अधिकारी' : 'Official'}</option>
                                  <option value="president">{language === 'hi' ? 'अध्यक्ष' : 'President'}</option>
                                  <option value="secretary">{language === 'hi' ? 'सचिव' : 'Secretary'}</option>
                                  <option value="treasurer">{language === 'hi' ? 'कोषाध्यक्ष' : 'Treasurer'}</option>
                                </select>
                              </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                               <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground">
                                {isGhost ? (language === 'hi' ? 'सफ़ाई' : 'Cleanup') : (language === 'hi' ? 'प्रबंधन पहुँच' : 'Management')}
                               </Label>
                               <div className="flex gap-2">
                                  {!isGhost && (
                                    <Button 
                                      disabled={!canIManage} 
                                      variant={isUserAdmin ? "outline" : "default"} 
                                      size="sm" 
                                      onClick={() => setPendingAdminToggle({ 
                                        userId: u.id, 
                                        isCurrentAdmin: !!isUserAdmin, 
                                        userName: u.name || 'User', 
                                        role: u.role || 'devotee' 
                                      })} 
                                      className={cn("flex-1 sm:flex-none gap-2 h-9 text-xs", isUserAdmin && "text-destructive border-destructive hover:bg-destructive/10")}
                                    >
                                      {isUserAdmin ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                      {isUserAdmin ? (language === 'hi' ? 'एडमिन हटाएं' : 'Remove Admin') : (language === 'hi' ? 'एडमिन बनाएं' : 'Make Admin')}
                                    </Button>
                                  )}
                                  
                                  {isPresident && !isTargetMe && isGhost && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="w-[95%] max-w-md mx-auto">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                            <ShieldAlert className="h-5 w-5" />
                                            {language === 'hi' ? 'रिकॉर्ड साफ़ करें?' : 'Purge Record?'}
                                          </AlertDialogTitle>
                                          <AlertDialogDescription className="space-y-3 pt-2 text-left">
                                            <p className="font-bold text-foreground">
                                              {language === 'hi' 
                                                ? `यह एक 'भूत रिकॉर्ड' है जिसका मुख्य खाता हटाया जा चुका है। क्या आप इसे डेटाबेस से पूरी तरह हटाना चाहते हैं?` 
                                                : `This is a 'Ghost Record' whose primary account has been deleted. Do you want to completely remove it from the database?`}
                                            </p>
                                            <p className="text-xs">
                                              {language === 'hi' 
                                                ? "यह कार्रवाई डेटाबेस में बचे हुए प्रशासनिक अवशेषों को साफ़ कर देगी।" 
                                                : "This action will clean up the leftover administrative remains in the database."}
                                            </p>
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleHardDeleteUser(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            {language === 'hi' ? 'साफ़ करें' : 'Confirm Purge'}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                               </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="gallery" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 p-4 sm:p-6">
                <CardTitle className={cn("text-lg sm:text-xl", language === 'hi' ? 'font-hindi' : '')}>{language === 'hi' ? 'नया गैलरी आइटम जोड़ें' : 'Add New Gallery Item'}</CardTitle>
                <CardDescription className="text-xs">
                  {language === 'hi' 
                    ? "स्थानीय फ़ाइलें (अधिकतम 750KB) या बड़े वीडियो के लिए बाहरी URL का उपयोग करें।" 
                    : "Use local files (max 750KB) or external URLs for larger videos/images."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddGallery} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="imageURL" className="flex items-center gap-2">
                          {language === 'hi' ? 'मीडिया URL (बड़े फ़ाइलों के लिए)' : 'Media URL (for large files)'}
                          <Info className="h-3 w-3 text-muted-foreground" title={language === 'hi' ? '1MB से बड़े वीडियो के लिए बाहरी होस्ट का उपयोग करें।' : 'Use an external host for videos/photos larger than 1MB.'} />
                        </Label>
                        <Input id="imageURL" name="imageURL" placeholder="https://..." disabled={!!galleryMediaPreview} />
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">{language === 'hi' ? 'या' : 'OR'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{language === 'hi' ? 'फ़ाइल अपलोड करें (अधिकतम 750KB)' : 'Upload File (Max 750KB)'}</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="file" 
                            accept="image/*,video/mp4,video/webm" 
                            onChange={handleFileChange} 
                            className="hidden" 
                            id="gallery-file-upload" 
                          />
                          <Label 
                            htmlFor="gallery-file-upload" 
                            className="flex flex-1 items-center justify-center gap-2 h-10 px-4 border-2 border-dashed border-primary/30 rounded-md cursor-pointer hover:bg-primary/5 transition-colors"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="text-xs">{language === 'hi' ? 'फ़ाइल चुनें' : 'Choose File'}</span>
                          </Label>
                          {galleryMediaPreview && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setGalleryMediaPreview(null); setMediaType(null); }}
                              className="text-destructive h-10 w-10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {galleryMediaPreview && (
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                          {mediaType === 'image' ? (
                            <img src={galleryMediaPreview} alt="Preview" className="object-cover w-full h-full" />
                          ) : (
                            <video src={galleryMediaPreview} className="w-full h-full object-contain" autoPlay muted loop />
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-primary text-white text-[10px]">Preview</Badge>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="caption">{language === 'hi' ? 'कैप्शन' : 'Caption'}</Label>
                        <Input id="caption" name="caption" required />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    {language === 'hi' ? 'गैलरी में जोड़ें' : 'Add to Gallery'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
              {gallery?.map((item) => (
                <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border shadow-sm bg-muted flex items-center justify-center">
                  {item.imageURL.startsWith('data:video') || item.imageURL.match(/\.(mp4|webm|ogg)$/i) || item.imageURL.includes('drive.google.com') ? (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      <video src={item.imageURL} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <FileVideo className="h-8 w-8 text-white opacity-80" />
                      </div>
                    </div>
                  ) : (
                    <img src={item.imageURL} alt={item.caption} className="object-cover w-full h-full" />
                  )}
                  <div className="absolute inset-0 bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 sm:p-4">
                    <div className="text-center">
                      <p className="text-white text-[10px] sm:text-xs mb-2 line-clamp-2">{item.caption}</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{language === 'hi' ? 'मीडिया हटाएं?' : 'Delete Media?'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'hi' ? 'क्या आप वाकई इस मीडिया को गैलरी से हटाना चाहते हैं?' : 'Are you sure you want to delete this media from the gallery?'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                            <AlertDialogCancel className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete("gallery", item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {language === 'hi' ? 'हटाएं' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notices" className="space-y-6">
             <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 p-4 sm:p-6">
                <CardTitle className={cn("text-lg sm:text-xl", language === 'hi' ? 'font-hindi' : '')}>{t.noticesAdd}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddNotice} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="notice-title">{t.noticesHeadlinePlaceholder}</Label>
                      <Input id="notice-title" name="title" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="importance">{language === 'hi' ? 'महत्व' : 'Importance'}</Label>
                      <select 
                        name="importance" 
                        defaultValue="normal"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="normal">{t.noticesNormal}</option>
                        <option value="urgent">{t.noticesUrgent}</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">{t.noticesContentPlaceholder}</Label>
                    <Textarea id="content" name="content" required />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                    {isSubmitting ? '...' : (language === 'hi' ? 'सूचना जारी करें' : 'Post Notice')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={cn("text-lg font-bold flex items-center gap-2", language === 'hi' ? 'font-hindi' : '')}>
                  <History className="h-5 w-5 text-primary" />
                  {language === 'hi' ? 'सूचना इतिहास' : 'Notice History'}
                </h3>
                <Badge variant="secondary" className="font-mono">{notices?.length || 0}</Badge>
              </div>

              <div className="space-y-4">
                {notices?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notice) => (
                  <Card key={notice.id} className={cn("border-l-4 rounded-xl transition-all hover:shadow-md", notice.importance === 'urgent' ? 'border-l-destructive' : 'border-l-primary')}>
                    <CardContent className="p-3 sm:p-4 flex justify-between items-start gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base truncate">{notice.title}</h4>
                          <Badge variant={notice.importance === 'urgent' ? 'destructive' : 'outline'} className="text-[9px] h-4 py-0 shrink-0 uppercase tracking-tighter">
                            {notice.importance === 'urgent' ? t.noticesUrgent : t.noticesNormal}
                          </Badge>
                        </div>
                        <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">{notice.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-3 w-3 text-muted-foreground/60" />
                          <p className="text-[9px] text-muted-foreground/60">{new Date(notice.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive shrink-0 h-8 w-8 hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{language === 'hi' ? 'सूचना हटाएं?' : 'Delete Notice?'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'hi' ? 'क्या आप वाकई इस सूचना को हटाना चाहते हैं?' : 'Are you sure you want to delete this notice?'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                            <AlertDialogCancel className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete("notices", notice.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {language === 'hi' ? 'हटाएं' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
                
                {(!notices || notices.length === 0) && (
                  <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>{language === 'hi' ? 'कोई सूचना नहीं मिली।' : 'No notices found.'}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
             <div className="grid grid-cols-1 gap-4">
               {requests?.map((req) => (
                 <Card key={req.id} className="overflow-hidden rounded-xl">
                   <CardHeader className="bg-secondary/20 py-2 sm:py-3 flex flex-row items-center justify-between px-4">
                     <div className="flex items-center gap-2 min-w-0">
                       <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                       <CardTitle className="text-[10px] sm:text-sm font-bold uppercase tracking-wider truncate">{req.requestType}</CardTitle>
                     </div>
                     <Badge className={cn(
                       "text-[9px] sm:text-xs shrink-0",
                       req.status === 'completed' ? 'bg-green-100 text-green-700' : 
                       req.status === 'viewed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                     )}>
                       {req.status}
                     </Badge>
                   </CardHeader>
                   <CardContent className="pt-4 space-y-3 px-4">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                       <div className="min-w-0">
                         <p className="font-bold text-sm sm:text-base truncate">{req.name}</p>
                         <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{req.email} | {req.phone}</p>
                       </div>
                       <p className="text-[9px] sm:text-xs text-muted-foreground shrink-0">{new Date(req.createdAt).toLocaleString()}</p>
                     </div>
                     <p className="text-[11px] sm:text-sm italic p-2 sm:p-3 bg-muted/30 rounded-lg">"{req.message}"</p>
                     <div className="flex flex-wrap gap-2 pt-2">
                       <Button size="sm" variant="outline" className="h-8 text-[10px] sm:text-xs" onClick={() => updateRequestStatus(req.id, 'viewed')} disabled={req.status === 'viewed' || req.status === 'completed'}>
                         <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Viewed
                       </Button>
                       <Button size="sm" variant="outline" className="h-8 text-[10px] sm:text-xs" onClick={() => updateRequestStatus(req.id, 'completed')} disabled={req.status === 'completed'}>
                         <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Completed
                       </Button>
                       
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button size="sm" variant="ghost" className="text-destructive ml-auto h-8 w-8 p-0 shrink-0">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent className="w-[95%] max-w-md mx-auto">
                           <AlertDialogHeader>
                             <AlertDialogTitle>{language === 'hi' ? 'निवेदन हटाएं?' : 'Delete Request?'}</AlertDialogTitle>
                             <AlertDialogDescription>
                               {language === 'hi' ? 'क्या आप वाकई इस निवेदन को हटाना चाहते हैं? यह कार्रवाई वापस नहीं ली जा सकती।' : 'Are you sure you want to delete this request? This action cannot be undone.'}
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                             <AlertDialogCancel className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
                             <AlertDialogAction onClick={() => handleDelete("prayer_requests", req.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                               {language === 'hi' ? 'हटाएं' : 'Delete'}
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 p-4 sm:p-6">
                <CardTitle className={cn("text-lg sm:text-xl flex items-center gap-2", language === 'hi' ? 'font-hindi' : '')}>
                  <Zap className="h-5 w-5 text-primary" />
                  {language === 'hi' ? 'सिस्टम स्थिति' : 'System Status'}
                </CardTitle>
                <CardDescription>
                  {language === 'hi' ? 'महत्वपूर्ण सिस्टम सेवाओं की स्थिति की जाँच करें।' : 'Monitor the health and configuration of essential services.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <span className="font-bold text-sm">{language === 'hi' ? 'ईमेल सेवा' : 'Email Service'}</span>
                      </div>
                      {emailStatus?.isLive ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Prototype Mode</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-2">
                      <p>
                        {emailStatus?.isLive 
                          ? (language === 'hi' ? `आपकी ईमेल सेवा '${emailStatus.provider}' के माध्यम से लाइव है।` : `Your email service is active via '${emailStatus.provider}'.`)
                          : (language === 'hi' ? 'ईमेल सेवा वर्तमान में सिमुलेशन मोड में है। कोई वास्तविक ईमेल नहीं भेजा जाएगा।' : 'The email service is currently in simulation mode. Real emails will NOT be sent.')}
                      </p>
                      {!emailStatus?.isLive && (
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          <p className="text-[10px] text-amber-800">
                            {language === 'hi' 
                              ? "लाइव जाने के लिए, कृपया Firebase App Hosting में 'RESEND_API_KEY' एनवायरनमेंट वेरिएबल जोड़ें।" 
                              : "To go live, please add the 'RESEND_API_KEY' environment variable in your Firebase App Hosting console."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-bold text-sm">{language === 'hi' ? 'सुरक्षा स्थिति' : 'Security Status'}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-2">
                      <p>{language === 'hi' ? 'फायरबेस सुरक्षा नियम और पद-आधारित पहुँच नियंत्रण सक्रिय हैं।' : 'Firestore Security Rules and Role-Based Access Control are fully active.'}</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>{language === 'hi' ? 'ग्रेड-आधारित पदानुक्रम' : 'Grade-based hierarchy enforcement'}</li>
                        <li>{language === 'hi' ? 'सुरक्षित OTP प्रमाणीकरण' : 'Secure OTP Authentication'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={!!pendingRoleUpdate} onOpenChange={(open) => {
        if (!open) {
          setPendingRoleUpdate(null);
          setAdminConfirmPassword("");
        }
      }}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> {language === 'hi' ? 'पद परिवर्तन की पुष्टि' : 'Confirm Grade Change'}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2 text-left">
                <div className="font-semibold text-foreground text-sm sm:text-base">
                  {pendingRoleUpdate && (language === 'hi' 
                    ? `क्या आप ${pendingRoleUpdate.userName} के पद को '${pendingRoleUpdate.targetCurrentRole}' से बदलकर '${pendingRoleUpdate.newRole}' करना चाहते हैं?` 
                    : `Are you sure you want to change ${pendingRoleUpdate.userName}'s position from '${pendingRoleUpdate.targetCurrentRole}' to '${pendingRoleUpdate.newRole}'?`)}
                </div>
                <div className="space-y-2 py-2">
                  <Label>{language === 'hi' ? 'पुष्टि के लिए अपना पासवर्ड दर्ज करें' : 'Enter your password to confirm'}</Label>
                  <div className="relative">
                    <Input 
                      type={showAdminPassword ? "text" : "password"} 
                      value={adminConfirmPassword} 
                      onChange={(e) => setAdminConfirmPassword(e.target.value)} 
                      placeholder="••••••••"
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowAdminPassword(!showAdminPassword)}>
                      {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => {
              setPendingRoleUpdate(null);
              setAdminConfirmPassword("");
            }} className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleUpdate} disabled={isActionProcessing || !adminConfirmPassword}>
              {isActionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === 'hi' ? 'पुष्टि करें' : 'Confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Toggle Confirmation Dialog */}
      <AlertDialog open={!!pendingAdminToggle} onOpenChange={(open) => {
        if (!open) {
          setPendingAdminToggle(null);
          setAdminConfirmPassword("");
        }
      }}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> 
              {t.adminConfirmAdminToggleTitle}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2 text-left">
                <div className="font-semibold text-foreground text-sm sm:text-base">
                  {pendingAdminToggle ? (pendingAdminToggle.isCurrentAdmin 
                    ? t.adminConfirmAdminRemoveDesc.replace('{{name}}', pendingAdminToggle.userName)
                    : t.adminConfirmAdminAddDesc.replace('{{name}}', pendingAdminToggle.userName))
                    : ''
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'hi' 
                    ? 'यह कार्रवाई उपयोगकर्ता के प्रशासनिक अधिकार क्षेत्र को तुरंत बदल देगी।' 
                    : 'This action will immediately change the user\'s administrative authority.'}
                </p>
                <div className="space-y-2 py-2">
                  <Label>{language === 'hi' ? 'पुष्टि के लिए अपना पासवर्ड दर्ज करें' : 'Enter your password to confirm'}</Label>
                  <div className="relative">
                    <Input 
                      type={showAdminPassword ? "text" : "password"} 
                      value={adminConfirmPassword} 
                      onChange={(e) => setAdminConfirmPassword(e.target.value)} 
                      placeholder="••••••••"
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowAdminPassword(!showAdminPassword)}>
                      {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => {
              setPendingAdminToggle(null);
              setAdminConfirmPassword("");
            }} className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAdminToggle}
              disabled={isActionProcessing || !adminConfirmPassword}
              className={pendingAdminToggle?.isCurrentAdmin ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isActionProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === 'hi' ? 'पुष्टि करें' : 'Confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
