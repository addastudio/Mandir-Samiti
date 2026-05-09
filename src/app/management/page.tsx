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
  Crown,
  Mail,
  User as UserIcon,
  Fingerprint,
  ListOrdered,
  ArrowDownAZ,
  Activity,
  TrendingUp,
  ArrowUpRight,
  Target
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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, Bar, BarChart, YAxis, Tooltip } from "recharts";
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
  const [userSort, setUserSort] = useState<string>("role");
  const [donationSearch, setDonationSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ col: string, id: string, title: string } | null>(null);
  const [roleConfirm, setRoleConfirm] = useState<{ userId: string, name: string, newRole: string, type: 'admin' | 'role' } | null>(null);
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

  // Analytics Data Processing
  const chartData = React.useMemo(() => {
    if (!allDonations) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayTotal = allDonations
        .filter(d => d.date?.split('T')[0] === date)
        .reduce((sum, d) => sum + (d.amount || 0), 0);
      return { 
        date: new Date(date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short' }), 
        amount: dayTotal 
      };
    });
  }, [allDonations, language]);

  const roleStats = React.useMemo(() => {
    if (!allUsers) return [];
    const counts: Record<string, number> = {
      president: 0,
      official: 0,
      member: 0,
      devotee: 0
    };
    allUsers.forEach(u => {
      const role = (u.role || 'devotee') as string;
      if (counts.hasOwnProperty(role)) counts[role]++;
    });
    return Object.entries(counts).map(([role, count]) => ({ 
      role: role.charAt(0).toUpperCase() + role.slice(1), 
      count 
    }));
  }, [allUsers]);

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
      if (userSort === 'recent') {
        return (b.id || '').localeCompare(a.id || '');
      }
      return 0;
    });
  }, [allUsers, userSearch, userSort]);

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

  const totalDonations = allDonations?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
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
                { label: t.mgmtStatTotalCollection, value: `₹${totalDonations.toLocaleString()}`, color: 'bg-primary/10 border-primary/20', icon: HandCoins },
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
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          {language === 'hi' ? 'दान विश्लेषण' : 'Donation Trends'}
                        </CardTitle>
                        <CardDescription className="text-xs">{language === 'hi' ? 'पिछले ७ दिनों का योगदान' : 'Last 7 days of contributions'}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">₹{chartData.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} Total (7d)</Badge>
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
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700 }}
                          width={40}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border shadow-xl rounded-lg border-primary/10">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground">{payload[0].payload.date}</p>
                                  <p className="text-sm font-black text-primary">₹{payload[0].value?.toLocaleString()}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorAmount)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-md border-primary/10 overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b py-3 px-5">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        {language === 'hi' ? 'भक्तों का विभाजन' : 'Role Distribution'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roleStats} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="role" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700 }} 
                            width={70}
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-2 border shadow-lg rounded border-primary/10">
                                    <p className="text-xs font-bold">{payload[0].value} {payload[0].payload.role}s</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-md border-primary/10 bg-gradient-to-br from-white to-primary/5">
                    <CardHeader className="py-3 px-5 border-b bg-white">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        {language === 'hi' ? 'त्वरित नेविगेशन' : 'Quick Access'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 gap-3">
                      {[
                        { label: language === 'hi' ? 'सूचना पोस्ट करें' : 'Post Notice', icon: Bell, tab: 'notices', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                        { label: language === 'hi' ? 'दान जोड़ें' : 'Add Donation', icon: Plus, tab: 'donations', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                        { label: language === 'hi' ? 'भक्त प्रबंधन' : 'Manage Roles', icon: UserCog, tab: 'users', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                        { label: language === 'hi' ? 'इवेंट शेड्यूल' : 'Add Event', icon: Calendar, tab: 'events', color: 'text-primary bg-primary/5 border-primary/10' }
                      ].map((action, i) => (
                        <Button 
                          key={i} 
                          variant="outline" 
                          className={cn("h-auto py-3 px-3 flex flex-col items-center gap-2 text-center transition-all hover:scale-[1.03] shadow-sm", action.color)}
                          onClick={() => setActiveTab(action.tab)}
                        >
                          <action.icon className="h-5 w-5" />
                          <span className="text-[10px] font-black uppercase leading-none">{action.label}</span>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <Card className="shadow-md border-primary/10 h-full flex flex-col overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        {language === 'hi' ? 'सिस्टम फीड' : 'Live Feed'}
                      </CardTitle>
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    </div>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">{language === 'hi' ? 'नवीनतम गतिविधियां' : 'Latest events'}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-y-auto">
                    <div className="divide-y divide-primary/5">
                      {logs?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8).map((log: any) => {
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
                                  <span className="text-[9px] text-muted-foreground opacity-60 flex items-center gap-1">
                                    <Clock className="h-2 w-2" />
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {requests?.filter(r => r.status === 'pending').slice(0, 3).map((r: any) => (
                        <div key={r.id} className="p-4 bg-green-50/50 hover:bg-green-100/50 transition-colors border-l-4 border-l-green-500">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className="bg-green-600 text-[8px] h-4 uppercase">New Request</Badge>
                            <span className="text-[9px] opacity-60">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs font-bold">{r.name} - {r.requestType}</p>
                          <Button variant="link" className="p-0 h-auto text-[10px] font-bold text-green-700 mt-1" onClick={() => setActiveTab('requests')}>
                            {language === 'hi' ? 'अभी देखें' : 'View Request'} <ArrowUpRight className="h-2 w-2" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <div className="p-4 border-t bg-muted/5">
                    <Button variant="ghost" className="w-full h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary" onClick={() => setActiveTab('logs')}>
                      {language === 'hi' ? 'सभी लॉग्स देखें' : 'View All Logs'}
                    </Button>
                  </div>
                </Card>
              </div>
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

          <TabsContent value="users" className="space-y-6 animate-in fade-in duration-500">
            <Card className="shadow-xl border-primary/10 overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardHeader className="flex flex-col sm:flex-row items-center justify-between py-6 px-6 bg-white border-b gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    Devotee Access Management
                  </CardTitle>
                  <CardDescription className="text-xs uppercase tracking-widest font-semibold opacity-60">Control system permissions and community tiers</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Select value={userSort} onValueChange={setUserSort}>
                    <SelectTrigger className="w-full sm:w-44 h-11 text-[10px] font-black uppercase tracking-wider bg-secondary/20 border-primary/5 shadow-inner">
                      <div className="flex items-center gap-2">
                        <ListOrdered className="h-3.5 w-3.5" />
                        <SelectValue placeholder="Sort By" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/10 shadow-xl">
                      <SelectItem value="role" className="text-[10px] font-bold uppercase">Role Priority</SelectItem>
                      <SelectItem value="name-asc" className="text-[10px] font-bold uppercase">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc" className="text-[10px] font-bold uppercase">Name (Z-A)</SelectItem>
                      <SelectItem value="recent" className="text-[10px] font-bold uppercase">Recent Joins</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name or email..." 
                      className="pl-10 h-11 text-sm bg-secondary/20 border-primary/5 focus:bg-white transition-all shadow-inner" 
                      value={userSearch} 
                      onChange={(e) => setUserSearch(e.target.value)} 
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[300px] py-4 text-[10px] uppercase font-black tracking-wider text-muted-foreground pl-6">Devotee Identity</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Community Role</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">System Access</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-wider text-muted-foreground text-right pr-6">Quick Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map(u => {
                      const isTechAdmin = allAdmins?.some(a => a.id === u.id);
                      return (
                        <TableRow key={u.id} className="group hover:bg-primary/5 transition-colors border-b-primary/5">
                          <TableCell className="py-4 pl-6 align-middle">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-primary/10 group-hover:scale-110 transition-transform">
                                <AvatarImage src={u.photoURL} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                  {u.name?.charAt(0) || u.email?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm text-foreground truncate">{u.name || 'Devotee'}</span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                                  <Mail className="h-2.5 w-2.5 opacity-50" /> {u.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <Select 
                              defaultValue={u.role || 'devotee'} 
                              onValueChange={(val) => setRoleConfirm({ userId: u.id, name: u.name || u.email, newRole: val, type: 'role' })}
                            >
                              <SelectTrigger className={cn(
                                "h-8 w-32 text-[10px] font-black uppercase tracking-wide transition-all shadow-sm border-primary/10",
                                u.role === 'president' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                u.role === 'official' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                u.role === 'member' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white'
                              )}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-primary/10 shadow-xl">
                                <SelectItem value="devotee" className="text-[10px] font-bold uppercase">Devotee</SelectItem>
                                <SelectItem value="member" className="text-[10px] font-bold uppercase text-amber-600">Member</SelectItem>
                                <SelectItem value="official" className="text-[10px] font-bold uppercase text-emerald-600">Official</SelectItem>
                                <SelectItem value="president" className="text-[10px] font-bold uppercase text-indigo-600">President</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center">
                              {isTechAdmin ? (
                                <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 gap-1.5 px-3 py-0.5 shadow-md shadow-primary/20 flex items-center w-fit h-6">
                                  <ShieldCheck className="h-3 w-3 shrink-0" />
                                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">Management Admin</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground gap-1.5 px-3 py-0.5 border-dashed border-muted-foreground/30 bg-muted/5 flex items-center w-fit h-6">
                                  <ShieldQuestion className="h-3 w-3 opacity-50 shrink-0" />
                                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">Devotee</span>
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6 align-middle">
                            <div className="flex justify-end gap-2">
                              {isTechAdmin ? (
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="h-8 px-3 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-destructive/10 gap-1.5 hover:scale-105 active:scale-95 transition-all"
                                  onClick={() => setRoleConfirm({ 
                                    userId: u.id, 
                                    name: u.name || u.email, 
                                    newRole: 'devotee', 
                                    type: 'admin' 
                                  })}
                                  disabled={u.id === user?.uid}
                                >
                                  <UserMinus className="h-3 w-3" /> Revoke Access
                                </Button>
                              ) : (
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  className="h-8 px-3 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 gap-1.5 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
                                  onClick={() => setRoleConfirm({ 
                                    userId: u.id, 
                                    name: u.name || u.email, 
                                    newRole: 'admin', 
                                    type: 'admin' 
                                  })}
                                >
                                  <Crown className="h-3 w-3" /> Promote to Admin
                                </Button>
                              )}
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

          <TabsContent value="logs" className="space-y-6 animate-in fade-in duration-500">
            <Card className="shadow-xl border-primary/10 overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardHeader className="bg-white border-b flex flex-row items-center justify-between py-6 px-6">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    System Audit Stream
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest font-semibold opacity-60">Verified history of administrative interactions</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[150px] py-4 text-[10px] uppercase font-black tracking-wider text-muted-foreground pl-6">Occurrence</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Administrator</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Action Type</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-wider text-muted-foreground text-right pr-6">Affected Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50).map((l: any) => {
                      const details = getActionDetails(l.actionType);
                      const ActionIcon = details.icon;
                      return (
                        <TableRow key={l.id} className="group hover:bg-primary/5 transition-colors border-b-primary/5">
                          <TableCell className="py-4 pl-6 align-middle">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-foreground">{new Date(l.timestamp).toLocaleDateString()}</span>
                              <span className="text-[9px] text-muted-foreground font-mono opacity-70">
                                {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-full bg-secondary border border-primary/10 flex items-center justify-center text-[10px] font-black text-primary shadow-sm group-hover:scale-110 transition-transform">
                                {l.adminName?.charAt(0).toUpperCase() || 'A'}
                              </div>
                              <span className="text-xs font-bold text-foreground">{l.adminName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <Badge variant="outline" className={cn("gap-1.5 h-6 text-[9px] font-black uppercase tracking-wider px-2.5 shadow-sm", details.color)}>
                              <ActionIcon className="h-3 w-3 shrink-0" />
                              {l.actionType.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6 align-middle">
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-black text-foreground truncate max-w-[220px]">{l.entityTitle}</span>
                              <span className="text-[8px] uppercase tracking-widest font-bold text-primary opacity-60 flex items-center gap-1">
                                <Fingerprint className="h-2 w-2" />
                                {l.entityType}
                              </span>
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
        </Tabs>
      </main>

      {/* Role Action Confirmation */}
      <AlertDialog open={!!roleConfirm} onOpenChange={(o) => !o && setRoleConfirm(null)}>
        <AlertDialogContent className="w-[95%] max-w-md mx-auto rounded-3xl border-primary/10 shadow-2xl overflow-hidden p-0">
          <div className="bg-primary/5 p-6 border-b border-primary/5 text-center">
            <div className="mx-auto h-16 w-16 bg-white rounded-full shadow-xl flex items-center justify-center mb-4 ring-4 ring-primary/5">
              {roleConfirm?.type === 'admin' ? <Fingerprint className="h-8 w-8 text-primary" /> : <UserCog className="h-8 w-8 text-primary" />}
            </div>
            <AlertDialogTitle className="text-xl font-black tracking-tight text-foreground">
              Confirm Security Update
            </AlertDialogTitle>
          </div>
          <div className="p-8">
            <AlertDialogDescription className="text-sm text-center font-medium text-muted-foreground leading-relaxed">
              {roleConfirm?.type === 'admin' 
                ? (
                  <span>
                    You are about to <strong className="text-foreground">{allAdmins?.some(a => a.id === roleConfirm.userId) ? 'REMOVE Technical Admin' : 'GRANT Technical Admin'}</strong> 
                    permissions for <strong className="text-primary">{roleConfirm.name}</strong>. 
                    {allAdmins?.some(a => a.id === roleConfirm.userId) 
                      ? " This user will lose all access to the Management Panel." 
                      : " This user will gain full access to modify temple data."}
                  </span>
                )
                : (
                  <span>
                    Confirm changing <strong className="text-primary">{roleConfirm?.name}</strong>'s community tier to 
                    <Badge variant="outline" className="mx-1 h-5 text-[9px] font-black border-primary/20 text-primary uppercase">
                      {roleConfirm?.newRole}
                    </Badge>?
                  </span>
                )}
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="p-6 bg-muted/20 flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="mt-0 h-12 rounded-2xl font-bold uppercase text-[10px] tracking-widest border-primary/10 hover:bg-white transition-all">Cancel Request</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRoleAction} 
              className={cn(
                "h-12 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg transition-all",
                roleConfirm?.type === 'admin' && allAdmins?.some(a => a.id === roleConfirm.userId) 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-200" 
                  : "bg-primary hover:bg-primary/90 shadow-primary/20"
              )}
            >
              Confirm Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
