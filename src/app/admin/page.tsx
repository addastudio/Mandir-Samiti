
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
import { collection, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Trash2, Loader2, Calendar, Image as ImageIcon, ShieldAlert, Users, UserPlus, UserMinus, Bell, Globe, LayoutDashboard, MessageSquare, CheckCircle2, LogOut, ShieldCheck, Mail, Shield, ArrowLeft, Upload, X, FileVideo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { getAuth, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

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

  const [resignPassword, setResignPassword] = useState("");
  const [isResigningInProgress, setIsResigningInProgress] = useState(false);
  const [galleryMediaPreview, setGalleryMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  useEffect(() => {
    setMounted(true);
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
  const isPasswordUser = user?.providerData.some(p => p.providerId === 'password');

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
      // 750KB limit to stay safe under 1MB Firestore limit after base64 conversion
      const MAX_FILE_SIZE = 750 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast({ 
          variant: "destructive", 
          title: language === 'hi' ? "फ़ाइल बहुत बड़ी है" : "File too large", 
          description: language === 'hi' ? "कृपया 750KB से छोटी फ़ाइल चुनें।" : "Please select a file smaller than 750KB for direct database upload." 
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

  const toggleAdmin = (userId: string, isCurrentAdmin: boolean, targetRole: string) => {
    if (!firestore) return;
    if (!canManageUser(userId, targetRole)) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "अनुमति अस्वीकृत" : "Permission Denied", 
        description: language === 'hi' ? "आपके पास इस उपयोगकर्ता को प्रबंधित करने के लिए पर्याप्त अधिकार नहीं हैं।" : "You do not have sufficient authority." 
      });
      return;
    }
    const roleRef = doc(firestore, "roles_admin", userId);
    if (isCurrentAdmin) {
      deleteDoc(roleRef);
      toast({ title: language === 'hi' ? "व्यवस्थापक हटा दिया गया" : "Admin removed" });
    } else {
      setDocumentNonBlocking(roleRef, { assignedAt: new Date().toISOString() }, { merge: true });
      toast({ title: language === 'hi' ? "व्यवस्थापक जोड़ा गया" : "Admin added" });
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

  const confirmRoleUpdate = () => {
    if (!pendingRoleUpdate || !firestore) return;
    const { userId, newRole } = pendingRoleUpdate;
    const userRef = doc(firestore, "users", userId);
    updateDocumentNonBlocking(userRef, { role: newRole });
    toast({ title: language === 'hi' ? "भूमिका अपडेट की गई" : "Role Updated" });
    setPendingRoleUpdate(null);
  };

  const handleResign = async () => {
    if (!firestore || !user) return;
    setIsResigningInProgress(true);
    try {
      if (isPasswordUser) {
        if (!resignPassword) {
          toast({ variant: "destructive", title: language === 'hi' ? "पासवर्ड आवश्यक है" : "Password Required" });
          setIsResigningInProgress(false);
          return;
        }
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
      toast({ variant: "destructive", title: language === 'hi' ? "त्रुटि" : "Error", description: error.message });
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
      toast({ variant: "destructive", title: language === 'hi' ? "त्रुटि" : "Error", description: error.message });
    }
  };

  const isAdminUser = (userId: string) => {
    return allAdmins?.some(admin => admin.id === userId);
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16 sm:pt-20 scroll-smooth">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 space-y-6 sm:space-y-8">
        <div className="flex items-center pt-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/")}
            className="h-10 w-10 rounded-full hover:bg-primary/10 text-primary shrink-0"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>

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
                    <AlertDialogDescription asChild>
                      <div className="space-y-4 pt-2">
                        <p>{language === 'hi' ? 'यह आपके वर्तमान पद और प्रशासनिक पहुँच को हटा देगा। आप एक भक्त के रूप में लॉग इन रहेंगे।' : 'This will remove your current role and administrative access. You will remain logged in as a devotee.'}</p>
                        {isPasswordUser && (
                          <div className="space-y-2 pt-2 text-left">
                            <Label htmlFor="resign-password">{language === 'hi' ? 'पुष्टि के लिए अपना पासवर्ड दर्ज करें' : 'Enter your password to confirm'}</Label>
                            <Input id="resign-password" type="password" value={resignPassword} onChange={(e) => setResignPassword(e.target.value)} placeholder="Password" />
                          </div>
                        )}
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
                    <AlertDialogCancel onClick={() => setResignPassword("")} className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResign} className="bg-destructive text-destructive-foreground" disabled={isResigningInProgress || (isPasswordUser && !resignPassword)}>
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
                      <Button variant="destructive" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 shadow-lg" onClick={() => handleDelete("events", event.id)}>
                        <Trash2 className="h-4 w-4 sm:h-5 w-5" />
                      </Button>
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
                  {allUsers?.slice().sort((a, b) => {
                    const weightA = a.role ? (ROLE_HIERARCHY[a.role] || 0) : 0;
                    const weightB = b.role ? (ROLE_HIERARCHY[b.role] || 0) : 0;
                    if (weightB !== weightA) return weightB - weightA;
                    return (a.name || '').localeCompare(b.name || '');
                  }).map((u) => {
                    const isUserAdmin = isAdminUser(u.id);
                    const canIManage = canManageUser(u.id, u.role || 'devotee');
                    const isTargetMe = u.id === user?.uid;
                    
                    return (
                      <Card key={u.id} className={cn("overflow-hidden border shadow-sm hover:shadow-md", !canIManage && !isTargetMe && "bg-muted/30")}>
                        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-secondary flex items-center justify-center font-bold text-base sm:text-xl text-primary border shadow-inner shrink-0">
                              {u.name?.charAt(0) || u.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm sm:text-lg truncate">{u.name || 'User'}</span>
                                {isTargetMe && <Badge variant="outline" className="text-[9px] h-4 py-0 shrink-0">{language === 'hi' ? 'आप' : 'You'}</Badge>}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground truncate">
                                <Mail className="h-3 w-3 shrink-0" /> {u.email}
                              </div>
                              <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/60 mb-1 truncate">UID: {u.id}</span>
                              <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                                {isUserAdmin && <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] sm:text-[10px] h-5 py-0">{language === 'hi' ? 'व्यवस्थापक' : 'Admin'}</Badge>}
                                <Badge variant="secondary" className="bg-secondary/50 font-medium text-[9px] sm:text-[10px] h-5 py-0">{u.role || (language === 'hi' ? 'भक्त' : 'Devotee')}</Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <div className="flex flex-col gap-1.5 sm:w-48">
                              <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground">{language === 'hi' ? 'पद / ग्रेड असाइन करें' : 'Assign Grade'}</Label>
                              <Select disabled={!canIManage} defaultValue={u.role || 'devotee'} onValueChange={(val) => handleUpdateUserRole(u.id, u.role || 'devotee', val, u.name || 'User')}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Grade" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="devotee">{language === 'hi' ? 'भक्त' : 'Devotee'}</SelectItem>
                                  <SelectItem value="member">{language === 'hi' ? 'सदस्य' : 'Member'}</SelectItem>
                                  <SelectItem value="committee_member">{language === 'hi' ? 'समिति सदस्य' : 'Committee Member'}</SelectItem>
                                  <SelectItem value="official">{language === 'hi' ? 'अधिकारी' : 'Official'}</SelectItem>
                                  <SelectItem value="president">{language === 'hi' ? 'अध्यक्ष' : 'President'}</SelectItem>
                                  <SelectItem value="secretary">{language === 'hi' ? 'सचिव' : 'Secretary'}</SelectItem>
                                  <SelectItem value="treasurer">{language === 'hi' ? 'कोषाध्यक्ष' : 'Treasurer'}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                               <Label className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground">{language === 'hi' ? 'प्रबंधन पहुँच' : 'Management'}</Label>
                               <div className="flex gap-2">
                                  <Button disabled={!canIManage} variant={isUserAdmin ? "outline" : "default"} size="sm" onClick={() => toggleAdmin(u.id, !!isUserAdmin, u.role || 'devotee')} className={cn("flex-1 sm:flex-none gap-2 h-9 text-xs", isUserAdmin && "text-destructive border-destructive hover:bg-destructive/10")}>
                                    {isUserAdmin ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                    {isUserAdmin ? (language === 'hi' ? 'एडमिन हटाएं' : 'Remove Admin') : (language === 'hi' ? 'एडमिन बनाएं' : 'Make Admin')}
                                  </Button>
                                  
                                  {isPresident && !isTargetMe && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="w-[95%] max-w-md mx-auto">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>{language === 'hi' ? 'रिकॉर्ड साफ़ करें?' : 'Purge User Record?'}</AlertDialogTitle>
                                          <AlertDialogDescription>{language === 'hi' ? `यह डेटाबेस से ${u.name || 'उपयोगकर्ता'} के रिकॉर्ड को स्थायी रूप से हटा देगा।` : `Permanently delete the database record for ${u.name || 'this user'}.`}</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleHardDeleteUser(u.id)} className="bg-destructive text-destructive-foreground">Purge</AlertDialogAction>
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
                <CardDescription className="text-xs">Supports images and small video files (Max 750KB).</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddGallery} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="imageURL">{language === 'hi' ? 'मीडिया URL (इमेज/वीडियो)' : 'Media URL'}</Label>
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
                        <Label>{language === 'hi' ? 'फ़ाइल अपलोड करें (इमेज/वीडियो)' : 'Upload File'}</Label>
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
                  {item.imageURL.startsWith('data:video') ? (
                    <div className="relative w-full h-full flex items-center justify-center">
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
                      <Button variant="destructive" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleDelete("gallery", item.id)}>
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
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
                      <Select name="importance" defaultValue="normal">
                        <SelectTrigger id="importance">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">{t.noticesNormal}</SelectItem>
                          <SelectItem value="urgent">{t.noticesUrgent}</SelectItem>
                        </SelectContent>
                      </Select>
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
            <div className="space-y-4 mt-6">
              {notices?.map((notice) => (
                <Card key={notice.id} className={cn("border-l-4 rounded-xl", notice.importance === 'urgent' ? 'border-l-destructive' : 'border-l-primary')}>
                  <CardContent className="p-3 sm:p-4 flex justify-between items-start gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base truncate">{notice.title}</h4>
                        <Badge variant={notice.importance === 'urgent' ? 'destructive' : 'outline'} className="text-[9px] h-4 py-0 shrink-0">{notice.importance}</Badge>
                      </div>
                      <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">{notice.content}</p>
                      <p className="text-[9px] text-muted-foreground/60">{new Date(notice.createdAt).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete("notices", notice.id)} className="text-destructive shrink-0 h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
                       <Button size="sm" variant="ghost" onClick={() => handleDelete("prayer_requests", req.id)} className="text-destructive ml-auto h-8 w-8 p-0 shrink-0">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!pendingRoleUpdate} onOpenChange={() => setPendingRoleUpdate(null)}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> {language === 'hi' ? 'GRADE CHANGE CONFIRMATION' : 'Confirm Grade Change'}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <div className="font-semibold text-foreground text-sm sm:text-base">
                  {language === 'hi' 
                    ? `क्या आप ${pendingRoleUpdate?.userName} के पद को '${pendingRoleUpdate?.targetCurrentRole}' से बदलकर '${pendingRoleUpdate?.newRole}' करना चाहते हैं?` 
                    : `Are you sure you want to change ${pendingRoleUpdate?.userName}'s position from '${pendingRoleUpdate?.targetCurrentRole}' to '${pendingRoleUpdate?.newRole}'?`}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setPendingRoleUpdate(null)} className="mt-0">{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleUpdate}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
