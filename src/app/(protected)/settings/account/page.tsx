"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks";
import { api } from "@/lib/api";
import {
  setAccessToken,
  setCachedUser,
  setRefreshToken,
} from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

export default function AccountSettingsPage() {
  const { user, isLoading: userLoading, setUser } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Load current user data into form
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });
      setIsFormInitialized(true);
    }
  }, [user]);

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Error", {
        description: "User not found. Please log in again.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await api.updateAccount(user.id, formData);

      toast.success("Account Updated", {
        description: "Your account details have been updated successfully.",
      });

      // Sync updated user into auth context
      setUser(updatedUser);
    } catch (error) {
      toast.error("Update Failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to update account details.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Error", {
        description: "User not found. Please log in again.",
      });
      return;
    }

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Password Mismatch", {
        description: "New password and confirmation do not match.",
      });
      return;
    }

    // Validate password strength
    if (passwordData.new_password.length < 6) {
      toast.error("Weak Password", {
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsSaving(true);

    try {
      await api.changePassword(user.id, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      toast.success("Password Changed", {
        description: "Your password has been updated successfully.",
      });

      // Clear password fields
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      toast.error("Password Change Failed", {
        description:
          error instanceof Error ? error.message : "Failed to change password.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "This will permanently delete all your data, recipes, and meal plans. Are you absolutely sure?"
    );

    if (!doubleConfirm) return;

    try {
      await api.deleteAccount(user.id);

      toast.success("Account Deleted", {
        description: "Your account has been deleted.",
      });

      // Clear local storage and redirect to home
      setAccessToken(null);
      setRefreshToken(null);
      setCachedUser(null);
      localStorage.removeItem("chefpath_user_id");
      window.location.href = "/";
    } catch (error) {
      toast.error("Deletion Failed", {
        description:
          error instanceof Error ? error.message : "Failed to delete account.",
      });
    }
  };

  if (userLoading || !user || !isFormInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading account settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" expand={true} richColors />
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--paprika))]/20 via-amber-50 to-[hsl(var(--turmeric))]/20 p-4 py-8 pb-16">
        <div className="max-w-2xl mx-auto space-y-6 mb-8">
          {/* Account Details Card */}
          <Card className="shadow-cozy border-2 border-[hsl(var(--paprika))]/40 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="font-heading text-2xl font-bold text-[#262218]">
                Account Settings
              </CardTitle>
              <CardDescription className="font-body">
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccountUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="first_name"
                      className="text-sm font-semibold"
                    >
                      First Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="border-[hsl(var(--paprika))]/25 focus-visible:ring-[hsl(var(--paprika))]/40"
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="last_name"
                      className="text-sm font-semibold"
                    >
                      Last Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="border-[hsl(var(--paprika))]/25 focus-visible:ring-[hsl(var(--paprika))]/40"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    Email Address <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="border-[hsl(var(--paprika))]/25 focus-visible:ring-[hsl(var(--paprika))]/40"
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto min-w-[12rem] px-8 font-semibold font-body bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-md"
                  >
                    {isSaving ? "Saving..." : "Update Account Details"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card className="shadow-cozy border-2 border-[hsl(var(--paprika))]/40 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="font-heading text-2xl font-bold text-[#262218]">
                Change Password
              </CardTitle>
              <CardDescription className="font-body">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="current_password"
                    className="text-sm font-semibold"
                  >
                    Current Password <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current_password: e.target.value,
                      })
                    }
                    className="border-[hsl(var(--paprika))]/25 focus-visible:ring-[hsl(var(--paprika))]/40"
                    required
                  />
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="new_password"
                    className="text-sm font-semibold"
                  >
                    New Password <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        new_password: e.target.value,
                      })
                    }
                    className="border-[hsl(var(--paprika))]/25 focus-visible:ring-[hsl(var(--paprika))]/40"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground font-body">
                    Must be at least 6 characters long
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirm_password"
                    className="text-sm font-semibold"
                  >
                    Confirm New Password <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value,
                      })
                    }
                    className="border-[hsl(var(--paprika))]/25 focus-visible:ring-[hsl(var(--paprika))]/40"
                    minLength={6}
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto min-w-[12rem] px-8 font-semibold font-body bg-gradient-to-r from-[hsl(var(--paprika))] to-orange-600 hover:from-orange-600 hover:to-[hsl(var(--paprika))] text-white shadow-md"
                  >
                    {isSaving ? "Changing Password..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="shadow-cozy border-2 border-red-400/50 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                <span>⚠️</span> Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions - proceed with caution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Deleting your account will permanently remove all your data,
                including your recipes, meal plans, and preferences. This action
                cannot be undone.
              </p>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="w-full sm:w-auto min-w-[12rem] px-8 bg-red-600 hover:bg-red-700 text-white font-semibold font-body"
                >
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
