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
import { collection, doc, collectionGroup, query, where, serverTimestamp, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
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
  CheckCircle,
  Settings,
  History,
  UserPlus,
  ArrowRightLeft,
  UserCog,
  ShieldQuestion,
  UserMinus,
  Crown
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [roleConfirm, setRoleConfirm] = useState<{ userId: string, name: string, newRole: string, type: 'admin' | 'role' } | null>(null);
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
  const membersRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "mandir_samiti_members"), [firestore, adminDoc]);
  const logsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "admin_activity_logs"), [firestore, adminDoc]);
  const donationsGroupRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collectionGroup(firestore, "donations")), [firestore, adminDoc]);
  const allAdminsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "roles_admin"), [firestore, adminDoc]);

  const { data: events } = useCollection(eventsRef);
  const { data: gallery } = useCollection(galleryRef);
  const { data: notices } = useCollection(noticesRef);
  const { data: requests } = useCollection(requestsRef);
  const { data: allUsers } = useCollection(usersRef);
  const { data: members } = useCollection(membersRef);
  const { data: logs } = useCollection(logsRef);
  const { data: allDonations } = useCollection(donationsGroupRef);
  const { data: allAdmins } = useCollection(allAdminsRef);

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminLoading) {
      if (!user) router.push("/login");
      else if (!adminDoc) router.push("/dashboard");
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, router, mounted]);

  const logActivity = (action: string, entityType: string, title: string) => {
    if (!logsRef || !user) return;
    addDocumentNonBlocking(logsRef, {
      adminId: user.uid,
      adminName: user.displayName || user.email,
      actionType: action,
      entityType,
      entityTitle: title,
      timestamp: new Date().toISOString()
    });
  };

  const handleAiGenerate = async (type: 'event' | 'notice') => {
    if (!aiTopic) {
      toast({ variant: "destructive", title: "Topic Required" });
      return;
    }
    setIsAiGenerating(true);
    try {
      const result = await generateTempleContent({ topic: aiTopic, type, language: language as 'hi' | 'en' });
      toast({ title: "AI Generated Content", description: result.title });
    } catch (err) {
      toast({ variant: "destructive", title: "AI Generation Failed" });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const confirmDelete = () => {
    if (!firestore || !deleteConfirm) return;
    deleteDocumentNonBlocking(doc(firestore, deleteConfirm.col, deleteConfirm.id));
    logActivity('DELETE', deleteConfirm.col, deleteConfirm.title);
    toast({ title: "Deleted Successfully" });
    setDeleteConfirm(null);
  };

  const handleRoleAction = async () => {
    if (!firestore || !roleConfirm) return;
    const { userId, name, newRole, type } = roleConfirm;

    try {
      if (type === 'admin') {
        const isAdmin = allAdmins?.some(a => a.id === userId);
        if (isAdmin) {
          await deleteDoc(doc(firestore, "roles_admin", userId));
          logActivity('REMOVE_ADMIN', 'roles_admin', name);
          toast({ title: "Admin Access Removed" });
        } else {
          await setDoc(doc(firestore, "roles_admin", userId), { assignedAt: new Date().toISOString() });
          logActivity('GRANT_ADMIN', 'roles_admin', name);
          toast({ title: "Admin Access Granted" });
        }
      } else {
        await updateDoc(doc(firestore, "users", userId), { role: newRole });
        logActivity('UPDATE_ROLE', 'users', `${name} -> ${newRole}`);
        toast({ title: "Role Updated Successfully" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setRoleConfirm(null);
    }
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalDonations = allDonations?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 pt-16 sm:pt-20">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 sm:p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0">
              <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div>
              <h1 className={cn("text-lg sm:text-2xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {language === 'hi' ? 'दैनिक मंदिर संचालन' : 'Daily Temple Operations'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link href="/" className="flex-1 sm:flex-initial">
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs sm:text-sm">
                <Globe className="h-4 w-4" />
                <span className="hidden xs:inline">{language === 'hi' ? 'वेबसाइट' : 'Website'}</span>
              </Button>
            </Link>
            <Link href="/admin" className="flex-1 sm:flex-initial">
              <Button variant="secondary" size="sm" className="w-full gap-2 text-xs sm:text-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden xs:inline">{language === 'hi' ? 'CMS एडिटर' : 'CMS Editor'}</span>
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full space-y-6">
          <div className="w-full overflow-x-auto bg-muted/40 p-1 rounded-xl">
            <TabsList className="flex h-auto w-max justify-start gap-1 bg-transparent border-0">
              {[
                { value: 'overview', icon: BarChart3, label: language === 'hi' ? 'सारांश' : 'Overview' },
                { value: 'donations', icon: HandCoins, label: language === 'hi' ? 'दान' : 'Donations' },
                { value: 'events', icon: Calendar, label: language === 'hi' ? 'कार्यक्रम' : 'Events' },
                { value: 'notices', icon: Bell, label: language === 'hi' ? 'सूचना' : 'Notices' },
                { value: 'gallery', icon: ImageIcon, label: language === 'hi' ? 'गैलरी' : 'Gallery' },
                { value: 'requests', icon: MessageSquare, label: language === 'hi' ? 'निवेदन' : 'Requests' },
                { value: 'members', icon: Users, label: language === 'hi' ? 'समिति' : 'Committee' },
                { value: 'users', icon: UserCog, label: language === 'hi' ? 'भक्त प्रबंधन' : 'Roles' },
                { value: 'logs', icon: History, label: language === 'hi' ? 'लॉग्स' : 'Logs' }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className="flex items-center gap-2 py-2 px-3 sm:px-4 shrink-0 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-xs font-bold whitespace-nowrap">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Collection', value: `₹${totalDonations.toLocaleString()}`, color: 'bg-primary/10 border-primary/20' },
                { label: 'Pending Requests', value: requests?.filter(r => r.status === 'pending').length || 0, color: 'bg-green-50 border-green-200' },
                { label: 'Active Events', value: events?.length || 0, color: 'bg-amber-50 border-amber-200' },
                { label: 'Total Devotees', value: allUsers?.length || 0, color: 'bg-blue-50 border-blue-200' }
              ].map((stat, i) => (
                <Card key={i} className={stat.color}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">{stat.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg">Record Manual Donation</CardTitle>
                    <CardDescription className="text-xs">Add cash or offline contributions.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const amount = Number(fd.get('amount'));
                      const name = fd.get('name') as string;
                      const donationData = {
                        amount,
                        devoteeName: name,
                        date: new Date().toISOString(),
                        mode: fd.get('mode'),
                        status: 'completed',
                        notes: fd.get('notes')
                      };
                      addDocumentNonBlocking(collection(firestore!, "donations"), donationData);
                      logActivity('CREATE', 'donations', `Manual: ${name} - ₹${amount}`);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Donation Recorded" });
                    }} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Devotee Name</Label>
                        <Input name="name" placeholder="Full Name" required className="bg-secondary/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Amount (₹)</Label>
                        <Input name="amount" type="number" placeholder="501" required className="bg-secondary/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Payment Mode</Label>
                        <select name="mode" className="w-full h-10 rounded-md border border-input bg-secondary/30 px-3 text-sm focus:ring-2 focus:ring-primary outline-none">
                          <option value="Cash">Cash</option>
                          <option value="Offline UPI">Offline UPI</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Notes</Label>
                        <Input name="notes" placeholder="Optional details..." className="bg-secondary/30" />
                      </div>
                      <Button className="w-full gap-2 shadow-lg"><Plus className="h-4 w-4" /> Save Record</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <Card className="shadow-md border-primary/10 overflow-hidden">
                  <CardHeader className="border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5">
                    <CardTitle className="text-lg">Donation Ledger</CardTitle>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" />
                      <Input 
                        placeholder="Search records..." 
                        className="pl-8 h-9 text-xs bg-white" 
                        value={donationSearch} 
                        onChange={(e) => setDonationSearch(e.target.value)} 
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/10">
                        <TableRow>
                          <TableHead className="text-[10px] uppercase font-black tracking-tighter">Devotee</TableHead>
                          <TableHead className="text-[10px] uppercase font-black tracking-tighter">Amount</TableHead>
                          <TableHead className="text-[10px] uppercase font-black tracking-tighter hidden sm:table-cell">Date</TableHead>
                          <TableHead className="text-[10px] uppercase font-black tracking-tighter">Mode</TableHead>
                          <TableHead className="text-[10px] uppercase font-black tracking-tighter text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allDonations?.filter(d => 
                          (d.devoteeName || d.userEmail || '').toLowerCase().includes(donationSearch.toLowerCase())
                        ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((d: any) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-bold text-xs truncate max-w-[120px]">{d.devoteeName || d.userEmail || 'Guest'}</TableCell>
                            <TableCell className="font-black text-sm text-primary">₹{d.amount}</TableCell>
                            <TableCell className="text-[10px] opacity-60 hidden sm:table-cell">{new Date(d.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-[9px] opacity-70 uppercase font-bold">{d.mode || 'Direct'}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={d.status === 'completed' ? 'default' : 'outline'} className="text-[9px] px-2 py-0 h-5">{d.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg">Add New Event</CardTitle>
                    <CardDescription className="text-xs">Post temple functions & festivals.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-2">
                      <Input placeholder="Event Topic..." value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="bg-secondary/30" />
                      <Button variant="outline" size="icon" onClick={() => handleAiGenerate('event')} disabled={isAiGenerating}>
                        {isAiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const title = fd.get('title') as string;
                      addDocumentNonBlocking(eventsRef!, {
                        title,
                        date: fd.get('date'),
                        description: fd.get('desc'),
                        image: "https://picsum.photos/seed/event/600/400"
                      });
                      logActivity('CREATE', 'events', title);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Event Posted" });
                    }} className="space-y-4">
                      <Input name="title" placeholder="Event Title" required className="bg-secondary/30" />
                      <Input name="date" type="datetime-local" required className="bg-secondary/30" />
                      <Textarea name="desc" placeholder="Details..." className="bg-secondary/30 min-h-[100px]" />
                      <Button className="w-full shadow-lg">Post Event</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <div className="grid gap-3">
                  {events?.map(ev => (
                    <Card key={ev.id} className="flex flex-row items-center p-4 gap-4 hover:shadow-md border-primary/5">
                      <div className="bg-primary/5 p-3 rounded-lg hidden xs:block"><Calendar className="h-5 w-5 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm sm:text-base truncate">{ev.title}</h4>
                        <p className="text-[10px] sm:text-xs opacity-60 flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(ev.date).toLocaleString()}</p>
                      </div>
                      <Button variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDeleteConfirm({ col: 'events', id: ev.id, title: ev.title })}>
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
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg">New Notice</CardTitle>
                    <CardDescription className="text-xs">Important temple announcements.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                     <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const title = fd.get('title') as string;
                      addDocumentNonBlocking(noticesRef!, {
                        title,
                        content: fd.get('content'),
                        importance: fd.get('importance'),
                        createdAt: new Date().toISOString()
                      });
                      logActivity('CREATE', 'notices', title);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Notice Published" });
                    }} className="space-y-4">
                      <Input name="title" placeholder="Notice Headline" required className="bg-secondary/30" />
                      <select name="importance" className="w-full h-10 rounded-md border border-input bg-secondary/30 px-3 text-sm focus:ring-2 focus:ring-primary outline-none">
                        <option value="normal">Normal</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <Textarea name="content" placeholder="Message content..." required className="bg-secondary/30 min-h-[120px]" />
                      <Button className="w-full shadow-lg">Post Notice</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <div className="grid gap-3">
                  {notices?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(n => (
                    <Card key={n.id} className={cn("border-l-4 p-4 flex justify-between items-center shadow-sm", n.importance === 'urgent' ? 'border-l-destructive' : 'border-l-primary')}>
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm sm:text-base truncate">{n.title}</h4>
                          {n.importance === 'urgent' && <Badge className="bg-destructive text-[8px] h-4 uppercase">Urgent</Badge>}
                        </div>
                        <p className="text-[11px] sm:text-xs opacity-60 line-clamp-1 italic">"{n.content}"</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm({ col: 'notices', id: n.id, title: n.title })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card className="shadow-md border-primary/10 overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b bg-muted/10 p-5">
                <CardTitle className="text-lg">Media Gallery</CardTitle>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const caption = fd.get('caption') as string;
                  addDocumentNonBlocking(galleryRef!, {
                    caption,
                    imageURL: fd.get('url'),
                    createdAt: new Date().toISOString()
                  });
                  logActivity('CREATE', 'gallery', caption);
                  (e.target as HTMLFormElement).reset();
                  toast({ title: "Media Added" });
                }} className="flex flex-col sm:flex-row gap-2 w-full sm:max-w-2xl">
                  <Input name="url" placeholder="Image/Video URL" required className="h-9 text-xs bg-white flex-1" />
                  <Input name="caption" placeholder="Caption" className="h-9 text-xs bg-white flex-1" />
                  <Button size="sm" className="h-9 px-6"><Plus className="h-4 w-4 mr-2" /> Add</Button>
                </form>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {gallery?.map(item => (
                    <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border border-primary/5 bg-muted shadow-sm hover:shadow-lg transition-all">
                      <img src={item.imageURL} className="w-full h-full object-cover" alt={item.caption} />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8 shadow-xl" 
                          onClick={() => setDeleteConfirm({ col: 'gallery', id: item.id, title: item.caption || 'Image' })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/40 backdrop-blur-sm">
                          <p className="text-[8px] text-white truncate font-medium">{item.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
             <Card className="shadow-md border-primary/10 overflow-hidden">
              <CardHeader className="bg-primary/5"><CardTitle className="text-lg">Prayer & Ritual Requests</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter">Devotee</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter">Type</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter hidden sm:table-cell">Message</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter">Status</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests?.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs font-bold">{r.name}</TableCell>
                        <TableCell className="capitalize text-[10px]"><Badge variant="outline" className="h-4 px-1">{r.requestType}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate text-[10px] opacity-70 hidden sm:table-cell italic">"{r.message}"</TableCell>
                        <TableCell><Badge variant={r.status === 'completed' ? 'default' : 'secondary'} className="text-[9px] px-2 h-5">{r.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => {
                              updateDocumentNonBlocking(doc(firestore!, "prayer_requests", r.id), { status: 'completed' });
                              logActivity('UPDATE', 'prayer_requests', `Request Completed for ${r.name}`);
                              toast({ title: "Status Updated" });
                            }}
                            disabled={r.status === 'completed'}
                          >
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

          <TabsContent value="members" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg">Add Committee Member</CardTitle>
                    <CardDescription className="text-xs">Manage temple officials.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const name = fd.get('name') as string;
                      addDocumentNonBlocking(membersRef!, {
                        name,
                        role: fd.get('role'),
                        displayOrder: Number(fd.get('order')) || 0
                      });
                      logActivity('CREATE', 'members', name);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Member Added" });
                    }} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Name</Label>
                        <Input name="name" placeholder="Official Name" required className="bg-secondary/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Role</Label>
                        <Input name="role" placeholder="President / Secretary" required className="bg-secondary/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Display Order</Label>
                        <Input name="order" type="number" placeholder="1" className="bg-secondary/30" />
                      </div>
                      <Button className="w-full shadow-lg">Add Member</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <Card className="shadow-md border-primary/10 overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-lg">Official Directory</CardTitle></CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/10">
                        <TableRow>
                          <TableHead className="w-16 text-[10px] uppercase font-black">Order</TableHead>
                          <TableHead className="text-[10px] uppercase font-black">Name</TableHead>
                          <TableHead className="text-[10px] uppercase font-black">Role</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members?.sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map(m => (
                          <TableRow key={m.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{m.displayOrder}</TableCell>
                            <TableCell className="font-bold text-xs">{m.name}</TableCell>
                            <TableCell className="text-[10px] uppercase font-black opacity-60">{m.role}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteConfirm({ col: 'mandir_samiti_members', id: m.id, title: m.name })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-md border-primary/10 overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row items-center justify-between py-4 px-5 bg-muted/10 border-b gap-4">
                <CardTitle className="text-lg">Role & Permission Management</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                  <Input 
                    placeholder="Search devotees..." 
                    className="pl-9 h-9 text-xs bg-white" 
                    value={userSearch} 
                    onChange={(e) => setUserSearch(e.target.value)} 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter">Devotee</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter">Current Role</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter">Technical Admin</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.filter(u => 
                      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
                    ).map(u => {
                      const isTechAdmin = allAdmins?.some(a => a.id === u.id);
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs">{u.name || 'Anonymous'}</span>
                              <span className="text-[10px] text-muted-foreground">{u.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={u.role || 'devotee'} 
                              onValueChange={(val) => setRoleConfirm({ userId: u.id, name: u.name || u.email, newRole: val, type: 'role' })}
                            >
                              <SelectTrigger className="h-7 w-28 text-[10px] font-bold uppercase">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="devotee">Devotee</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="official">Official</SelectItem>
                                <SelectItem value="president">President</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {isTechAdmin ? (
                              <Badge className="bg-primary text-white border-0 gap-1 px-2 h-5">
                                <ShieldCheck className="h-3 w-3" /> Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground gap-1 px-2 h-5">
                                <ShieldQuestion className="h-3 w-3" /> Devotee
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant={isTechAdmin ? "destructive" : "default"} 
                                size="sm" 
                                className="h-7 px-2 text-[9px] font-black uppercase"
                                onClick={() => setRoleConfirm({ 
                                  userId: u.id, 
                                  name: u.name || u.email, 
                                  newRole: isTechAdmin ? 'devotee' : 'admin', 
                                  type: 'admin' 
                                })}
                                disabled={u.id === user?.uid} // Don't let user demote themselves
                              >
                                {isTechAdmin ? (
                                  <><UserMinus className="h-3 w-3 mr-1" /> Demote</>
                                ) : (
                                  <><Crown className="h-3 w-3 mr-1" /> Promote</>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="shadow-md border-primary/10 overflow-hidden">
              <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-lg">Admin Audit Logs</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter">Timestamp</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter">Admin</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter">Action</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-tighter text-right">Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50).map((l: any) => (
                      <TableRow key={l.id} className="text-xs">
                        <TableCell className="text-[9px] opacity-60 font-mono">{new Date(l.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="font-bold text-[10px]">{l.adminName}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[8px] h-4 uppercase", l.actionType === 'DELETE' || l.actionType === 'REMOVE_ADMIN' ? 'bg-red-500' : 'bg-emerald-500')}>
                            {l.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-[9px] font-medium opacity-70 truncate max-w-[150px]">
                          {l.entityType}: {l.entityTitle}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Role Action Confirmation */}
      <AlertDialog open={!!roleConfirm} onOpenChange={(o) => !o && setRoleConfirm(null)}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserCog className="text-primary h-5 w-5" /> Confirm Role Update
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {roleConfirm?.type === 'admin' 
                ? `Are you sure you want to ${allAdmins?.some(a => a.id === roleConfirm.userId) ? 'REMOVE technical admin access from' : 'GRANT technical admin access to'} ${roleConfirm.name}?`
                : `Are you sure you want to change ${roleConfirm?.name}'s community role to "${roleConfirm?.newRole?.toUpperCase()}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleAction} className="bg-primary hover:bg-primary/90 shadow-lg">Confirm Action</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5" /> Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">Are you sure you want to remove "{deleteConfirm?.title}" from {deleteConfirm?.col}? This action is permanent and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 shadow-lg">Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
