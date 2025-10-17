
"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // This is a placeholder for actual role checking
  const isAdmin = true; 

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, isUserLoading, isAdmin, router]);

  if (isUserLoading || !isAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, Admin! Here you can manage the temple's website.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    