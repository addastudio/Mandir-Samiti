"use client";

import * as React from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, memo } from "react";
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
  Wand2,
  Clock,
  LayoutDashboard,
  Search,
  History,
  Palette,
  Mail,
  Camera,
  ImagePlus,
  Lock,
  UserCog,
  Upload,
  TrendingUp,
  UserCheck,
  Shield,
  Zap,
  Banknote,
  CheckCircle2,
  Check,
  Crown,
  CloudUpload
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
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, YAxis } from "recharts";
import Link from "next/link";
import { generateTempleContent } from "@/ai/flows/admin-ai-flow";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getBackendConnectionStatus, getPaymentGatewayStatus, getEmailServiceStatus, getRecaptchaStatus, sendManualEmail } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Memoized Trend Chart to prevent lagging during management panel interactions.
 */
const OverviewTrendChart = memo(({ data }: { data: any[] }) => {
  return (
    <ChartContainer 
      config={{ 
        amount: { label: "Donations", color: "hsl(var(--primary))" } 
      }} 
      className="h-full w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" x1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fontWeight: 500 }} 
            tickMargin={10}
          />
          <YAxis hide />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorAmount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});

OverviewTrendChart.displayName = "OverviewTrendChart";

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
  const [chartPeriod, setChartPeriod] = useState<"7" | "30">("7");

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
  const recentLogsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collection(firestore, "admin_activity_logs"), orderBy("timestamp", "desc"), limit(10)), [firestore, adminDoc]);
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
      toast({ title: "Administrative status updated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleUpdateUserRole = async (targetUserId: string, targetName: string, newRole: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "users", targetUserId), { role: newRole });
      await logAction("UPDATE_ROLE", "USER", `${targetName} -> ${newRole}`);
      toast({ title: "User role updated successfully" });
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

  // Optimized Chart Data Calculation
  const chartData = React.useMemo(() => {
    if (!allDonations) return [];
    const daysCount = parseInt(chartPeriod);
    const result = [];
    const now = new Date();
    
    // Create map for efficient lookup
    const dataMap = new Map();
    allDonations.forEach((d: any) => {
      const dateKey = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + (d.amount || 0));
    });

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      result.push({
        day: label,
        amount: dataMap.get(label) || 0
      });
    }

    return result;
  }, [allDonations, chartPeriod]);

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
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-primary border-primary/20">Golden State Operational</Badge>
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
                    <CardDescription className="text-[10px]">Financial performance visualization.</CardDescription>
                  </div>
                  <Select value={chartPeriod} onValueChange={(val: any) => setChartPeriod(val)}>
                    <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 Days</SelectItem>
                      <SelectItem value="30">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="pt-4 h-[300px]">
                  <OverviewTrendChart data={chartData} />
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
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Global Donation Records</h2>
                <ManualDonationFormDialog onSave={async (d: any) => { 
                  await addDoc(collection(firestore!, "donations"), d); 
                  await logAction("CREATE", "DONATION", `Manual: ${d.devoteeName} - ₹${d.amount}`); 
                  toast({ title: "Manual record saved successfully." });
                }} />
             </div>
             <Card>
               <Table>
                 <TableHeader><TableRow><TableHead>Devotee</TableHead><TableHead>Amount</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableHeader>
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

          <TabsContent value="members" className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Committee Structure</h2>
                <MemberFormDialog onSave={async (d: any) => { await addDoc(collection(firestore!, "mandir_samiti_members"), d); await logAction("CREATE", "MEMBER", d.name); }} />
             </div>
             <Card>
               <Table>
                 <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                 <TableBody>
                    {members?.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell className="w-12"><Input className="h-8 w-12 text-center text-xs" defaultValue={m.displayOrder} onBlur={async (e) => await updateDoc(doc(firestore!, "mandir_samiti_members", m.id), { displayOrder: parseInt(e.target.value) || 0 })} /></TableCell>
                        <TableCell className="font-bold">{m.name}</TableCell>
                        <TableCell><Badge variant="secondary">{m.role}</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete("mandir_samiti_members", m.id, m.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                 </TableBody>
               </Table>
             </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6 animate-in slide-in-from-bottom-2">
             <h2 className="text-xl font-bold">Administrative Access Control</h2>
             <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Assigned Role</TableHead><TableHead>Administrative Access</TableHead></TableRow></TableHeader>
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
                          <TableCell>
                            <Select defaultValue={u.role || "devotee"} onValueChange={(val) => handleUpdateUserRole(u.id, u.name, val)}>
                              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="devotee">Devotee</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="official">Official</SelectItem>
                                <SelectItem value="president">President</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                               <Badge variant={isAdmin ? "default" : "outline"} className={cn("gap-1", isAdmin ? "bg-primary" : "opacity-50")}>
                                 {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                 {isAdmin ? "Admin" : "Standard"}
                               </Badge>
                               <Button 
                                variant={isAdmin ? "destructive" : "outline"} 
                                size="sm" 
                                className="h-7 text-[10px] px-3 font-bold uppercase tracking-tighter"
                                onClick={() => handleToggleAdmin(u.id, u.name, !!isAdmin)}
                                disabled={u.id === user.uid}
                              >
                                {isAdmin ? "Revoke Admin" : "Grant Admin"}
                              </Button>
                            </div>
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
             <Card className="shadow-lg border-primary/5 overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />Official Email Messenger</CardTitle>
                  <CardDescription>Send notices directly to selected devotees. All emails are sent individually for privacy.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <BroadcastForm allUsers={allUsers || []} />
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

function BroadcastForm({ allUsers }: { allUsers: any[] }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set(allUsers.map(u => u.id)));
  const { toast } = useToast();
  const { language } = useLanguage();

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (uid: string) => {
    const next = new Set(selectedUids);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelectedUids(next);
  };

  const toggleAll = () => {
    if (selectedUids.size === allUsers.length) setSelectedUids(new Set());
    else setSelectedUids(new Set(allUsers.map(u => u.id)));
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = allUsers.filter(u => selectedUids.has(u.id)).map(u => u.email).filter(Boolean);
    if (emails.length === 0) {
      toast({ variant: "destructive", title: "No recipients", description: "Please select at least one devotee." });
      return;
    }
    setIsSending(true);
    try {
      const res = await sendManualEmail(emails, subject, message, language as 'hi' | 'en');
      if (res.success) {
        toast({ title: "Broadcast Execution Complete", description: res.message });
        setSubject("");
        setMessage("");
      } else throw new Error(res.message);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Broadcast Failed", description: err.message });
    } finally { setIsSending(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-4 border-r bg-muted/20 flex flex-col max-h-[600px]">
        <div className="p-4 border-b bg-white/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Recipients</h3>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={toggleAll}>
              {selectedUids.size === allUsers.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search devotees..." 
              className="h-9 pl-8 text-xs bg-white" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredUsers.map(u => (
              <div 
                key={u.id} 
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  selectedUids.has(u.id) ? "bg-primary/5 border border-primary/10" : "hover:bg-white/50 border border-transparent"
                )}
                onClick={() => toggleUser(u.id)}
              >
                <Checkbox checked={selectedUids.has(u.id)} className="h-4 w-4" />
                <Avatar className="h-7 w-7 border">
                  <AvatarImage src={u.photoURL} />
                  <AvatarFallback className="text-[10px] font-bold uppercase">{u.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold truncate leading-none mb-1">{u.name}</span>
                  <span className="text-[9px] text-muted-foreground truncate">{u.email}</span>
                </div>
                {u.role === 'president' && <Crown className="h-3 w-3 ml-auto text-amber-500 shrink-0" />}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t bg-white/80 text-center">
          <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
            {selectedUids.size} / {allUsers.length} Selected
          </p>
        </div>
      </div>

      <div className="lg:col-span-8 p-6 sm:p-8 bg-white">
        <form onSubmit={handleBroadcast} className="space-y-6">
           <div className="space-y-2">
             <Label className="text-xs font-bold uppercase opacity-60">Subject</Label>
             <Input 
               value={subject} 
               onChange={e => setSubject(e.target.value)} 
               placeholder="Official Temple Notice..." 
               required 
               className="h-12 border-primary/10 bg-secondary/10"
             />
           </div>
           <div className="space-y-2">
             <Label className="text-xs font-bold uppercase opacity-60">Message Content</Label>
             <Textarea 
               rows={10} 
               value={message} 
               onChange={e => setMessage(e.target.value)} 
               placeholder="Write your official announcement here..." 
               required 
               className="border-primary/10 bg-secondary/10 resize-none pt-4"
             />
           </div>
           <div className="flex items-center justify-between pt-4 border-t">
             <div className="flex items-center gap-2 text-green-600">
               <ShieldCheck className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Verified Delivery</span>
             </div>
             <Button type="submit" size="lg" className="h-14 px-10 font-bold shadow-xl shadow-primary/20" disabled={isSending || selectedUids.size === 0}>
               {isSending ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
                   Sending Individually...
                 </>
               ) : (
                 <>
                   <Mail className="h-4 w-4 mr-2" />
                   Execute Broadcast
                 </>
               )}
             </Button>
           </div>
        </form>
      </div>
    </div>
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
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Committee Member</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
           <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
           <div className="space-y-2"><Label>Role / Designation</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. President, Secretary" required /></div>
           <div className="space-y-2"><Label>Display Order</Label><Input type="number" value={order} onChange={e => setOrder(e.target.value)} /></div>
        </div>
        <DialogFooter><Button onClick={() => { onSave({ name, role, displayOrder: parseInt(order) || 0 }); setOpen(false); setName(""); setRole(""); }}>Save Member</Button></DialogFooter>
      </DialogContent>
    </Dialog>
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
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit for base64 storage
      toast({ variant: "destructive", title: "File too large", description: "Base64 storage requires images smaller than 1MB." });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUrl(reader.result as string);
      setUploading(false);
      toast({ title: "Image Prepared", description: "Image converted to base64 successfully." });
    };
    reader.onerror = () => {
      setUploading(false);
      toast({ variant: "destructive", title: "Read Failed" });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="gap-2"><ImagePlus className="h-4 w-4" />Add Media</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Media to Gallery</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label>Media Source</Label>
             <div className="grid grid-cols-1 gap-4">
               <div className="flex items-center gap-2">
                 <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="Enter external URL..." className="flex-1" />
               </div>
               <div className="relative">
                 <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                 <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Local Base64 Upload</span></div>
               </div>
               <div className="flex items-center justify-center border-2 border-dashed rounded-xl p-6 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => !uploading && document.getElementById('gal-upload')?.click()}>
                 <div className="text-center space-y-2">
                   {uploading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> : <Upload className="h-8 w-8 mx-auto text-muted-foreground" />}
                   <p className="text-xs font-bold">{uploading ? "Processing..." : "Select photo (Max 1MB)"}</p>
                 </div>
                 <input id="gal-upload" type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
               </div>
             </div>
           </div>
           {url && (
             <div className="aspect-video rounded-lg overflow-hidden border bg-black flex items-center justify-center">
               {url.includes('.mp4') || url.includes('.webm') || url.startsWith('data:video') ? (
                 <video src={url} className="max-h-full max-w-full" controls />
               ) : (
                 <img src={url} className="max-h-full max-w-full object-contain" alt="Preview" />
               )}
             </div>
           )}
           <div className="space-y-2"><Label>Caption</Label><Input value={caption} onChange={e => setCaption(e.target.value)} required /></div>
        </div>
        <DialogFooter><Button onClick={() => { onSave({ imageURL: url, caption }); setOpen(false); setUrl(""); setCaption(""); }} disabled={uploading || !url}>Add to Library</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManualDonationFormDialog({ onSave }: any) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Record Manual Donation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Manual Donation Entry
          </DialogTitle>
          <DialogDescription>Record a donation received offline (Cash, Cheque, or Offline UPI).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Devotee Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" required />
          </div>
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
          </div>
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI (Offline)</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full h-12 font-bold" onClick={() => { 
            if (!name || !amount) return;
            onSave({ 
              devoteeName: name, 
              amount: parseFloat(amount) || 0, 
              mode, 
              date: new Date(date).toISOString(),
              status: "completed"
            }); 
            setOpen(false); 
            setName(""); 
            setAmount(""); 
          }}>
            Save Contribution Record
          </Button>
        </DialogFooter>
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
