"use client";

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, doc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Plus, Trash2, Loader2, Calendar, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

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

  // Redirect if not admin
  useEffect(() => {
    if (!isUserLoading && !isAdminLoading) {
      if (!user) {
        router.push("/login");
      } else if (!adminDoc) {
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
    toast({ title: "Event Added Successfully" });
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
    toast({ title: "Gallery Item Added Successfully" });
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  const handleDelete = (col: string, id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, col, id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Item deleted" });
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 mt-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Management</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>

      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" /> Events
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2">
            <ImageIcon className="h-4 w-4" /> Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Event</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date & Time</Label>
                    <Input id="date" name="date" type="datetime-local" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL (Optional)</Label>
                  <Input id="image" name="image" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" required />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Event"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events?.map((event) => (
              <Card key={event.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete("events", event.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add to Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddGallery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageURL">Image URL</Label>
                  <Input id="imageURL" name="imageURL" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Input id="caption" name="caption" />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add to Gallery"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery?.map((item) => (
              <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden border">
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
