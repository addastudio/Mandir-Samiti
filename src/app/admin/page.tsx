"use client";

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
import { Trash2, Loader2, Calendar, Image as ImageIcon, ShieldAlert, Users, UserPlus, UserMinus, Bell, Globe, LayoutDashboard, MessageSquare, CheckCircle2, Clock, Info, Lock, LogOut, UserMinus as RemoveUserIcon, AlertTriangle, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { sendEmailVerification, signOut, getAuth } from "firebase/auth";

// Define the hierarchy weight for roles
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
  const [isResending, setIsResending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current user's profile to check their grade
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

  const handleResendEmail = async () => {
    if (!user) return;
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: language === 'hi' ? "सफलता" : "Success",
        description: t.dashboardVerificationSent,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === 'hi' ? "त्रुटि" : "Error",
        description: error.message,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      await user.reload();
      toast({
        title: language === 'hi' ? "रिफ्रेश किया गया" : "Refreshed",
        description: language === 'hi' ? "सत्यापन स्थिति अपडेट की गई।" : "Verification status updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === 'hi' ? "त्रुटि" : "Error",
        description: error.message,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/");
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminDoc) return null;

  // Block admin access if unverified (for email/password users)
  const isPasswordUser = user?.providerData.some(p => p.providerId === 'password');
  if (user && !user.emailVerified && isPasswordUser) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-destructive/5 text-center pb-8 pt-10">
            <div className="mx-auto h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className={cn("text-2xl font-bold text-destructive", language === 'hi' ? 'font-hindi' : '')}>
              {t.dashboardVerifyRequiredTitle}
            </CardTitle>
            <CardDescription className={cn("mt-2 px-4", language === 'hi' ? 'font-hindi' : '')}>
              {t.dashboardVerifyRequiredDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <Button onClick={handleRefresh} disabled={isRefreshing} className="w-full gap-2">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {t.dashboardVerifyRefresh}
            </Button>
            <Button variant="outline" onClick={handleResendEmail} disabled={isResending} className="w-full">
              {isResending ? '...' : t.dashboardResendVerification}
            </Button>
            <Button variant="ghost" onClick={() => router.back()} className="w-full gap-2 text-muted-foreground border">
              <ArrowLeft className="h-4 w-4" />
              {language === 'hi' ? 'पीछे जाएं' : 'Go Back'}
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="w-full text-muted-foreground">
              {t.dashboardLogout}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRole = currentUserProfile?.role || 'devotee';
  const isPresident = currentRole === 'president';

  const canManageUser = (targetUserId: string, targetRole: string) => {
    if (user?.uid === targetUserId) return false;
    const myPower = ROLE_HIERARCHY[currentRole] || 0;
    const targetPower = ROLE_HIERARCHY[targetRole || 'devotee'] || 0;
    
    if (isPresident && targetRole !== 'president') return true;
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

  const handleAddGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!galleryRef || !user) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const galleryData = {
      imageURL: formData.get("imageURL") as string,
      caption: formData.get("caption") as string,
      uploadedBy: user.uid,
    };

    addDocumentNonBlocking(galleryRef, galleryData);
    toast({ title: language === 'hi' ? "गैलरी आइटम सफलतापूर्वक जोड़ा गया" : "Gallery Item Added Successfully" });
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  const handleDelete = (col: string, id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, col, id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: language === 'hi' ? "आइटम हटा दिया गया" : "Item deleted" });
  };

  const toggleAdmin = (userId: string, isCurrentAdmin: boolean, targetRole: string) => {
    if (!firestore) return;
    
    if (!canManageUser(userId, targetRole)) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "अनुमति अस्वीकृत" : "Permission Denied", 
        description: language === 'hi' ? "आपके पास इस उपयोगकर्ता को प्रबंधित करने के लिए पर्याप्त अधिकार नहीं हैं।" : "You do not have sufficient grade to manage this user." 
      });
      return;
    }

    const roleRef = doc(firestore, "roles_admin", userId);
    if (isCurrentAdmin) {
      deleteDocumentNonBlocking(roleRef);
      toast({ title: language === 'hi' ? "व्यवस्थापक हटा दिया गया" : "Admin removed" });
    } else {
      const data = { assignedAt: new Date().toISOString() };
      setDocumentNonBlocking(roleRef, data, { merge: true });
      toast({ title: language === 'hi' ? "व्यवस्थापक जोड़ा गया" : "Admin added" });
    }
  };

  const handleUpdateUserRole = (userId: string, targetCurrentRole: string, newRole: string) => {
    if (!firestore) return;
    
    if (!canManageUser(userId, targetCurrentRole)) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "अनुमति अस्वीकृत" : "Permission Denied", 
        description: language === 'hi' ? "आप उच्च पद वाले सदस्यों का ग्रेड नहीं बदल सकते।" : "You cannot change the grade of members with higher or equal positions." 
      });
      return;
    }

    const userRef = doc(firestore, "users", userId);
    updateDocumentNonBlocking(userRef, { role: newRole });
    toast({ 
      title: language === 'hi' ? "भूमिका अपडेट की गई" : "Role Updated",
      description: language === 'hi' ? `उपयोगकर्ता को '${newRole}' के रूप में सेट किया गया है।` : `User set as '${newRole}'.`
    });
  };

  const handleResign = async () => {
    if (!firestore || !user) return;
    const userRef = doc(firestore, "users", user.uid);
    const adminRef = doc(firestore, "roles_admin", user.uid);
    
    updateDocumentNonBlocking(userRef, { role: "devotee" });
    deleteDocumentNonBlocking(adminRef);
    
    toast({ 
      title: language === 'hi' ? "इस्तीफा स्वीकार किया गया" : "Resignation Accepted",
      description: language === 'hi' ? "अब आप एक भक्त के रूप में लॉग इन हैं।" : "You have successfully resigned from your committee post."
    });
    router.push("/dashboard");
  };

  const handleRemoveMember = (targetUserId: string, targetRole: string) => {
    if (!firestore) return;
    
    if (!isPresident) {
      toast({ 
        variant: "destructive", 
        title: language === 'hi' ? "त्रुटि" : "Error", 
        description: language === 'hi' ? "केवल अध्यक्ष सदस्यों को हटा सकते हैं।" : "Only the President can remove committee members." 
      });
      return;
    }

    const userRef = doc(firestore, "users", targetUserId);
    const adminRef = doc(firestore, "roles_admin", targetUserId);
    
    updateDocumentNonBlocking(userRef, { role: "devotee" });
    deleteDocumentNonBlocking(adminRef);
    
    toast({ 
      title: language === 'hi' ? "सदस्य हटाया गया" : "Member Removed",
      description: language === 'hi' ? "उपयोगकर्ता को समिति से हटा दिया गया है।" : "The user has been removed from the committee."
    });
  };

  const isAdminUser = (userId: string) => {
    return allAdmins?.some(admin => admin.id === userId);
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-28">
      <div className="container mx-auto px-4 md:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className={cn("text-2xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
              </h1>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-primary/5">{currentRole}</Badge>
                <div className="flex items-center gap-1">
                  <span className="opacity-60">{language === 'hi' ? 'ग्रेड स्तर' : 'Grade Level'}:</span>
                  <span className="font-bold text-primary">{ROLE_HIERARCHY[currentRole] || 0}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <Globe className="h-4 w-4" />
                {language === 'hi' ? 'वेबसाइट देखें' : 'View Website'}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
              </Button>
            </Link>
            {currentRole !== 'devotee' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <LogOut className="h-4 w-4" />
                    {language === 'hi' ? 'पद त्यागें' : 'Resign Post'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{language === 'hi' ? 'क्या आप पद छोड़ना चाहते हैं?' : 'Are you sure you want to resign?'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === 'hi' 
                        ? 'यह आपके वर्तमान पद और प्रशासनिक पहुँच को हटा देगा। आप अभी भी एक भक्त के रूप में लॉग इन रहेंगे।' 
                        : 'This will remove your current role and administrative access. You will remain logged in as a devotee.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResign} className="bg-destructive text-destructive-foreground">
                      {language === 'hi' ? 'पुष्टि करें' : 'Confirm Resignation'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 mb-8 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger value="events" className="gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <Calendar className="h-4 w-4" /> {language === 'hi' ? 'कार्यक्रम' : 'Events'}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <ImageIcon className="h-4 w-4" /> {language === 'hi' ? 'गैलरी' : 'Gallery'}
            </TabsTrigger>
            <TabsTrigger value="notices" className="gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <Bell className="h-4 w-4" /> {language === 'hi' ? 'सूचना' : 'Notice'}
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <MessageSquare className="h-4 w-4" /> {language === 'hi' ? 'निवेदन' : 'Requests'}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <Users className="h-4 w-4" /> {language === 'hi' ? 'उपयोगकर्ता' : 'Users'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className={cn(language === 'hi' ? 'font-hindi' : '')}>
                  {language === 'hi' ? 'नया कार्यक्रम जोड़ें' : 'Add New Event'}
                </CardTitle>
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
                    <Label htmlFor="image">{language === 'hi' ? 'इमेज URL (वैकल्पिक)' : 'Image URL (Optional)'}</Label>
                    <Input id="image" name="image" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{language === 'hi' ? 'विवरण' : 'Description'}</Label>
                    <Textarea id="description" name="description" required />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                    {isSubmitting ? (language === 'hi' ? 'जोड़ा जा रहा है...' : 'Adding...') : (language === 'hi' ? 'कार्यक्रम जोड़ें' : 'Add Event')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {events?.map((event) => (
                <Card key={event.id} className="group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-48 bg-muted">
                    <img src={event.image} alt={event.title} className="object-cover w-full h-full" />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="destructive" size="icon" className="h-10 w-10 shadow-lg" onClick={() => handleDelete("events", event.id)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <CardHeader className="p-5">
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.date).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
             <div className="grid grid-cols-1 gap-6">
                <h3 className={cn("text-xl font-bold", language === 'hi' ? 'font-hindi' : '')}>{t.prayerAdminRequests}</h3>
                {requests?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((req) => (
                  <Card key={req.id} className="shadow-sm border-l-4 border-l-primary">
                    <CardHeader className="p-5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{req.name}</CardTitle>
                            <Badge variant={req.status === 'completed' ? 'default' : req.status === 'viewed' ? 'secondary' : 'outline'}>
                              {req.status === 'completed' ? t.prayerStatusCompleted : req.status === 'viewed' ? t.prayerStatusViewed : t.prayerStatusPending}
                            </Badge>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                              {req.requestType === 'puja' ? t.prayerTypePuja : req.requestType === 'prayer' ? t.prayerTypePrayer : t.prayerTypeOther}
                            </Badge>
                          </div>
                          <CardDescription className="flex gap-4">
                             <span>{req.email}</span>
                             <span>{req.phone}</span>
                             <span>{new Date(req.createdAt).toLocaleString()}</span>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete("prayer_requests", req.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <p className="text-sm bg-muted/30 p-4 rounded-lg border italic">{req.message}</p>
                      <div className="mt-4 flex gap-3">
                         <Button variant="outline" size="sm" onClick={() => updateRequestStatus(req.id, "viewed")} className="gap-2">
                            <Clock className="h-3 w-3" /> {t.prayerStatusViewed}
                         </Button>
                         <Button variant="outline" size="sm" onClick={() => updateRequestStatus(req.id, "completed")} className="gap-2 text-green-600 hover:text-green-700">
                            <CheckCircle2 className="h-3 w-3" /> {t.prayerStatusCompleted}
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="notices" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className={cn(language === 'hi' ? 'font-hindi' : '')}>{t.noticesAdd}</CardTitle>
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
                        <SelectTrigger>
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
                    <Label htmlFor="notice-content">{language === 'hi' ? 'सामग्री' : 'Content'}</Label>
                    <Textarea id="notice-content" name="content" placeholder={t.noticesContentPlaceholder} required />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? '...' : t.noticesAdd}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
              {notices?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notice) => (
                <Card key={notice.id} className={cn("relative border-l-4 shadow-sm", notice.importance === 'urgent' ? "border-l-destructive bg-destructive/5" : "border-l-primary")}>
                  <CardHeader className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{notice.title}</CardTitle>
                          {notice.importance === 'urgent' && <Badge variant="destructive">{t.noticesUrgent}</Badge>}
                        </div>
                        <CardDescription>{new Date(notice.createdAt).toLocaleString()}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete("notices", notice.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{notice.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className={cn(language === 'hi' ? 'font-hindi' : '')}>
                  {language === 'hi' ? 'गैलरी में जोड़ें' : 'Add to Gallery'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddGallery} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageURL">{language === 'hi' ? 'इमेज URL' : 'Image URL'}</Label>
                    <Input id="imageURL" name="imageURL" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caption">{language === 'hi' ? 'कैप्शन' : 'Caption'}</Label>
                    <Input id="caption" name="caption" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                    {isSubmitting ? (language === 'hi' ? 'जोड़ा जा रहा है...' : 'Adding...') : (language === 'hi' ? 'गैलरी में जोड़ें' : 'Add to Gallery')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-10">
              {gallery?.map((item) => (
                <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border shadow-sm">
                  <img src={item.imageURL} alt={item.caption} className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                    <p className="text-white text-xs text-center mb-3 line-clamp-2">{item.caption}</p>
                    <Button variant="destructive" size="icon" className="h-10 w-10 shadow-xl" onClick={() => handleDelete("gallery", item.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className={cn(language === 'hi' ? 'font-hindi' : '')}>
                  {language === 'hi' ? 'उपयोगकर्ता एवं पद प्रबंधन' : 'User & Position Management'}
                </CardTitle>
                <CardDescription>Manage administrative privileges based on hierarchical grades.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-800" />
                  <AlertTitle className="text-amber-800 font-bold">Hierarchical Rules</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    - Each grade has a numeric weight. You can only manage users with a <strong>strictly lower</strong> grade than yours.<br/>
                    - {isPresident ? <strong>You are the President. You have full oversight of all committee members.</strong> : "Only the President can remove members from the committee."}<br/>
                    - No one can demote the <strong>President</strong> or remove their admin access.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {allUsers?.map((u) => {
                    const isUserAdmin = isAdminUser(u.id);
                    const canIManage = canManageUser(u.id, u.role);
                    const isTargetMe = u.id === user?.uid;
                    const isTargetPresident = u.role === 'president';
                    
                    return (
                      <Card key={u.id} className={cn("overflow-hidden border shadow-sm hover:shadow-md transition-shadow", !canIManage && !isTargetMe && "bg-muted/30")}>
                        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center font-bold text-xl text-primary border shadow-inner relative">
                              {u.name?.charAt(0) || u.email?.charAt(0).toUpperCase()}
                              {!canIManage && !isTargetMe && (
                                <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border">
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">{u.name || 'Anonymous User'}</span>
                                {isTargetMe && <Badge variant="outline" className="text-[10px]">{language === 'hi' ? 'आप' : 'You'}</Badge>}
                              </div>
                              <span className="text-xs font-mono text-muted-foreground mb-1">UID: {u.id}</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {isUserAdmin && (
                                  <Badge className="bg-primary/10 text-primary border-primary/20">
                                    {language === 'hi' ? 'व्यवस्थापक' : 'Administrator'}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground font-medium">
                                  {u.role || (language === 'hi' ? 'भक्त' : 'Devotee')}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex flex-col gap-2 w-full sm:w-48">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">{language === 'hi' ? 'पद / ग्रेड असाइन करें' : 'Assign Grade/Role'}</Label>
                              <Select 
                                disabled={!canIManage}
                                defaultValue={u.role || 'devotee'} 
                                onValueChange={(val) => handleUpdateUserRole(u.id, u.role, val)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select Grade" />
                                </SelectTrigger>
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

                            <div className="flex flex-col gap-2 w-full sm:w-auto">
                               <Label className="text-[10px] uppercase font-bold text-muted-foreground">{language === 'hi' ? 'प्रबंधन पहुँच' : 'Management'}</Label>
                               <div className="flex gap-2">
                                  <Button 
                                    disabled={!canIManage}
                                    variant={isUserAdmin ? "outline" : "default"} 
                                    size="sm" 
                                    onClick={() => toggleAdmin(u.id, !!isUserAdmin, u.role)}
                                    className={cn("gap-2 shadow-sm h-9", isUserAdmin ? "border-destructive text-destructive hover:bg-destructive/10" : "bg-primary text-primary-foreground")}
                                  >
                                    {isUserAdmin ? (
                                      <>
                                        <UserMinus className="h-4 w-4" />
                                        {language === 'hi' ? 'एडमिन हटाएं' : 'Remove Admin'}
                                      </>
                                    ) : (
                                      <>
                                        <UserPlus className="h-4 w-4" />
                                        {language === 'hi' ? 'एडमिन बनाएं' : 'Make Admin'}
                                      </>
                                    )}
                                  </Button>
                                  
                                  {isPresident && !isTargetMe && !isTargetPresident && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10">
                                          <RemoveUserIcon className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>{language === 'hi' ? 'क्या आप इस सदस्य को हटाना चाहते हैं?' : 'Remove Member?'}</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {language === 'hi' 
                                              ? `यह ${u.name || 'उपयोगकर्ता'} के सभी पदों और प्रशासनिक पहुँच को हटा देगा। वे एक भक्त के रूप में रहेंगे।` 
                                              : `This will revoke all committee roles and administrative access for ${u.name || 'this user'}. They will return to 'Devotee' status.`}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleRemoveMember(u.id, u.role)} className="bg-destructive text-destructive-foreground">
                                            {language === 'hi' ? 'हटाएं' : 'Remove Member'}
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
        </Tabs>
      </div>
    </div>
  );
}
