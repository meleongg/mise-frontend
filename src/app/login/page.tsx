"use client";

import LandingNavbar from "@/components/LandingNavbar";
import AuthSodieMark from "@/components/AuthSodieMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login({ email, password });

    if (result.success) {
      router.push("/weekly-plan");
    } else {
      setError(result.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50/50 to-[hsl(var(--turmeric))]/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--paprika))_0%,transparent_25%),radial-gradient(circle_at_70%_80%,hsl(var(--turmeric))_0%,transparent_25%),radial-gradient(circle_at_40%_60%,hsl(var(--sage))_0%,transparent_20%)] opacity-8" />

      <LandingNavbar />

      <main className="relative flex-1 flex items-center justify-center p-4 py-10">
        <Card className="w-full max-w-md shadow-cozy border-2 border-[hsl(var(--paprika))]/40 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-3">
            <AuthSodieMark />
            <CardTitle className="font-heading font-bold text-2xl text-[#262218]">
              Welcome back!
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Log in to pick up where you left off.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">
                  Password <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm font-medium text-center">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                size="touch"
                className="w-full text-base font-semibold bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <div className="text-center pb-6 -mt-2 text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?
            </span>
            <Button
              variant="link"
              className="ml-1 text-[hsl(var(--paprika))] font-medium underline-offset-2 hover:underline"
              onClick={() => router.push("/register")}
              aria-label="Go to Register"
            >
              Register
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
