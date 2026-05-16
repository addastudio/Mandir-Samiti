
"use client";

import * as React from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, collectionGroup } from "firebase/firestore";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Calendar, 
  Bell, 
  Users, 
  ShieldAlert, 
  Globe, 
  MessageSquare, 
  BarChart3, 
  HandCoins, 
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  Wand2,
  Clock,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  History,
  Palette
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { generateTempleContent } from "@/ai/flows/admin-ai-flow";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getBackendConnectionStatus, getPaymentGatewayStatus, getEmailServiceStatus, getRecaptchaStatus } from "@/app/actions";

/**
 * Management Panel Content Component
 */
function ManagementPageContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview");
  const [isSaving, setIsSaving] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  
  // Stats and Status State
  const [apiStatus, setApiStatus] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      getBackendConnectionStatus(),
      getPaymentGatewayStatus(),
      getEmailServiceStatus(),
      getRecaptchaStatus()
    ]).then(([backend, payments, email, recaptcha]) => {
      setApiStatus({ backend, payments, email, recaptcha });
    });
  }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  // Operational Collections
  const noticesRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "notices"), orderBy("createdAt", "desc")), [firestore, adminDoc]);
  const eventsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "events"), orderBy("date", "desc")), [firestore, adminDoc]);
  const membersRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "mandir_samiti_members"), orderBy("displayOrder", "asc")), [firestore, adminDoc]);
  const requestsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "prayer_requests"), orderBy("createdAt", "desc")), [firestore, adminDoc]);
  const donationsGroupRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collectionGroup(firestore, "donations"), orderBy("date", "desc")), [firestore, adminDoc]);
  const logsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "admin_activity_logs"), orderBy("timestamp", "desc")), [firestore, adminDoc]);

  const { data: notices, isLoading: isNoticesLoading } = useCollection(noticesRef);
  const { data: events, isLoading: isEventsLoading } = useCollection(eventsRef);
  const { data: members, isLoading: isMembersLoading } = useCollection(membersRef);
  const { data: requests, isLoading: isRequestsLoading } = useCollection(requestsRef);
  const { data: allDonations, isLoading: isDonationsLoading } = useCollection(donationsGroupRef);
  const { data: logs, isLoading: isLogsLoading } = useCollection(logsRef);

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminLoading) {
      if (!user) router.push("/login");
      else if (!adminDoc) router.push("/dashboard");
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, router, mounted]);

  const logAction = async (action: string, type: string, title: string) => {
    if (!firestore || !user) return;
    try {
      await addDoc(collection(firestore, "admin_activity_logs"), {
        adminId: user.uid,
        adminName: user.displayName || user.email,
        actionType: action,
        entityType: type,
        entityTitle: title,
        timestamp: new Date().toISOString()
      });
    } catch (e) { console.error("Logging failed", e); }
  };

  const handleAIGenerate = async (topic: string, type: 'event' | 'notice', setFormValues: (title: string, content: string) => void) => {
    if (!topic) return;
    setIsAIGenerating(true);
    try {
      const result = await generateTempleContent({ topic, type, language: language as 'hi' | 'en' });
      setFormValues(result.title, result.content);
      toast({ title: "AI Generation Success", description: "Content drafted by Gemini 2.5 Flash." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "AI Error", description: err.message });
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleDelete = async (coll: string, id: string, title: string) => {
    if (!firestore || !confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(firestore, coll, id));
      await logAction("DELETE", coll.toUpperCase(), title);
      toast({ title: "Successfully Deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "prayer_requests", id), { status });
      toast({ title: "Status Updated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user || !adminDoc) return null;

  return (
    <div className="min-h-screen bg-secondary/30 pb-20 pt-16 sm:pt-20">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel' }]} />

        {/* Header Summary */}
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
             <Link href="/admin"><Button variant="default" size="sm" className="gap-2 bg-accent text-accent-foreground"><Palette className="h-4 w-4" />{language === 'hi' ? 'वेबसाइट एडिटर' : 'Open CMS'}</Button></Link>
             <Link href="/dashboard"><Button variant="outline" size="sm" className="gap-2"><LayoutDashboard className="h-4 w-4" />{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</Button></Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="w-full overflow-x-auto bg-muted/40 p-1 rounded-xl touch-scroll">
            <TabsList className="flex h-auto w-max justify-start gap-1 bg-transparent border-0 flex-nowrap">
              {[
                { value: 'overview', icon: BarChart3, label: language === 'hi' ? 'सारांश' : 'Overview' },
                { value: 'notices', icon: Bell, label: language === 'hi' ? 'सूचना' : 'Notices' },
                { value: 'events', icon: Calendar, label: language === 'hi' ? 'कार्यक्रम' : 'Events' },
                { value: 'donations', icon: HandCoins, label: language === 'hi' ? 'दान' : 'Donations' },
                { value: 'requests', icon: MessageSquare, label: language === 'hi' ? 'निवेदन' : 'Requests' },
                { value: 'members', icon: Users, label: language === 'hi' ? 'समिति' : 'Members' },
                { value: 'logs', icon: History, label: language === 'hi' ? 'लॉग' : 'Audit Logs' },
                { value: 'infrastructure', icon: Zap, label: language === 'hi' ? 'इन्फ्रास्ट्रक्चर' : 'Infrastructure' }
              ].map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 py-2 px-3 sm:px-4 shrink-0 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                  <tab.icon className="h-4 w-4" />
                  <span className="text-xs font-bold whitespace-nowrap">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t.mgmtStatTotalCollection, value: `₹${allDonations?.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString() || 0}`, color: 'bg-primary/10 border-primary/20', icon: HandCoins },
                { label: t.mgmtStatPendingRequests, value: requests?.filter(r => r.status === 'pending').length || 0, color: 'bg-green-50 border-green-200', icon: MessageSquare },
                { label: t.mgmtStatActiveEvents, value: events?.length || 0, color: 'bg-amber-50 border-amber-200', icon: Calendar },
                { label: t.mgmtStatTotalDevotees, value: allDonations?.length || 0, color: 'bg-blue-50 border-blue-200', icon: Users }
              ].map((stat, i) => (
                <Card key={i} className={cn("relative overflow-hidden group transition-all hover:shadow-md", stat.color)}>
                  <stat.icon className="absolute -right-2 -bottom-2 h-16 w-16 opacity-10 rotate-12 transition-transform group-hover:scale-110" />
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">{stat.label}</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stat.value}</div></CardContent>
                </Card>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card>
                 <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Bell className="h-4 w-4" />Recent Notices</CardTitle></CardHeader>
                 <CardContent>
                    <div className="space-y-3">
                       {notices?.slice(0, 3).map(n => (
                         <div key={n.id} className="p-3 border rounded-lg bg-secondary/10 flex justify-between items-center">
                            <div><p className="text-xs font-bold truncate max-w-[200px]">{n.title}</p><p className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</p></div>
                            <Badge variant={n.importance === 'urgent' ? 'destructive' : 'outline'}>{n.importance}</Badge>
                         </div>
                       ))}
                    </div>
                 </CardContent>
               </Card>
               <Card>
                 <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4" />Unresolved Requests</CardTitle></CardHeader>
                 <CardContent>
                    <div className="space-y-3">
                       {requests?.filter(r => r.status === 'pending').slice(0, 3).map(r => (
                         <div key={r.id} className="p-3 border rounded-lg bg-secondary/10">
                            <p className="text-xs font-bold">{r.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{r.message}</p>
                         </div>
                       ))}
                    </div>
                 </CardContent>
               </Card>
            </div>
          </TabsContent>

          <TabsContent value="notices" className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Temple Announcements</h2>
                <NoticeFormDialog onSave={async (d) => { await addDoc(collection(firestore!, "notices"), {...d, createdAt: new Date().toISOString()}); await logAction("CREATE", "NOTICE", d.title); }} isAIGenerating={isAIGenerating} onAIGenerate={handleAIGenerate} />
             </div>
             <Card>
               <Table>
                 <TableHeader><TableRow><TableHead>Notice</TableHead><TableHead>Priority</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {notices?.map(n => (
                     <TableRow key={n.id}>
                        <TableCell className="font-bold">{n.title}</TableCell>
                        <TableCell><Badge variant={n.importance === 'urgent' ? 'destructive' : 'outline'}>{n.importance}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete("notices", n.id, n.title)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Event Calendar</h2>
                <EventFormDialog onSave={async (d) => { await addDoc(collection(firestore!, "events"), d); await logAction("CREATE", "EVENT", d.title); }} isAIGenerating={isAIGenerating} onAIGenerate={handleAIGenerate} />
             </div>
             <Card>
               <Table>
                 <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {events?.map(e => (
                     <TableRow key={e.id}>
                        <TableCell className="font-bold">{e.title}</TableCell>
                        <TableCell className="text-xs">{new Date(e.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete("events", e.id, e.title)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </Card>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
             <h2 className="text-xl font-bold">Global Donation Records</h2>
             <Card>
               <Table>
                 <TableHeader><TableRow><TableHead>Devotee</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {allDonations?.map(d => (
                     <TableRow key={d.id}>
                        <TableCell className="font-bold">{d.devoteeName || 'Anonymous'}</TableCell>
                        <TableCell className="text-primary font-bold">₹{d.amount}</TableCell>
                        <TableCell className="text-xs uppercase opacity-70">{d.mode}</TableCell>
                        <TableCell><Badge variant={d.status === 'completed' ? 'default' : 'outline'}>{d.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(d.date).toLocaleString()}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
             <h2 className="text-xl font-bold">Prayer & Ritual Requests</h2>
             <div className="grid grid-cols-1 gap-4">
                {requests?.map(r => (
                  <Card key={r.id} className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                       <div><CardTitle className="text-base">{r.name}</CardTitle><CardDescription>{r.email || r.phone}</CardDescription></div>
                       <Select defaultValue={r.status} onValueChange={(val) => handleUpdateStatus(r.id, val)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="pending">Pending</SelectItem>
                             <SelectItem value="viewed">Viewed</SelectItem>
                             <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                       </Select>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm italic">"{r.message}"</p>
                       <div className="flex justify-between items-center mt-4 pt-2 border-t text-[10px] text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px]">{r.requestType}</Badge>
                          <span>{new Date(r.createdAt).toLocaleString()}</span>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Mandir Samiti Members</h2>
                <MemberFormDialog onSave={async (d) => { await addDoc(collection(firestore!, "mandir_samiti_members"), d); await logAction("CREATE", "MEMBER", d.name); }} />
             </div>
             <Card>
               <Table>
                 <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Order</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {members?.map(m => (
                     <TableRow key={m.id}>
                        <TableCell className="font-bold">{m.name}</TableCell>
                        <TableCell className="text-xs uppercase">{m.role}</TableCell>
                        <TableCell>{m.displayOrder}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete("mandir_samiti_members", m.id, m.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
             <h2 className="text-xl font-bold">Administrative Activity Trail</h2>
             <Card className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {logs?.map(log => (
                      <TableRow key={log.id} className="text-xs">
                        <TableCell className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="font-bold">{log.adminName}</TableCell>
                        <TableCell><Badge variant="outline">{log.actionType}</Badge></TableCell>
                        <TableCell>{log.entityType}: {log.entityTitle}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </Card>
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-6">
            <Card className="shadow-md border-secondary/30">
              <CardHeader className="bg-secondary/30 border-b"><CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Service Health Dashboard</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {apiStatus ? ([
                    { label: apiStatus.backend.firebase.label, active: apiStatus.backend.firebase.active, icon: Globe },
                    { label: "Stripe Gateway", active: apiStatus.payments.stripe, icon: HandCoins },
                    { label: "Cashfree Gateway", active: apiStatus.payments.cashfree, icon: Zap },
                    { label: "Resend Email", active: apiStatus.email.isLive, icon: MessageSquare }
                  ].map((api, idx) => (
                    <div key={idx} className="p-4 rounded-xl border bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3"><api.icon className="h-4 w-4" /><span className="text-xs font-bold">{api.label}</span></div>
                      <Badge variant={api.active ? "default" : "destructive"}>{api.active ? "LIVE" : "OFFLINE"}</Badge>
                    </div>
                  ))) : (<div className="col-span-full py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* Sub-form Components */

function NoticeFormDialog({ onSave, isAIGenerating, onAIGenerate }: any) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [importance, setImportance] = useState("normal");
  const [topic, setTopic] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New Notice</Button></DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Post New Notice</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
           <div className="flex gap-2 bg-primary/5 p-3 rounded-xl border border-primary/10">
              <Input placeholder="Enter topic for AI Wand..." value={topic} onChange={e => setTopic(e.target.value)} />
              <Button size="icon" onClick={() => onAIGenerate(topic, 'notice', (t: string, c: string) => { setTitle(t); setContent(c); })} disabled={isAIGenerating}>
                 {isAIGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </Button>
           </div>
           <div className="space-y-2"><Label>Headline</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
           <div className="space-y-2"><Label>Priority</Label>
              <Select value={importance} onValueChange={setImportance}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
              </Select>
           </div>
           <div className="space-y-2"><Label>Message Content</Label><Textarea rows={4} value={content} onChange={e => setContent(e.target.value)} required /></div>
        </div>
        <DialogFooter><Button onClick={() => { onSave({ title, content, importance }); setOpen(false); }}>Publish Notice</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventFormDialog({ onSave, isAIGenerating, onAIGenerate }: any) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [topic, setTopic] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New Event</Button></DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Add Temple Event</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
           <div className="flex gap-2 bg-primary/5 p-3 rounded-xl border border-primary/10">
              <Input placeholder="Enter event name for AI Wand..." value={topic} onChange={e => setTopic(e.target.value)} />
              <Button size="icon" onClick={() => onAIGenerate(topic, 'event', (t: string, c: string) => { setTitle(t); setDesc(c); })} disabled={isAIGenerating}>
                 {isAIGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </Button>
           </div>
           <div className="space-y-2"><Label>Event Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
           <div className="space-y-2"><Label>Date</Label><Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required /></div>
           <div className="space-y-2"><Label>Description</Label><Textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)} required /></div>
        </div>
        <DialogFooter><Button onClick={() => { onSave({ title, description: desc, date }); setOpen(false); }}>Save Event</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemberFormDialog({ onSave }: any) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [order, setOrder] = useState("0");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Add Member</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Committee Member</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
           <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
           <div className="space-y-2"><Label>Role</Label><Input value={role} onChange={e => setRole(e.target.value)} required placeholder="President, Secretary, etc." /></div>
           <div className="space-y-2"><Label>Display Order</Label><Input type="number" value={order} onChange={e => setOrder(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={() => { onSave({ name, role, displayOrder: parseInt(order) }); setOpen(false); }}>Add Member</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ManagementPageContent />
    </Suspense>
  );
}
