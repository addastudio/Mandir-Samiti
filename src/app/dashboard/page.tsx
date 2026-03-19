"use client";

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuth, signOut } from "firebase/auth";
import { collection, doc } from "firebase/firestore";
import { Loader2, LogOut, User as UserIcon, History, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const donationsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "donations");
  }, [firestore, user]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [firestore, user]);

  const { data: donations, isLoading: isDonationsLoading } = useCollection(donationsRef);
  const { data: adminDoc } = useDoc(adminRoleRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/");
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 mt-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserIcon className="h-8 w-8 text-primary" />
            Welcome, {user.displayName || user.email}
          </h1>
          <p className="text-muted-foreground">Manage your profile and view donation history.</p>
        </div>
        <div className="flex gap-2">
          {adminDoc && (
            <Link href="/admin">
              <Button variant="outline" className="gap-2">
                <ShieldCheck className="h-4 w-4" /> Admin Panel
              </Button>
            </Link>
          )}
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Member Since</label>
              <p className="font-medium">{new Date(user.metadata.creationTime || "").toLocaleDateString()}</p>
            </div>
            {adminDoc && (
              <div className="pt-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Administrator
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Donation History
            </CardTitle>
            <CardDescription>A list of your contributions to the temple.</CardDescription>
          </CardHeader>
          <CardContent>
            {isDonationsLoading ? (
              <div className="flex py-8 justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : donations && donations.length > 0 ? (
              <div className="space-y-4">
                {donations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div>
                      <p className="font-bold text-lg">₹{donation.amount}</p>
                      <p className="text-xs text-muted-foreground">{new Date(donation.date).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium px-2 py-1 rounded bg-secondary">{donation.mode}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No donation records found.</p>
                <Link href="/#donate" className="text-primary hover:underline mt-2 inline-block">
                  Support the temple today
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
