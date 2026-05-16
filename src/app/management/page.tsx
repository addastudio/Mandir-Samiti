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
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, setDoc, collectionGroup, where, limit } from "firebase/firestore";
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
  Search,
  History,
  Palette,
  Mail,
  Camera,
  ImagePlus,
  Lock,
  UserCog,
  Upload,
  TrendingUp
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
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { generateTempleContent } from "@/ai/flows/admin-ai-flow";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getBackendConnectionStatus, getPaymentGatewayStatus, getEmailServiceStatus, getRecaptchaStatus, sendManualEmail } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

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

  // Operations
  const noticesRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "notices"), orderBy("createdAt", "desc")), [firestore, adminDoc]);
  const eventsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "events"), orderBy("date", "desc")), [firestore, adminDoc]);
  const membersRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "mandir_samiti_members"), orderBy("displayOrder", "asc")), [firestore, adminDoc]);
  const requestsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "prayer_requests"), orderBy("createdAt", "desc")), [firestore, adminDoc]);
  const donationsGroupRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collectionGroup(firestore, "donations"), orderBy("date", "desc")), [firestore, adminDoc]);
  const logsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "admin_activity_logs"), orderBy("timestamp", "desc")), [firestore, adminDoc]);
  const recentLogsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "admin_activity_logs"), orderBy("timestamp", "desc"), limit(5)), [firestore, adminDoc]);
  const galleryRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "gallery"), [firestore, adminDoc]);
  const usersRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "users"), [firestore, adminDoc]);
  const rolesAdminRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "roles_admin"), [firestore, adminDoc]);

  const { data: notices } = useCollection(noticesRef);
  const { data: events } = useCollection(eventsRef);
  const { data: members } = useCollection(membersRef);
  const { data: requests } = useCollection(requestsRef);
  const { data: allDonations } = useCollection(donationsGroupRef);
  const { data: logs } = useCollection(logsRef);
  const { data: recentLogs } = useCollection(recentLogsRef);
  const { data: galleryItems } = useCollection(galleryRef);
  const { data: allUsers } = useCollection(usersRef);
  const { data: adminRoles } = useCollection(rolesAdminRef);

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

  const handleToggleAdmin = async (targetUserId: string, targetName: string, currentlyAdmin: boolean) => {
    if (!firestore || !user) return;
    if (targetUserId === user.uid) {
      toast({ variant: "destructive", title: "Action Forbidden", description: "You cannot remove your own admin access." });
      return;
    }

    const action = currentlyAdmin ? "REMOVE_ADMIN" : "GRANT_ADMIN";
    if (!confirm(`Are you sure you want to ${currentlyAdmin ? 'revoke' : 'grant'} admin access for ${targetName}?`)) return;

    try {
      if (currentlyAdmin) {
        await deleteDoc(doc(firestore, "roles_admin", targetUserId));
      } else {
        await setDoc(doc(firestore, "roles_admin", targetUserId), {
          assignedAt: new Date().toISOString(),
          assignedBy: user.uid
        });
      }
      await logAction(action, "ROLE", targetName);
      toast({ title: "Role Updated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleAIGenerate = async (topic: string, type: 'event' | 'notice', setFormValues: (title: string, content: string) => void) => {
    if (!topic) return;
    setIsAIGenerating(true);
    try {
      const result = await generateTempleContent({ topic, type, language: language as 'hi' | 'en' });
      setFormValues(result.title, result.content);
      toast({ title: "AI Generation Success" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "AI Error", description: err.message });
    } finally {
      setIsAIGenerating(false);
    }
  };

  // Chart Logic
  const chartData = React.useMemo(() => {
    if (!allDonations) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const dataMap = allDonations.reduce((acc: any, d: any) => {
      const day = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + (d.amount || 0);
      return acc;
    }, {});

    return last7Days.map(day => ({
      day,
      amount: dataMap[day] || 0
    }));
  }, [allDonations]);

  if (!mounted || isUserLoading || isAdminLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user || !adminDoc) return null;

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
                Mandir Management
              </h1>
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-primary border-primary/20">Operational Golden State</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
             <Link href="/admin"><Button variant="default" size="sm" className="gap-2 bg-accent text-accent-foreground"><Palette className="h-4 w-4" />Website Editor</Button></Link>
             <Link href="/dashboard"><Button variant="outline" size="sm" className="gap-2"><LayoutDashboard className="h-4 w-4" />Dashboard</Button></Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="w-full overflow-x-auto bg-muted/40 p-1 rounded-xl touch-scroll">
            <TabsList className="flex h-auto w-max justify-start gap-1 bg-transparent border-0 flex-nowrap">
              {[
                { value: 'overview', icon: BarChart3, label: 'Overview' },
                { value: 'notices', icon: Bell, label: 'Notices' },
                { value: 'events', icon: Calendar, label: 'Events' },
                { value: 'gallery', icon: Camera, label: 'Gallery' },
                { value: 'donations', icon: HandCoins, label: 'Donations' },
                { value: 'requests', icon: MessageSquare, label: 'Requests' },
                { value: 'members', icon: Users, label: 'Committee' },
                { value: 'access', icon: Lock, label: 'Access Control' },
                { value: 'broadcast', icon: Mail, label: 'Broadcast' },
                { value: 'logs', icon: History, label: 'Audit Logs' },
                { value: 'infrastructure', icon: Zap, label: 'Infrastructure' }
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
                { label: 'Total Collection', value: `₹${allDonations?.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString() || 0}`, color: 'bg-primary/10 border-primary/20', icon: HandCoins },
                { label: 'Pending Requests', value: requests?.filter(r => r.status === 'pending').length || 0, color: 'bg-green-50 border-green-200', icon: MessageSquare },
                { label: 'Active Events', value: events?.length || 0, color: 'bg-amber-50 border-amber-200', icon: Calendar },
                { label: 'Devotees', value: allUsers?.length || 0, color: 'bg-blue-50 border-blue-200', icon: Users }
              ].map((stat, i) => (
                <Card key={i} className={cn("relative overflow-hidden", stat.color)}>
                  <stat.icon className="absolute -right-2 -bottom-2 h-16 w-16 opacity-10 rotate-12" />
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">{stat.label}</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</div></CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-8 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Donation Trends</CardTitle>
                    <CardDescription className="text-[10px]">Financial performance over the last 7 days.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 h-[300px]">
                  <ChartContainer config={{ amount: { label: "Donations", color: "hsl(var(--primary))" } }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-4 shadow-md overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b">
                  <CardTitle className="text-sm font-bold flex items-center gap-2"><History className="h-4 w-4" />Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[300px] overflow-auto touch-scroll">
                    {recentLogs?.map(log => (
                      <div key={log.id} className="p-3 hover:bg-secondary/5 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-black uppercase text-primary">{log.actionType}</span>
                          <span className="text-[9px] text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs font-bold leading-tight line-clamp-1">{log.entityTitle}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">By: {log.adminName}</p>
                      </div>
                    ))}
                    {!recentLogs?.length && <div className="py-20 text-center text-muted-foreground text-xs italic">No recent activity</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notices" className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Temple Announcements</h2>
                <NoticeFormDialog onSave={async (d: any) => { await addDoc(collection(firestore!, "notices"), {...d, createdAt: new Date().toISOString()}); await logAction("CREATE", "NOTICE", d.title); }} isAIGenerating={isAIGenerating} onAIGenerate={handleAIGenerate} />
             </div>
             <Card>
               <Table>
                 <TableHeader><TableRow><TableHead>Notice</TableHead><TableHead>Priority</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {notices?.map((n: any) => (
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
                <EventFormDialog onSave={async (d: any) => { await addDoc(collection(firestore!, "events"), d); await logAction("CREATE", "EVENT", d.title); }} isAIGenerating={isAIGenerating} onAIGenerate={handleAIGenerate} />
             </div>
             <Card>
               <Table>
                 <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {events?.map((e: any) => (
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

          <TabsContent value="gallery" className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Media Library</h2>
                <GalleryFormDialog onSave={async (d: any) => { await addDoc(collection(firestore!, "gallery"), d); await logAction("CREATE", "GALLERY", d.caption || "Media Item"); }} />
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {galleryItems?.map((item: any) => (
                  <Card key={item.id} className="relative group overflow-hidden aspect-square">
                    <img src={item.imageURL} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                       <p className="text-[10px] text-white text-center mb-2 line-clamp-2">{item.caption}</p>
                       <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete("gallery", item.id, item.caption || "Media")}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
             <h2 className="text-xl font-bold">Global Donation Records</h2>
             <Card>
               <Table>
                 <TableHeader><TableRow><TableHead>Devotee</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {allDonations?.map((d: any) => (
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
                {requests?.map((r: any) => (
                  <Card key={r.id} className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                       <div><CardTitle className="text-base">{r.name}</CardTitle><CardDescription>{r.email || r.phone}</CardDescription></div>
                       <Select defaultValue={r.status} onValueChange={async (val) => await updateDoc(doc(firestore!, "prayer_requests", r.id), { status: val })}>
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

          <TabsContent value="access" className="space-y-6 animate-in slide-in-from-bottom-2">
             <h2 className="text-xl font-bold">Administrative Access Control</h2>
             <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {allUsers?.map((u: any) => {
                      const isAdmin = adminRoles?.some((r: any) => r.id === u.id);
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src={u.photoURL} /><AvatarFallback className="bg-primary/10 text-primary">{u.name?.charAt(0)}</AvatarFallback></Avatar>
                            <span className="font-bold text-sm">{u.name}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                          <TableCell>{isAdmin ? <Badge className="bg-primary">Administrator</Badge> : <Badge variant="outline">Devotee</Badge>}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant={isAdmin ? "destructive" : "default"} 
                              size="sm" 
                              className="h-8 gap-2"
                              onClick={() => handleToggleAdmin(u.id, u.name, !!isAdmin)}
                              disabled={u.id === user.uid}
                            >
                              <UserCog className="h-3 w-3" />
                              {isAdmin ? "Revoke Access" : "Grant Access"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
             </Card>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
             <h2 className="text-xl font-bold">Global Devotee Broadcast</h2>
             <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" />Official Email Messenger</CardTitle>
                  <CardDescription>Send notices directly to the registered devotee community.</CardDescription>
                </CardHeader>
                <CardContent>
                  <BroadcastForm allEmails={allUsers?.map((u: any) => u.email).filter(Boolean) || []} />
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
             <h2 className="text-xl font-bold">Detailed Audit Logs</h2>
             <Card className="max-h-[600px] overflow-auto touch-scroll">
                <Table>
                  <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Title</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {logs?.map((log: any) => (
                      <TableRow key={log.id} className="text-[10px] sm:text-xs">
                        <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="font-bold">{log.adminName}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[9px]">{log.actionType}</Badge></TableCell>
                        <TableCell className="uppercase opacity-60 font-black">{log.entityType}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{log.entityTitle}</TableCell>
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

function BroadcastForm({ allEmails }: { allEmails: string[] }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allEmails.length === 0) return;
    setIsSending(true);
    try {
      const res = await sendManualEmail(allEmails, subject, message, language as 'hi' | 'en');
      if (res.success) {
        toast({ title: "Broadcast Sent", description: `Delivered to ${allEmails.length} devotees.` });
        setSubject("");
        setMessage("");
      } else throw new Error(res.message);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Broadcast Failed", description: err.message });
    } finally { setIsSending(false); }
  };

  return (
    <form onSubmit={handleBroadcast} className="space-y-4">
       <div className="space-y-2"><Label>Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} required /></div>
       <div className="space-y-2"><Label>Message</Label><Textarea rows={6} value={message} onChange={e => setMessage(e.target.value)} required /></div>
       <div className="flex items-center justify-between pt-2">
         <p className="text-[10px] text-muted-foreground uppercase font-bold">Recipients: {allEmails.length} users</p>
         <Button type="submit" disabled={isSending || allEmails.length === 0}>
           {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
           Execute Broadcast
         </Button>
       </div>
    </form>
  );
}

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
              <Input placeholder="AI Wand topic..." value={topic} onChange={e => setTopic(e.target.value)} />
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
           <div className="space-y-2"><Label>Content</Label><Textarea rows={4} value={content} onChange={e => setContent(e.target.value)} required /></div>
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
              <Input placeholder="AI Wand topic..." value={topic} onChange={e => setTopic(e.target.value)} />
              <Button size="icon" onClick={() => onAIGenerate(topic, 'event', (t: string, c: string) => { setTitle(t); setDesc(c); })} disabled={isAIGenerating}>
                 {isAIGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </Button>
           </div>
           <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
           <div className="space-y-2"><Label>Date</Label><Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required /></div>
           <div className="space-y-2"><Label>Description</Label><Textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)} required /></div>
        </div>
        <DialogFooter><Button onClick={() => { onSave({ title, description: desc, date }); setOpen(false); }}>Save Event</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GalleryFormDialog({ onSave }: any) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUrl(reader.result as string);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><ImagePlus className="h-4 w-4" />Add Media</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload Media</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label>Media Source</Label>
             <div className="grid grid-cols-1 gap-4">
               <div className="flex items-center gap-2">
                 <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="Enter URL (YouTube or Image)..." className="flex-1" />
               </div>
               <div className="relative">
                 <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                 <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or Local Upload</span></div>
               </div>
               <div className="flex items-center justify-center border-2 border-dashed rounded-xl p-6 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => document.getElementById('gal-upload')?.click()}>
                 <div className="text-center space-y-2">
                   {uploading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> : <Upload className="h-8 w-8 mx-auto text-muted-foreground" />}
                   <p className="text-xs font-bold">Click to select photo</p>
                 </div>
                 <input id="gal-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
               </div>
             </div>
           </div>
           {url && (
             <div className="aspect-video rounded-lg overflow-hidden border bg-black flex items-center justify-center">
               <img src={url} className="max-h-full max-w-full object-contain" alt="Preview" />
             </div>
           )}
           <div className="space-y-2"><Label>Caption</Label><Input value={caption} onChange={e => setCaption(e.target.value)} required /></div>
        </div>
        <DialogFooter><Button onClick={() => { onSave({ imageURL: url, caption }); setOpen(false); setUrl(""); setCaption(""); }}>Add to Library</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ManagementPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ManagementPageContent />
    </Suspense>
  );
}
