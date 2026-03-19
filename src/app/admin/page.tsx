
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
import { collection, doc, deleteDoc, setDoc } from "firebase/firestore";
import { Trash2, Loader2, Calendar, Image as ImageIcon, ShieldAlert, ArrowLeft, Users, UserPlus, UserMinus, Bell, Globe, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const { data: events } = useCollection(eventsRef);
  const { data: gallery } = useCollection(galleryRef);
  const { data: allUsers } = useCollection(usersRef);
  const { data: allAdmins } = useCollection(adminsRef);
  const { data: notices } = useCollection(noticesRef);

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

  const toggleAdmin = (userId: string, isCurrentAdmin: boolean) => {
    if (!firestore) return;
    const roleRef = doc(firestore, "roles_admin", userId);
    if (isCurrentAdmin) {
      if (userId === user?.uid) {
        toast({ 
          variant: "destructive", 
          title: language === 'hi' ? "त्रुटि" : "Error", 
          description: language === 'hi' ? "आप स्वयं को व्यवस्थापक से नहीं हटा सकते।" : "You cannot remove yourself from admins." 
        });
        return;
      }
      deleteDoc(roleRef);
      toast({ title: language === 'hi' ? "व्यवस्थापक हटा दिया गया" : "Admin removed" });
    } else {
      setDoc(roleRef, { assignedAt: new Date().toISOString() });
      toast({ title: language === 'hi' ? "व्यवस्थापक जोड़ा गया" : "Admin added" });
    }
  };

  const isAdminUser = (userId: string) => {
    return allAdmins?.some(admin => admin.id === userId);
  };

  return (
    <div className="min-h-screen bg-secondary/20 pb-20 pt-28">
      <div className="container mx-auto px-4 md:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            <h1 className={cn("text-2xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
              {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
            </h1>
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
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger value="events" className="gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <Calendar className="h-4 w-4" /> {language === 'hi' ? 'कार्यक्रम' : 'Events'}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <ImageIcon className="h-4 w-4" /> {language === 'hi' ? 'गैलरी' : 'Gallery'}
            </TabsTrigger>
            <TabsTrigger value="notices" className="gap-2 bg-white border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <Bell className="h-4 w-4" /> {language === 'hi' ? 'सूचना' : 'Notice'}
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
                  {language === 'hi' ? 'उपयोगकर्ता प्रबंधन' : 'User Management'}
                </CardTitle>
                <CardDescription>Manage administrative privileges for the temple association members.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {allUsers?.map((u) => {
                    const isUserAdmin = isAdminUser(u.id);
                    return (
                      <div key={u.id} className="flex items-center justify-between p-5 border rounded-xl hover:bg-muted/30 transition-colors bg-white">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-lg text-primary">
                            {u.name?.charAt(0) || u.email?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{u.name || 'Anonymous User'}</span>
                            <span className="text-sm text-muted-foreground">{u.email}</span>
                            <div className="mt-1 flex gap-2">
                              {isUserAdmin ? (
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                                  {language === 'hi' ? 'प्रशासक' : 'Administrator'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  {language === 'hi' ? 'भक्त' : 'Devotee'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant={isUserAdmin ? "outline" : "default"} 
                          size="sm" 
                          onClick={() => toggleAdmin(u.id, !!isUserAdmin)}
                          className={cn("gap-2 shadow-sm", isUserAdmin ? "border-destructive text-destructive hover:bg-destructive/10" : "bg-primary text-primary-foreground")}
                        >
                          {isUserAdmin ? (
                            <>
                              <UserMinus className="h-4 w-4" />
                              {language === 'hi' ? 'व्यवस्थापक हटाएं' : 'Remove Admin'}
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4" />
                              {language === 'hi' ? 'व्यवस्थापक बनाएं' : 'Make Admin'}
                            </>
                          )}
                        </Button>
                      </div>
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
