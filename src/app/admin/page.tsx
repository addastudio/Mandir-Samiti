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
import { Trash2, Loader2, Calendar, Image as ImageIcon, ShieldAlert, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();

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

  const { data: events } = useCollection(eventsRef);
  const { data: gallery } = useCollection(galleryRef);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading) {
      if (!user) {
        router.push("/login");
      } else if (!adminDoc) {
        // Not an authorized administrator
        router.push("/dashboard");
      }
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, router]);

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
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

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 mt-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h1 className={cn("text-3xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
            {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
          </h1>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {language === 'hi' ? 'डैशबोर्ड पर लौटें' : 'Back to Dashboard'}
        </Button>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" /> {language === 'hi' ? 'कार्यक्रम' : 'Events'}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2">
            <ImageIcon className="h-4 w-4" /> {language === 'hi' ? 'गैलरी' : 'Gallery'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className={cn(language === 'hi' ? 'font-hindi' : '')}>
                {language === 'hi' ? 'नया कार्यक्रम जोड़ें' : 'Add New Event'}
              </CardTitle>
              <CardDescription>
                {language === 'hi' ? 'भक्तों को सूचित करने के लिए आगामी कार्यक्रम का विवरण भरें।' : 'Fill in the details for an upcoming event to notify devotees.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {events?.map((event) => (
              <Card key={event.id} className="group overflow-hidden">
                <div className="relative h-40 bg-muted">
                   <img src={event.image} alt={event.title} className="object-cover w-full h-full" />
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete("events", event.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>{new Date(event.date).toLocaleString()}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className={cn(language === 'hi' ? 'font-hindi' : '')}>
                {language === 'hi' ? 'गैलरी में जोड़ें' : 'Add to Gallery'}
              </CardTitle>
              <CardDescription>
                {language === 'hi' ? 'मंदिर के दर्शन की तस्वीरें साझा करें।' : 'Share photos of temple darshan.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {gallery?.map((item) => (
              <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border shadow-sm">
                <img src={item.imageURL} alt={item.caption} className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="icon" onClick={() => handleDelete("gallery", item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
