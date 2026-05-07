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
import { collection, doc, collectionGroup, query, where } from "firebase/firestore";
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
  ShieldCheck, 
  Plus,
  Search, 
  BarChart3, 
  HandCoins, 
  Clock,
  AlertTriangle,
  Database,
  Wand2,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateTempleContent } from "@/ai/flows/admin-ai-flow";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function ManagementPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  // States
  const [userSearch, setUserSearch] = useState("");
  const [donationSearch, setDonationSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ col: string, id: string, title: string } | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // AI Form States
  const [aiTopic, setAiTopic] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  // Collections
  const eventsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "events"), [firestore, adminDoc]);
  const galleryRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "gallery"), [firestore, adminDoc]);
  const noticesRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "notices"), [firestore, adminDoc]);
  const requestsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "prayer_requests"), [firestore, adminDoc]);
  const usersRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "users"), [firestore, adminDoc]);
  const donationsGroupRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collectionGroup(firestore, "donations")), [firestore, adminDoc]);

  const { data: events } = useCollection(eventsRef);
  const { data: gallery } = useCollection(galleryRef);
  const { data: notices } = useCollection(noticesRef);
  const { data: requests } = useCollection(requestsRef);
  const { data: allUsers } = useCollection(usersRef);
  const { data: allDonations } = useCollection(donationsGroupRef);

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminLoading) {
      if (!user) router.push("/login");
      else if (!adminDoc) router.push("/dashboard");
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, router, mounted]);

  const handleAiGenerate = async (type: 'event' | 'notice') => {
    if (!aiTopic) {
      toast({ variant: "destructive", title: "Topic Required" });
      return;
    }
    setIsAiGenerating(true);
    try {
      const result = await generateTempleContent({ topic: aiTopic, type, language: language as 'hi' | 'en' });
      // Logic would typically populate a form here
      toast({ title: "AI Generated Content", description: result.title });
    } catch (err) {
      toast({ variant: "destructive", title: "AI Generation Failed" });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAction = async (action: () => void, successMsg: string) => {
    setIsSubmitting(true);
    try {
      await action();
      toast({ title: successMsg });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!firestore || !deleteConfirm) return;
    deleteDocumentNonBlocking(doc(firestore, deleteConfirm.col, deleteConfirm.id));
    toast({ title: "Deleted Successfully" });
    setDeleteConfirm(null);
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalDonations = allDonations?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

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
              <p className="text-xs text-muted-foreground">{language === 'hi' ? 'दैनिक मंदिर संचालन' : 'Daily Temple Operations'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/"><Button variant="outline" size="sm" className="gap-2"><Globe className="h-4 w-4" />{language === 'hi' ? 'वेबसाइट' : 'Website'}</Button></Link>
            <Link href="/admin"><Button variant="secondary" size="sm" className="gap-2"><Settings className="h-4 w-4" />{language === 'hi' ? 'CMS एडिटर' : 'CMS Editor'}</Button></Link>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="overflow-x-auto no-scrollbar mb-6">
            <TabsList className="bg-muted/40 p-1 rounded-xl inline-flex w-max min-w-full justify-start h-auto">
              <TabsTrigger value="overview" className="gap-2 py-2 px-4"><BarChart3 className="h-4 w-4" /> {language === 'hi' ? 'सारांश' : 'Overview'}</TabsTrigger>
              <TabsTrigger value="donations" className="gap-2 py-2 px-4"><HandCoins className="h-4 w-4" /> {language === 'hi' ? 'दान' : 'Donations'}</TabsTrigger>
              <TabsTrigger value="events" className="gap-2 py-2 px-4"><Calendar className="h-4 w-4" /> {language === 'hi' ? 'कार्यक्रम' : 'Events'}</TabsTrigger>
              <TabsTrigger value="notices" className="gap-2 py-2 px-4"><Bell className="h-4 w-4" /> {language === 'hi' ? 'सूचना' : 'Notices'}</TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2 py-2 px-4"><ImageIcon className="h-4 w-4" /> {language === 'hi' ? 'गैलरी' : 'Gallery'}</TabsTrigger>
              <TabsTrigger value="requests" className="gap-2 py-2 px-4"><MessageSquare className="h-4 w-4" /> {language === 'hi' ? 'निवेदन' : 'Requests'}</TabsTrigger>
              <TabsTrigger value="users" className="gap-2 py-2 px-4"><Users className="h-4 w-4" /> {language === 'hi' ? 'भक्त' : 'Users'}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-60">Total Collection</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">₹{totalDonations.toLocaleString()}</div></CardContent>
              </Card>
              <Card className="bg-green-50 border-green-100">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-60">Pending Requests</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{requests?.filter(r => r.status === 'pending').length || 0}</div></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <CardTitle>{language === 'hi' ? 'दान संग्रह' : 'Donation Ledger'}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Devotee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDonations?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.devoteeName || d.userEmail || 'Guest'}</TableCell>
                        <TableCell className="font-bold text-primary">₹{d.amount}</TableCell>
                        <TableCell className="text-xs">{new Date(d.date).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant={d.status === 'completed' ? 'default' : 'outline'}>{d.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg">Add New Event</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-2">
                      <Input placeholder="Event Topic..." value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
                      <Button variant="outline" size="icon" onClick={() => handleAiGenerate('event')} disabled={isAiGenerating}>
                        {isAiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      addDocumentNonBlocking(eventsRef!, {
                        title: fd.get('title'),
                        date: fd.get('date'),
                        description: fd.get('desc'),
                        image: "https://picsum.photos/seed/event/600/400"
                      });
                      (e.target as HTMLFormElement).reset();
                    }} className="space-y-4">
                      <Input name="title" placeholder="Event Title" required />
                      <Input name="date" type="datetime-local" required />
                      <Textarea name="desc" placeholder="Details..." />
                      <Button className="w-full" disabled={isSubmitting}>Post Event</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <div className="grid gap-4">
                  {events?.map(ev => (
                    <Card key={ev.id} className="flex flex-col sm:flex-row items-center p-4 gap-4">
                      <div className="flex-1 w-full">
                        <h4 className="font-bold">{ev.title}</h4>
                        <p className="text-xs opacity-60">{new Date(ev.date).toLocaleString()}</p>
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => setDeleteConfirm({ col: 'events', id: ev.id, title: ev.title })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notices" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg">New Notice</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                     <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      addDocumentNonBlocking(noticesRef!, {
                        title: fd.get('title'),
                        content: fd.get('content'),
                        importance: fd.get('importance'),
                        createdAt: new Date().toISOString()
                      });
                      (e.target as HTMLFormElement).reset();
                    }} className="space-y-4">
                      <Input name="title" placeholder="Notice Headline" required />
                      <select name="importance" className="w-full h-10 rounded border bg-background px-3 text-sm">
                        <option value="normal">Normal</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <Textarea name="content" placeholder="Message content..." required />
                      <Button className="w-full">Post Notice</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <div className="grid gap-4">
                  {notices?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(n => (
                    <Card key={n.id} className={cn("border-l-4 p-4 flex justify-between items-center", n.importance === 'urgent' ? 'border-l-destructive' : 'border-l-primary')}>
                      <div>
                        <h4 className="font-bold">{n.title}</h4>
                        <p className="text-xs opacity-60 line-clamp-1">{n.content}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ col: 'notices', id: n.id, title: n.title })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Media Gallery</CardTitle>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  addDocumentNonBlocking(galleryRef!, {
                    caption: fd.get('caption'),
                    imageURL: fd.get('url'),
                    createdAt: new Date().toISOString()
                  });
                  (e.target as HTMLFormElement).reset();
                }} className="flex gap-2 max-w-lg">
                  <Input name="url" placeholder="Image/Video URL" required />
                  <Input name="caption" placeholder="Caption" />
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add</Button>
                </form>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {gallery?.map(item => (
                  <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border">
                    <img src={item.imageURL} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="icon" onClick={() => setDeleteConfirm({ col: 'gallery', id: item.id, title: item.caption || 'Image' })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
             <Card>
              <CardHeader><CardTitle>Prayer & Ritual Requests</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Devotee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests?.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell className="capitalize">{r.requestType}</TableCell>
                        <TableCell className="max-w-xs truncate">{r.message}</TableCell>
                        <TableCell><Badge variant={r.status === 'completed' ? 'default' : 'secondary'}>{r.status}</Badge></TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => updateDocumentNonBlocking(doc(firestore!, "prayer_requests", r.id), { status: 'completed' })}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registered Devotees</CardTitle>
                <div className="relative w-64"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" /><Input placeholder="Search users..." className="pl-9" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} /></div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Verified</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {allUsers?.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-bold">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="capitalize">{u.role}</TableCell>
                        <TableCell>{u.isVerified ? <Badge className="bg-green-500">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5" /> Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove "{deleteConfirm?.title}"? This action is permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
