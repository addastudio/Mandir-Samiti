
"use client";

import * as React from "react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, doc, collectionGroup, query, where, serverTimestamp, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
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
  Crown,
  Mail,
  User as UserIcon,
  Fingerprint,
  ListOrdered,
  Activity,
  TrendingUp,
  Upload,
  X,
  CreditCard,
  QrCode,
  Banknote,
  IndianRupee,
  FileDown
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
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, YAxis, Tooltip } from "recharts";
import { generateTempleContent } from "@/ai/flows/admin-ai-flow";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ManagementPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [userSearch, setUserSearch] = useState("");
  const [donationSearch, setDonationSearch] = useState("");
  const [userSort, setUserSort] = useState<string>("role");
  const [analyticsRange, setAnalyticsRange] = useState("7d");
  const [deleteConfirm, setDeleteConfirm] = useState<{ col: string, id: string, title: string, path?: string } | null>(null);
  const [roleConfirm, setRoleConfirm] = useState<{ userId: string, name: string, newRole: string, type: 'admin' | 'role' } | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");

  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [galleryImagePreview, setGalleryImagePreview] = useState<string | null>(null);
  const eventFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

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
    if (mounted && !isUserLoading && !isAdminLoading && !isProfileLoading) {
      if (!user) router.push("/login");
      else if (!adminDoc) router.push("/dashboard");
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, isProfileLoading, router, mounted]);

  const chartData = React.useMemo(() => {
    if (!mounted || !allDonations) return [];
    const now = new Date();
    if (analyticsRange === '1y') {
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const monthYear = d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', year: '2-digit' });
        const monthTotal = allDonations
          .filter(don => {
            const donDate = new Date(don.date);
            return donDate.getMonth() === d.getMonth() && donDate.getFullYear() === d.getFullYear();
          })
          .reduce((sum, don) => sum + (don.amount || 0), 0);
        return { date: monthYear, amount: monthTotal };
      });
    }
    const daysCount = analyticsRange === '30d' ? 30 : analyticsRange === '90d' ? 90 : 7;
    const days = Array.from({ length: daysCount }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (daysCount - 1 - i));
      return d.toISOString().split('T')[0];
    });
    return days.map(date => {
      const dayTotal = allDonations
        .filter(d => d.date?.split('T')[0] === date)
        .reduce((sum, d) => sum + (d.amount || 0), 0);
      return { 
        date: new Date(date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short' }), 
        amount: dayTotal 
      };
    });
  }, [allDonations, language, analyticsRange, mounted]);

  const totalRangeAmount = React.useMemo(() => chartData.reduce((acc, curr) => acc + curr.amount, 0), [chartData]);

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
    const ref = deleteConfirm.path ? doc(firestore, deleteConfirm.path) : doc(firestore, deleteConfirm.col, deleteConfirm.id);
    deleteDocumentNonBlocking(ref);
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

  const sortedUsers = React.useMemo(() => {
    if (!allUsers) return [];
    const filtered = allUsers.filter(u => 
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
    );
    return filtered.sort((a, b) => {
      if (userSort === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (userSort === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (userSort === 'role') {
        const roleWeights: Record<string, number> = { president: 4, official: 3, member: 2, devotee: 1 };
        const weightA = roleWeights[a.role as string] || 0;
        const weightB = roleWeights[b.role as string] || 0;
        if (weightA !== weightB) return weightB - weightA;
        return (a.name || '').localeCompare(b.name || '');
      }
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [allUsers, userSearch, userSort]);

  const filteredDonations = React.useMemo(() => {
    if (!allDonations) return [];
    return allDonations
      .filter(d => 
        (d.devoteeName || '').toLowerCase().includes(donationSearch.toLowerCase()) ||
        (d.amount || '').toString().includes(donationSearch) ||
        (d.mode || '').toLowerCase().includes(donationSearch.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allDonations, donationSearch]);

  const getActionDetails = (type: string) => {
    switch (type) {
      case 'CREATE': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Plus };
      case 'DELETE': return { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Trash2 };
      case 'UPDATE': return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 };
      case 'GRANT_ADMIN': return { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Crown };
      case 'REMOVE_ADMIN': return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: UserMinus };
      case 'UPDATE_ROLE': return { color: 'bg-violet-50 text-indigo-700 border-violet-200', icon: UserCog };
      default: return { color: 'bg-slate-50 text-slate-700 border-slate-200', icon: History };
    }
  };

  if (!mounted || isUserLoading || isAdminLoading || isProfileLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalDonationsCount = allDonations?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  const isLeadership = userProfile?.role === 'president' || userProfile?.role === 'official';

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
            {isLeadership && (
              <Link href="/admin" className="flex-1 sm:flex-initial">
                <Button variant="secondary" size="sm" className="w-full gap-2 text-xs sm:text-sm">
                  <Settings className="h-4 w-4" />
                  <span className="hidden xs:inline">{language === 'hi' ? 'CMS एडिटर' : 'CMS Editor'}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="w-full overflow-x-auto bg-muted/40 p-1 rounded-xl touch-scroll">
            <TabsList className="flex h-auto w-max justify-start gap-1 bg-transparent border-0 flex-nowrap">
              {[
                { value: 'overview', icon: BarChart3, label: language === 'hi' ? 'सारांश' : 'Overview' },
                { value: 'donations', icon: HandCoins, label: language === 'hi' ? 'दान' : 'Donations' },
                { value: 'events', icon: Calendar, label: language === 'hi' ? 'कार्यक्रम' : 'Events' },
                { value: 'notices', icon: Bell, label: language === 'hi' ? 'सूचना' : 'Notices' },
                { value: 'gallery', icon: ImageIcon, label: language === 'hi' ? 'गैलरी' : 'Gallery' },
                { value: 'requests', icon: MessageSquare, label: language === 'hi' ? 'निवेदन' : 'Requests' },
                { value: 'members', icon: Users, label: language === 'hi' ? 'समिति' : 'Committee' },
                { value: 'users', icon: UserCog, label: language === 'hi' ? 'भक्त प्रबंधन' : 'Roles' },
                { value: 'logs', icon: Activity, label: language === 'hi' ? 'लॉग्स' : 'Logs' }
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
                { label: t.mgmtStatTotalCollection, value: `₹${totalDonationsCount.toLocaleString()}`, color: 'bg-primary/10 border-primary/20', icon: HandCoins },
                { label: t.mgmtStatPendingRequests, value: requests?.filter(r => r.status === 'pending').length || 0, color: 'bg-green-50 border-green-200', icon: MessageSquare },
                { label: t.mgmtStatActiveEvents, value: events?.length || 0, color: 'bg-amber-50 border-amber-200', icon: Calendar },
                { label: t.mgmtStatTotalDevotees, value: allUsers?.length || 0, color: 'bg-blue-50 border-blue-200', icon: Users }
              ].map((stat, i) => (
                <Card key={i} className={cn("relative overflow-hidden group transition-all hover:shadow-md", stat.color)}>
                  <stat.icon className="absolute -right-2 -bottom-2 h-16 w-16 opacity-10 rotate-12 transition-transform group-hover:scale-110" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest opacity-70">{stat.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <Card className="shadow-md border-primary/10 overflow-hidden">
                  <CardHeader className="bg-white border-b py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          {language === 'hi' ? 'दान विश्लेषण' : 'Donation Trends'}
                        </CardTitle>
                        <CardDescription className="text-xs">{language === 'hi' ? 'चयनित अवधि का योगदान' : 'Contributions for selected period'}</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select value={analyticsRange} onValueChange={setAnalyticsRange}>
                          <SelectTrigger className="w-32 h-8 text-[10px] font-black uppercase tracking-wider border-primary/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="7d" className="text-[10px] font-bold uppercase">{language === 'hi' ? '७ दिन' : '7 Days'}</SelectItem>
                            <SelectItem value="30d" className="text-[10px] font-bold uppercase">{language === 'hi' ? '३० दिन' : '30 Days'}</SelectItem>
                            <SelectItem value="90d" className="text-[10px] font-bold uppercase">{language === 'hi' ? '९० दिन' : '90 Days'}</SelectItem>
                            <SelectItem value="1y" className="text-[10px] font-bold uppercase">{language === 'hi' ? '१ साल' : '1 Year'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} dy={10} minTickGap={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} width={40} />
                        <Tooltip />
                        <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-4">
                 <Card className="shadow-md border-primary/10 h-full flex flex-col overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      {language === 'hi' ? 'सिस्टम फीड' : 'Live Feed'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-y-auto">
                    <div className="divide-y divide-primary/5">
                      {logs?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10).map((log: any) => {
                        const details = getActionDetails(log.actionType);
                        const ActionIcon = details.icon;
                        return (
                          <div key={log.id} className="p-4 hover:bg-muted/10 transition-colors group">
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg shrink-0", details.color)}>
                                <ActionIcon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate">{log.entityTitle}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">{log.adminName}</span>
                                  <span className="text-[9px] text-muted-foreground opacity-60 flex items-center gap-1"><Clock className="h-2 w-2" />{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg">Record Manual Donation</CardTitle>
                    <CardDescription className="text-xs">Add cash or direct bank transfers received at the temple.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const amount = Number(fd.get('amount'));
                      const devoteeName = fd.get('devoteeName') as string;
                      const mode = fd.get('mode') as string;
                      const date = (fd.get('date') as string) || new Date().toISOString();

                      const manualRef = collection(firestore!, "donations");
                      addDoc(manualRef, {
                        amount,
                        devoteeName,
                        mode,
                        date,
                        status: 'completed',
                        isManual: true
                      });

                      logActivity('CREATE', 'donations', `Manual Donation: ₹${amount} from ${devoteeName}`);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Donation Recorded" });
                    }} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Devotee Name</Label>
                        <Input name="devoteeName" placeholder="Full Name" required className="bg-secondary/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Amount (₹)</Label>
                        <Input name="amount" type="number" placeholder="501" required className="bg-secondary/30" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Payment Mode</Label>
                        <Select name="mode" defaultValue="Cash">
                          <SelectTrigger className="bg-secondary/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="UPI (Manual)">Direct UPI</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase opacity-60">Date</Label>
                        <Input name="date" type="datetime-local" className="bg-secondary/30" />
                      </div>
                      <Button className="w-full shadow-lg gap-2">
                        <CheckCircle className="h-4 w-4" /> Save Record
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <Card className="shadow-xl border-primary/10 overflow-hidden">
                  <CardHeader className="flex flex-col sm:flex-row items-center justify-between py-6 px-6 bg-white border-b gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-primary" />
                        Donation Ledger
                      </CardTitle>
                      <CardDescription className="text-xs uppercase tracking-widest font-semibold opacity-60">Complete contribution history</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search..." 
                          className="pl-10 h-10 text-sm bg-secondary/10" 
                          value={donationSearch} 
                          onChange={(e) => setInpu(e.target.value)} 
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="text-[10px] uppercase font-black pl-6">Devotee</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-center">Amount</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-center">Mode</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-right pr-6">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDonations.map(d => (
                          <TableRow key={d.id} className="hover:bg-primary/5">
                            <TableCell className="pl-6 py-4">
                              <span className="font-bold text-sm">{d.devoteeName || 'Devotee'}</span>
                            </TableCell>
                            <TableCell className="text-center font-black text-primary">₹{d.amount}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-[9px] uppercase">
                                {d.mode}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Badge className={cn(
                                "text-[9px] font-black uppercase",
                                d.status === 'completed' ? "bg-emerald-500" : "bg-amber-500"
                              )}>
                                {d.status}
                              </Badge>
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
          {/* ... Rest of tabs remain as defined in project code ... */}
        </Tabs>
      </main>

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
