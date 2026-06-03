"use client";

import LandingNavbar from "@/components/LandingNavbar";
import PasswordRequirements from "@/components/PasswordRequirements";
import SodieAvatar from "@/components/SodieAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { evaluatePassword } from "@/lib/passwordPolicy";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const { isValid: isPasswordValid } = evaluatePassword(password);
  const canSubmit =
    isPasswordValid &&
    email.trim().length > 0 &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    !isLoading;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordTouched(true);

    if (!isPasswordValid) {
      setError("Please choose a password that meets all the requirements.");
      return;
    }

    const result = await register({
      email: email.trim(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });

    if (result.success) {
      router.push("/onboarding");
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50/50 to-[hsl(var(--turmeric))]/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--paprika))_0%,transparent_25%),radial-gradient(circle_at_70%_80%,hsl(var(--turmeric))_0%,transparent_25%),radial-gradient(circle_at_40%_60%,hsl(var(--sage))_0%,transparent_20%)] opacity-8" />

      <LandingNavbar />

      <main className="relative flex-1 flex items-center justify-center p-4 py-10">
        <Card className="w-full max-w-lg shadow-cozy border-2 border-[hsl(var(--paprika))]/40 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-[hsl(var(--paprika))]/15 to-[hsl(var(--turmeric))]/20 flex items-center justify-center">
              <SodieAvatar
                size="xl"
                animate="none"
                className="drop-shadow-md sm:hidden"
              />
              <SodieAvatar
                size="2xl"
                animate="none"
                className="drop-shadow-md hidden sm:block"
              />
            </div>
            <CardTitle className="font-heading font-bold text-2xl text-[#262218]">
              Start your cooking journey
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Create an account and get your first adaptive meal plan in
              minutes.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-1"
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="mt-1"
                    autoComplete="family-name"
                  />
                </div>
              </div>
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
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    required
                    minLength={8}
                    maxLength={128}
                    className="pr-10"
                    autoComplete="new-password"
                    aria-describedby="password-requirements"
                    aria-invalid={passwordTouched && !isPasswordValid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-[hsl(var(--paprika))]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div id="password-requirements">
                  <PasswordRequirements value={password} />
                </div>
              </div>
              {error && (
                <div className="text-red-600 text-sm font-medium text-center">
                  {error === "Registration failed" &&
                    "Registration failed. Please check your details and try again."}
                  {error === "Invalid response from server." &&
                    "Something went wrong. Please try again later."}
                  {error !== "Registration failed" &&
                    error !== "Invalid response from server." &&
                    error}
                </div>
              )}
              <Button
                type="submit"
                disabled={!canSubmit}
                size="touch"
                className="w-full text-base font-semibold bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Registering..." : "Create account"}
              </Button>
            </form>
          </CardContent>
          <div className="text-center pb-6 -mt-2 text-sm">
            <span className="text-muted-foreground">
              Already have an account?
            </span>
            <Button
              variant="link"
              className="ml-1 text-[hsl(var(--paprika))] font-medium underline-offset-2 hover:underline"
              onClick={() => router.push("/login")}
              aria-label="Go to Login"
            >
              Login
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
