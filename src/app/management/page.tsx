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
import { collection, doc, collectionGroup, query, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { 
  Trash2, 
  Loader2, 
  Calendar, 
  Image as ImageIcon, 
  ShieldAlert, 
  Users, 
  Bell, 
  Globe, 
  MessageSquare, 
  CheckCircle2, 
  ShieldCheck, 
  Plus,
  Search, 
  BarChart3, 
  HandCoins, 
  Clock,
  AlertTriangle,
  Wand2,
  CheckCircle,
  Settings,
  History,
  UserPlus,
  UserCog,
  UserMinus,
  Crown,
  User as UserIcon,
  Activity,
  TrendingUp,
  IndianRupee,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [roleConfirm, setRoleConfirm] = useState<{ userId: string, name: string, newRole: string, type: 'admin' | 'role' | 'resign' } | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");

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

  const logActivity = async (action: string, entityType: string, title: string) => {
    if (!firestore || !user) return;
    try {
      await addDoc(collection(firestore, "admin_activity_logs"), {
        adminId: user.uid,
        adminName: user.displayName || user.email,
        actionType: action,
        entityType,
        entityTitle: title,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Audit log failed:", e);
    }
  };

  const handleAiGenerate = async (type: 'event' | 'notice', formRef: HTMLFormElement) => {
    if (!aiTopic) {
      toast({ variant: "destructive", title: "Topic Required", description: "Please enter a keyword or topic first." });
      return;
    }
    setIsAiGenerating(true);
    try {
      const result = await generateTempleContent({ topic: aiTopic, type, language: language as 'hi' | 'en' });
      const titleInput = formRef.querySelector('[name="title"]') as HTMLInputElement;
      const contentTextarea = formRef.querySelector('[name="content"]') as HTMLTextAreaElement;
      const descTextarea = formRef.querySelector('[name="description"]') as HTMLTextAreaElement;
      
      if (titleInput) titleInput.value = result.title;
      if (contentTextarea) contentTextarea.value = result.content;
      if (descTextarea) descTextarea.value = result.content;
      
      toast({ title: "AI Generation Success", description: "Content has been drafted below." });
    } catch (err) {
      toast({ variant: "destructive", title: "AI Generation Failed" });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const confirmDelete = async () => {
    if (!firestore || !deleteConfirm) return;
    const { col, id, title, path } = deleteConfirm;
    const ref = path ? doc(firestore, path) : doc(firestore, col, id);
    
    await logActivity('DELETE', col, title);
    await deleteDoc(ref);
    
    toast({ title: "Deleted Successfully" });
    setDeleteConfirm(null);
  };

  const handleRoleAction = async () => {
    if (!firestore || !roleConfirm || !user) return;
    const { userId, name, newRole, type } = roleConfirm;

    try {
      if (type === 'resign') {
        if (allAdmins && allAdmins.length <= 1) {
          toast({ variant: "destructive", title: "Action Denied", description: "Cannot resign as you are the last administrator." });
          return;
        }
        await logActivity('RESIGN', 'roles_admin', name);
        await deleteDoc(doc(firestore, "roles_admin", userId));
        toast({ title: "You have resigned as administrator" });
        router.push("/dashboard");
        return;
      }

      if (type === 'admin') {
        const isAdminNow = allAdmins?.some(a => a.id === userId);
        if (isAdminNow) {
          if (userId === user.uid) {
            toast({ variant: "destructive", title: "Use Resignation", description: "Please use the 'Resign' button to remove your own access." });
            return;
          }
          await logActivity('REMOVE_ADMIN', 'roles_admin', name);
          await deleteDoc(doc(firestore, "roles_admin", userId));
          toast({ title: "Admin Access Removed" });
        } else {
          await logActivity('GRANT_ADMIN', 'roles_admin', name);
          await setDoc(doc(firestore, "roles_admin", userId), { assignedAt: new Date().toISOString() });
          toast({ title: "Admin Access Granted" });
        }
      } else {
        await logActivity('UPDATE_ROLE', 'users', `${name} -> ${newRole}`);
        await updateDoc(doc(firestore, "users", userId), { role: newRole });
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
      case 'RESIGN': return { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: LogOut };
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
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-destructive hover:bg-destructive/10"
              onClick={() => setRoleConfirm({ userId: user!.uid, name: user!.displayName || user!.email || 'Me', newRole: '', type: 'resign' })}
            >
              <LogOut className="h-4 w-4" />
              {language === 'hi' ? 'इस्तीफा दें' : 'Resign as Admin'}
            </Button>
            <Link href="/" className="flex-1 sm:flex-initial">
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs sm:text-sm">
                <Globe className="h-4 w-4" />
                <span className="hidden xs:inline">{language === 'hi' ? 'वेबसाइट' : 'Website'}</span>
              </Button>
            </Link>
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
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const amount = Number(fd.get('amount'));
                      const devoteeName = fd.get('devoteeName') as string;
                      const manualRef = collection(firestore!, "donations");
                      await addDoc(manualRef, {
                        amount,
                        devoteeName,
                        mode: fd.get('mode') as string,
                        date: (fd.get('date') as string) || new Date().toISOString(),
                        status: 'completed'
                      });
                      await logActivity('CREATE', 'donations', `Manual: ₹${amount} from ${devoteeName}`);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Donation Recorded" });
                    }} className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold opacity-60">Devotee Name</Label>
                        <Input name="devoteeName" placeholder="Full Name" required className="bg-secondary/30" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold opacity-60">Amount (₹)</Label>
                        <Input name="amount" type="number" required className="bg-secondary/30" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold opacity-60">Payment Mode</Label>
                        <Select name="mode" defaultValue="Cash">
                          <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="UPI (Manual)">Direct UPI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold opacity-60">Date</Label>
                        <Input name="date" type="datetime-local" className="bg-secondary/30" />
                      </div>
                      <Button className="w-full shadow-lg gap-2">Save Record</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <Card className="shadow-xl border-primary/10 overflow-hidden">
                  <CardHeader className="bg-white border-b py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <IndianRupee className="h-5 w-5 text-primary" />
                      Donation Ledger
                    </CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search..." 
                        className="pl-10 h-10" 
                        value={donationSearch} 
                        onChange={(e) => setDonationSearch(e.target.value)} 
                      />
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
                            <TableCell className="pl-6 py-4 font-bold text-sm">{d.devoteeName || 'Devotee'}</TableCell>
                            <TableCell className="text-center font-black text-primary">₹{d.amount}</TableCell>
                            <TableCell className="text-center"><Badge variant="outline">{d.mode}</Badge></TableCell>
                            <TableCell className="text-right pr-6"><Badge className={d.status === 'completed' ? "bg-emerald-500" : "bg-amber-500"}>{d.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg">Add New Event</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-dashed border-primary/20">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">AI Content Drafter</Label>
                      <div className="flex gap-2">
                        <Input placeholder="e.g. Holi 2025" className="h-9 text-xs" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
                        <Button size="sm" variant="secondary" className="shrink-0 h-9 gap-2" disabled={isAiGenerating} onClick={(e) => handleAiGenerate('event', (e.currentTarget.closest('form') || document.getElementById('event-form')) as HTMLFormElement)}>
                          {isAiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Draft
                        </Button>
                      </div>
                    </div>
                    <form id="event-form" onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const data = {
                        title: fd.get('title') as string,
                        description: fd.get('description') as string,
                        date: fd.get('date') as string,
                        image: fd.get('image') as string,
                        createdAt: new Date().toISOString()
                      };
                      await addDoc(eventsRef!, data);
                      await logActivity('CREATE', 'events', data.title);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Event Published" });
                    }} className="space-y-4">
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Title</Label><Input name="title" required className="bg-secondary/30" /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Date</Label><Input name="date" type="datetime-local" required className="bg-secondary/30" /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Description</Label><Textarea name="description" rows={4} className="bg-secondary/30" /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Image URL</Label><Input name="image" className="bg-secondary/30" /></div>
                      <Button className="w-full shadow-lg gap-2"><Calendar className="h-4 w-4" /> Publish Event</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {events?.map(event => (
                    <Card key={event.id} className="overflow-hidden">
                      <div className="flex items-stretch h-32">
                        <div className="w-24 shrink-0 bg-muted">{event.image && <img src={event.image} className="h-full w-full object-cover" />}</div>
                        <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
                          <h4 className="font-bold text-sm truncate">{event.title}</h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{event.description}</p>
                          <Button variant="ghost" size="sm" className="h-7 w-fit text-destructive text-[10px]" onClick={() => setDeleteConfirm({ col: 'events', id: event.id, title: event.title })}>Remove</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notices" className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg">Post Official Notice</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-dashed border-primary/20">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">AI Drafter</Label>
                      <div className="flex gap-2">
                        <Input placeholder="e.g. Schedule change" className="h-9 text-xs" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
                        <Button size="sm" variant="secondary" className="shrink-0 h-9 gap-2" disabled={isAiGenerating} onClick={(e) => handleAiGenerate('notice', (e.currentTarget.closest('form') || document.getElementById('notice-form')) as HTMLFormElement)}>
                          {isAiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Draft
                        </Button>
                      </div>
                    </div>
                    <form id="notice-form" onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const data = {
                        title: fd.get('title') as string,
                        content: fd.get('content') as string,
                        importance: fd.get('importance') as string,
                        createdAt: new Date().toISOString()
                      };
                      await addDoc(noticesRef!, data);
                      await logActivity('CREATE', 'notices', data.title);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Notice Posted" });
                    }} className="space-y-4">
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Headline</Label><Input name="title" required className="bg-secondary/30" /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Priority</Label>
                        <Select name="importance" defaultValue="normal">
                          <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Content</Label><Textarea name="content" rows={5} className="bg-secondary/30" /></div>
                      <Button className="w-full shadow-lg gap-2"><Bell className="h-4 w-4" /> Broadcast Notice</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <div className="space-y-4">
                  {notices?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(notice => (
                    <Card key={notice.id} className={cn("border-l-4", notice.importance === 'urgent' ? 'border-l-destructive' : 'border-l-primary')}>
                      <div className="p-4 flex justify-between">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm truncate">{notice.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{notice.content}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ col: 'notices', id: notice.id, title: notice.title })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5"><CardTitle className="text-lg">Add Media</CardTitle></CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const data = {
                        caption: fd.get('caption') as string,
                        imageURL: fd.get('url') as string,
                        createdAt: new Date().toISOString()
                      };
                      await addDoc(galleryRef!, data);
                      await logActivity('CREATE', 'gallery', data.caption);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Media Added" });
                    }} className="space-y-4">
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Caption</Label><Input name="caption" required className="bg-secondary/30" /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">URL</Label><Input name="url" placeholder="Image or YouTube" required className="bg-secondary/30" /></div>
                      <Button className="w-full shadow-lg"><Plus className="h-4 w-4 mr-2" /> Add Media</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {gallery?.map(item => (
                    <div key={item.id} className="group relative aspect-[4/3] bg-muted rounded-xl overflow-hidden">
                      <img src={item.imageURL} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-2">
                        <Button variant="destructive" size="icon" className="h-7 w-7 ml-auto" onClick={() => setDeleteConfirm({ col: 'gallery', id: item.id, title: item.caption })}><Trash2 className="h-4 w-4" /></Button>
                        <p className="text-[9px] text-white truncate text-center">{item.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6 animate-in fade-in duration-300">
            <Card className="shadow-xl border-primary/10 overflow-hidden">
              <CardHeader className="bg-white border-b py-4"><CardTitle className="text-xl font-bold">Devotee Requests</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-black pl-6">Devotee</TableHead>
                      <TableHead className="text-[10px] uppercase font-black">Type</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-center">Status</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(req => (
                      <TableRow key={req.id} className="hover:bg-primary/5">
                        <TableCell className="pl-6"><div className="flex flex-col"><span className="font-bold text-sm">{req.name}</span><span className="text-[10px] text-muted-foreground">{req.phone || req.email}</span></div></TableCell>
                        <TableCell><Badge variant="outline">{req.requestType}</Badge></TableCell>
                        <TableCell className="text-center">
                          <Select defaultValue={req.status} onValueChange={async (val) => {
                            await logActivity('UPDATE', 'prayer_requests', `Status ${req.name}: ${val}`);
                            await updateDoc(doc(firestore!, "prayer_requests", req.id), { status: val });
                            toast({ title: "Status Updated" });
                          }}>
                            <SelectTrigger className="h-7 w-28 text-[9px] font-black uppercase border-0 bg-secondary/50"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="viewed">Viewed</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ col: 'prayer_requests', id: req.id, title: `Request: ${req.name}` })}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="shadow-md border-primary/10">
                  <CardHeader className="bg-primary/5"><CardTitle className="text-lg">Add Samiti Member</CardTitle></CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const data = { name: fd.get('name') as string, role: fd.get('role') as string, displayOrder: Number(fd.get('order')), createdAt: new Date().toISOString() };
                      await addDoc(membersRef!, data);
                      await logActivity('CREATE', 'mandir_samiti_members', data.name);
                      (e.target as HTMLFormElement).reset();
                      toast({ title: "Member Added" });
                    }} className="space-y-4">
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Full Name</Label><Input name="name" required className="bg-secondary/30" /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Role</Label><Input name="role" required className="bg-secondary/30" /></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold opacity-60">Order</Label><Input name="order" type="number" defaultValue={0} className="bg-secondary/30" /></div>
                      <Button className="w-full shadow-lg"><UserPlus className="h-4 w-4 mr-2" /> Save Member</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {members?.sort((a,b) => a.displayOrder - b.displayOrder).map(member => (
                    <Card key={member.id} className="p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center text-primary font-bold">{member.name.charAt(0)}</div>
                        <div><h4 className="font-bold text-sm">{member.name}</h4><p className="text-[10px] text-primary uppercase font-black">{member.role}</p></div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => setDeleteConfirm({ col: 'mandir_samiti_members', id: member.id, title: member.name })}><Trash2 className="h-4 w-4" /></Button>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 animate-in fade-in duration-300">
             <Card className="shadow-xl border-primary/10 overflow-hidden">
               <CardHeader className="bg-white border-b py-6 px-6 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" />Devotee Management</CardTitle>
                    <CardDescription className="text-xs uppercase tracking-widest font-semibold opacity-60">Control roles and system access</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search devotees..." className="pl-10 h-10" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                    </div>
                  </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-black pl-6">Profile</TableHead>
                      <TableHead className="text-[10px] uppercase font-black">Official Role</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-center">System Access</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-right pr-6">Member ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map(u => {
                      const isAdminNow = allAdmins?.some(a => a.id === u.id);
                      const isMe = u.id === user?.uid;
                      return (
                        <TableRow key={u.id} className="hover:bg-primary/5">
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                                {u.photoURL ? <img src={u.photoURL} /> : u.name?.charAt(0) || <UserIcon className="h-4 w-4 opacity-30" />}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm truncate">{u.name || 'Devotee'} {isMe && <Badge className="ml-1 bg-primary/20 text-primary border-0 h-4 text-[8px]">YOU</Badge>}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{u.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={u.role || 'devotee'} 
                              onValueChange={(val) => setRoleConfirm({ userId: u.id, name: u.name, newRole: val, type: 'role' })}
                            >
                              <SelectTrigger className="h-8 w-32 text-[10px] font-black uppercase bg-secondary/50 border-0"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="devotee">Devotee</SelectItem>
                                <SelectItem value="member">Samiti Member</SelectItem>
                                <SelectItem value="official">Temple Official</SelectItem>
                                <SelectItem value="president">Samiti President</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center">
                            {isMe ? (
                              <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-black uppercase gap-2 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setRoleConfirm({ userId: user!.uid, name: user!.displayName || user!.email || 'Me', newRole: '', type: 'resign' })}>
                                <LogOut className="h-3 w-3" /> Resign
                              </Button>
                            ) : (
                              <Button 
                                variant={isAdminNow ? "default" : "outline"} 
                                size="sm" 
                                className={cn("h-8 px-4 text-[10px] font-black uppercase gap-2", isAdminNow ? "bg-primary" : "border-primary/20 text-primary")}
                                onClick={() => setRoleConfirm({ userId: u.id, name: u.name, newRole: '', type: 'admin' })}
                              >
                                {isAdminNow ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                                {isAdminNow ? 'Admin' : 'Grant Admin'}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6"><span className="text-[9px] font-mono text-muted-foreground opacity-40 uppercase">{u.id.slice(0, 12)}</span></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6 animate-in fade-in duration-300">
             <Card className="shadow-xl border-primary/10 overflow-hidden">
               <CardHeader className="bg-white border-b py-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Administrative Logs</CardTitle>
                <CardDescription className="text-xs">Security audit trail of system modifications</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-black pl-6">Admin</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-center">Action</TableHead>
                      <TableHead className="text-[10px] uppercase font-black">Target Entity</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-right pr-6">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => {
                      const details = getActionDetails(log.actionType);
                      const ActionIcon = details.icon;
                      return (
                        <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="pl-6 py-4"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center"><UserIcon className="h-4 w-4 text-muted-foreground" /></div><div className="flex flex-col"><span className="font-bold text-xs">{log.adminName}</span><span className="text-[9px] text-muted-foreground uppercase">{log.adminId.slice(0, 6)}</span></div></div></TableCell>
                          <TableCell className="text-center"><div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider", details.color)}><ActionIcon className="h-3 w-3" />{log.actionType.replace('_', ' ')}</div></TableCell>
                          <TableCell><div className="flex flex-col"><span className="text-[10px] font-black uppercase text-primary tracking-tighter">{log.entityType}</span><span className="text-xs font-medium line-clamp-1">{log.entityTitle}</span></div></TableCell>
                          <TableCell className="text-right pr-6"><div className="flex flex-col items-end"><span className="text-xs font-bold">{new Date(log.timestamp).toLocaleDateString()}</span><span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span></div></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5" /> Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">Are you sure you want to remove "{deleteConfirm?.title}" from {deleteConfirm?.col}? This action is permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 shadow-lg">Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!roleConfirm} onOpenChange={(o) => !o && setRoleConfirm(null)}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-primary h-5 w-5" /> Confirm Access Change</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {roleConfirm?.type === 'resign' 
                ? "Are you sure you want to resign your administrator status? You will lose access to this panel immediately." 
                : roleConfirm?.type === 'admin' 
                  ? `Are you sure you want to toggle Global Admin permissions for ${roleConfirm.name}?` 
                  : `Are you sure you want to change ${roleConfirm?.name}'s official role to "${roleConfirm?.newRole}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleAction} className="bg-primary hover:bg-primary/90 shadow-lg">Confirm Update</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
