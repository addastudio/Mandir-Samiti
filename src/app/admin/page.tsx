
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD

/**
 * Empty redirect component to ensure /admin path remains available for static Netlify CMS.
 * This file is kept temporarily to ensure the old route doesn't cause issues during builds.
 */
export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // If the committee lands here accidentally through a Next.js client-side transition,
    // we send them to the new Management Panel.
    router.replace("/management");
  }, [router]);

  return null;
=======
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, doc, collectionGroup, query } from "firebase/firestore";
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
  Settings, 
  Plus,
  Shield,
  Clock,
  AlertTriangle,
  Database,
  BarChart3,
  IndianRupee,
  HandCoins,
  UserCheck,
  UtensilsCrossed,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
import { getBackendConnectionStatus } from "@/app/actions";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  const [userSearch, setUserSearch] = useState("");
  const [donationSearch, setDonationSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ col: string, id: string, title: string } | null>(null);
  const [backendStatus, setBackendStatus] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    getBackendConnectionStatus().then(setBackendStatus);
  }, []);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);

  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  const usersRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "users"), [firestore, adminDoc]);
  const adminsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "roles_admin"), [firestore, adminDoc]);
  const donationsGroupRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : query(collectionGroup(firestore, "donations")), [firestore, adminDoc]);
  const requestsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "prayer_requests"), [firestore, adminDoc]);
  const eventsRef = useMemoFirebase(() => (!firestore || !adminDoc) ? null : collection(firestore, "events"), [firestore, adminDoc]);

  const { data: allUsers } = useCollection(usersRef);
  const { data: allAdmins } = useCollection(adminsRef);
  const { data: allDonations } = useCollection(donationsGroupRef);
  const { data: requests } = useCollection(requestsRef);
  const { data: events } = useCollection(eventsRef);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminLoading) {
      if (!user) router.push("/login");
      else if (!adminDoc) router.push("/dashboard");
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, router, mounted]);

  const combinedUserList = React.useMemo(() => {
    const userMap = new Map<string, any>();
    allUsers?.forEach(u => userMap.set(u.id, { ...u, hasProfile: true }));
    allAdmins?.forEach(a => {
      if (!userMap.has(a.id)) userMap.set(a.id, { id: a.id, name: 'Deleted Account', email: 'N/A' });
    });
    return Array.from(userMap.values());
  }, [allUsers, allAdmins]);

  const filteredDonations = React.useMemo(() => {
    if (!allDonations) return [];
    return allDonations.filter(d => {
      const u = combinedUserList.find(user => user.id === d.userId);
      const searchStr = donationSearch.toLowerCase();
      const devName = (d.devoteeName || u?.name || 'Unknown').toLowerCase();
      return devName.includes(searchStr) || d.amount?.toString().includes(searchStr);
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allDonations, combinedUserList, donationSearch]);

  const totalCollection = allDonations?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  const confirmDelete = () => {
    if (!firestore || !deleteConfirm) return;
    deleteDocumentNonBlocking(doc(firestore, deleteConfirm.col, deleteConfirm.id));
    toast({ title: "Deleted successfully" });
    setDeleteConfirm(null);
  };

  const handleAddManualDonation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    addDocumentNonBlocking(collection(firestore, "donations"), {
      amount: Number(formData.get("amount")),
      mode: formData.get("mode"),
      status: "completed",
      date: new Date().toISOString(),
      devoteeName: formData.get("devoteeName"),
      userId: null,
      isManual: true
    });
    toast({ title: "Donation Recorded" });
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  if (!mounted || isUserLoading || isAdminLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16 sm:pt-20">
      <main id="main-content" className="container mx-auto px-4 sm:px-6 space-y-6 pt-4">
        <Breadcrumbs items={[{ label: language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel' }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0"><ShieldAlert className="h-8 w-8 text-primary" /></div>
            <div>
              <h1 className={cn("text-xl sm:text-2xl font-bold", language === 'hi' ? 'font-hindi' : 'font-headline')}>
                {language === 'hi' ? 'प्रबंधन पैनल' : 'Management Panel'}
              </h1>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <div className="w-full overflow-x-auto touch-scroll pb-4 px-1">
            <TabsList className="inline-flex h-auto w-max min-w-full items-center justify-start gap-2 rounded-xl border border-primary/10 bg-muted/40 p-1.5 shadow-sm">
              <TabsTrigger value="overview" className="shrink-0 gap-2"><BarChart3 className="h-4 w-4" /> {language === 'hi' ? 'सारांश' : 'Overview'}</TabsTrigger>
              <TabsTrigger value="donations" className="shrink-0 gap-2"><HandCoins className="h-4 w-4" /> {language === 'hi' ? 'दान' : 'Donations'}</TabsTrigger>
              <TabsTrigger value="settings" className="shrink-0 gap-2"><Settings className="h-4 w-4" /> {language === 'hi' ? 'सेटिंग्स' : 'Settings'}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Total Collection<IndianRupee className="h-4 w-4 text-primary" /></CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">₹{totalCollection.toLocaleString()}</div></CardContent>
              </Card>
              <Card className="bg-accent/5 border-accent/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Devotees<Users className="h-4 w-4 text-accent" /></CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{allUsers?.length || 0}</div></CardContent>
              </Card>
              <Card className="bg-green-50 border-green-100">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center justify-between">Pending Requests<MessageSquare className="h-4 w-4 text-green-600" /></CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-700">{requests?.filter(r => r.status === 'pending').length || 0}</div></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <Card className="border-primary/20 shadow-md">
                  <CardHeader className="bg-primary/5"><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" />Record Donation</CardTitle></CardHeader>
                  <CardContent className="pt-6">
                    <form onSubmit={handleAddManualDonation} className="space-y-4">
                      <div className="space-y-2"><Label>Devotee Name</Label><Input name="devoteeName" required /></div>
                      <div className="space-y-2"><Label>Amount (₹)</Label><Input name="amount" type="number" required /></div>
                      <div className="space-y-2"><Label>Mode</Label><select name="mode" className="w-full h-10 rounded border px-3 text-sm"><option value="Cash">Cash</option><option value="Check">Check</option></select></div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Record"}</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Donation Ledger</CardTitle><Input placeholder="Search..." className="w-64" value={donationSearch} onChange={(e) => setDonationSearch(e.target.value)} /></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Devotee</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredDonations.map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="font-bold">{d.devoteeName || 'Unknown'}</TableCell>
                            <TableCell className="text-primary font-bold">₹{d.amount}</TableCell>
                            <TableCell className="text-xs opacity-70">{new Date(d.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right"><Badge className="bg-green-500">Completed</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Backend Infrastructure</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full"><Database className="h-4 w-4 text-amber-600" /></div>
                    <div><p className="font-bold text-sm">Firebase (Primary)</p><p className="text-xs opacity-60">Database & Auth</p></div>
                  </div>
                  <Badge className="bg-green-500">Connected</Badge>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><Database className="h-4 w-4 text-blue-600" /></div>
                    <div><p className="font-bold text-sm">Superbase</p><p className="text-xs opacity-60">{backendStatus?.superbase?.active ? 'Connected' : 'Offline'}</p></div>
                  </div>
                  <Badge variant={backendStatus?.superbase?.active ? 'default' : 'outline'}>{backendStatus?.superbase?.active ? 'Active' : 'Offline'}</Badge>
                </div>
                <div className="p-4 rounded-lg bg-secondary/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-full"><Globe className="h-4 w-4 text-indigo-600" /></div>
                    <div><p className="font-bold text-sm">Contentful CMS</p><p className="text-xs opacity-60">{backendStatus?.contentful?.active ? 'Connected' : 'Offline'}</p></div>
                  </div>
                  <Badge variant={backendStatus?.contentful?.active ? 'default' : 'outline'}>{backendStatus?.contentful?.active ? 'Active' : 'Offline'}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this?</AlertDialogTitle>
            <AlertDialogDescription>This action is permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
>>>>>>> 80d9f5bbcf47e2e000c7f1bcb195d07045672027
}
