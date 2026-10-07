"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, KeyRound, Lock, Loader2, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useChangePassword } from "@/mutations/useChangePassword";
import { useSendOtp, useVerifyOtp, useResetPassword } from "@/mutations/useForgotPassword";
import { useResendOtp } from "@/mutations/useResendOtp";
import { useAuth } from "@/context/userContext";
import { toast } from "sonner";

// Change Password Schema
const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(6, "New password must be at least 6 characters"),
    new_password_confirmation: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: "New passwords do not match",
    path: ["new_password_confirmation"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Inline Reset Password Schema
const resetOtpSchema = z
  .object({
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    password_confirmation: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type ResetOtpFormData = z.infer<typeof resetOtpSchema>;

export default function PasswordSection() {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<"change" | "send_otp" | "verify_reset">("change");

  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mutations
  const changePasswordMutation = useChangePassword();
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const resetPasswordMutation = useResetPassword();
  const resendOtpMutation = useResendOtp();

  const userEmail = user?.email || "";

  // Form methods for Change Password
  const changeMethods = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    },
  });

  // Form methods for OTP Reset
  const resetMethods = useForm<ResetOtpFormData>({
    resolver: zodResolver(resetOtpSchema),
    defaultValues: {
      otp: "",
      password: "",
      password_confirmation: "",
    },
  });

  // Handle standard change password
  const onChangePasswordSubmit = async (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data, {
      onSuccess: async (response) => {
        toast.success(response.message || "Password changed successfully! Please login again.");
        await logout();
      },
      onError: (error: any) => {
        console.error(error);
        const errorMsg = error?.response?.data?.errors?.message;
        if (errorMsg) {
          changeMethods.setError("current_password", {
            type: "server",
            message: errorMsg,
          });
        } else {
          toast.error(error?.response?.data?.message || "Failed to change password. Please verify current password.");
        }
      },
    });
  };

  // Handle sending OTP
  const handleSendOtp = () => {
    if (!userEmail) {
      toast.error("Email address not found for current doctor.");
      return;
    }
    sendOtpMutation.mutate(
      { email: userEmail },
      {
        onSuccess: (res) => {
          toast.success(res.message || "OTP sent to your email address");
          setMode("verify_reset");
        },
        onError: (err: any) => {
          console.error(err);
          toast.error(err?.response?.data?.message || "Failed to send OTP. Please try again.");
        },
      }
    );
  };

  // Handle Resend OTP
  const handleResendOtp = () => {
    if (!userEmail) return;
    resendOtpMutation.mutate(
      { email: userEmail, context: "forgot_password" },
      {
        onSuccess: (res) => {
          toast.success(res.message || "OTP resent to your email.");
        },
        onError: (err: any) => {
          console.error(err);
          toast.error(err?.response?.data?.message || "Failed to resend OTP.");
        },
      }
    );
  };

  // Handle verify OTP and reset password in one smooth flow
  const onResetSubmit = async (data: ResetOtpFormData) => {
    if (!userEmail) return;

    verifyOtpMutation.mutate(
      { email: userEmail, otp: data.otp },
      {
        onSuccess: (verifyRes) => {
          const resetToken = verifyRes.data?.reset_token;
          if (!resetToken) {
            toast.error("No reset token received from verification.");
            return;
          }

          resetPasswordMutation.mutate(
            {
              email: userEmail,
              reset_token: resetToken,
              password: data.password,
              password_confirmation: data.password_confirmation,
            },
            {
              onSuccess: async () => {
                toast.success("Password reset successfully! Logging you out...");
                await logout();
              },
              onError: (resetErr: any) => {
                console.error(resetErr);
                toast.error(
                  resetErr?.response?.data?.message || "Failed to reset password. Please try again."
                );
              },
            }
          );
        },
        onError: (verifyErr: any) => {
          console.error(verifyErr);
          const errorMsg = verifyErr?.response?.data?.errors?.message;
          if (errorMsg) {
            resetMethods.setError("otp", { type: "server", message: errorMsg });
          } else {
            toast.error(verifyErr?.response?.data?.message || "Invalid OTP code.");
          }
        },
      }
    );
  };

  const isResetPending = verifyOtpMutation.isPending || resetPasswordMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        <div>
          <h2 className="text-[#1F1E1E] font-semibold text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {mode === "change" ? "Change Password" : "Reset Password via OTP"}
          </h2>
          <p className="text-[#4D4D4D] text-sm">
            {mode === "change"
              ? "Update your account password securely"
              : "Verify your email with OTP to set a new password"}
          </p>
        </div>

        {mode !== "change" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMode("change")}
            className="text-xs text-slate-600 gap-1 rounded-md"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Change Password
          </Button>
        )}
      </div>

      <Card className="border-border p-4 sm:p-6 rounded-2xl">
        {/* MODE 1: Standard Change Password */}
        {mode === "change" && (
          <FormProvider {...changeMethods}>
            <form onSubmit={changeMethods.handleSubmit(onChangePasswordSubmit)} className="space-y-5 max-w-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="current_password">Current Password</Label>
                  <button
                    type="button"
                    onClick={() => setMode("send_otp")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    {...changeMethods.register("current_password")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {changeMethods.formState.errors.current_password && (
                  <p className="text-xs text-destructive font-medium">
                    {changeMethods.formState.errors.current_password.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...changeMethods.register("new_password")}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {changeMethods.formState.errors.new_password && (
                    <p className="text-xs text-destructive font-medium">
                      {changeMethods.formState.errors.new_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      {...changeMethods.register("new_password_confirmation")}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {changeMethods.formState.errors.new_password_confirmation && (
                    <p className="text-xs text-destructive font-medium">
                      {changeMethods.formState.errors.new_password_confirmation.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full sm:w-auto min-w-[140px] gap-1.5 rounded-md">
                  {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </FormProvider>
        )}

        {/* MODE 2: Send OTP */}
        {mode === "send_otp" && (
          <div className="space-y-5 max-w-xl">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-md space-y-1">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Forgot Password Verification</p>
              <p className="text-sm text-slate-700">
                We will send a 6-digit OTP code to your registered email address:{" "}
                <strong className="text-slate-900">{userEmail}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleSendOtp}
                disabled={sendOtpMutation.isPending}
                className="gap-2 rounded-md"
              >
                {sendOtpMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP Code"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("change")}
                className="rounded-md"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* MODE 3: Verify OTP & Reset Password */}
        {mode === "verify_reset" && (
          <FormProvider {...resetMethods}>
            <form onSubmit={resetMethods.handleSubmit(onResetSubmit)} className="space-y-5 max-w-xl">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>OTP code sent to <strong>{userEmail}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendOtpMutation.isPending}
                  className="text-primary font-bold hover:underline disabled:opacity-50"
                >
                  {resendOtpMutation.isPending ? "Resending..." : "Resend OTP"}
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit Verification Code (OTP)</Label>
                <Input
                  id="otp"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  {...resetMethods.register("otp")}
                />
                {resetMethods.formState.errors.otp && (
                  <p className="text-xs text-destructive font-medium">
                    {resetMethods.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reset_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="reset_password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...resetMethods.register("password")}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {resetMethods.formState.errors.password && (
                    <p className="text-xs text-destructive font-medium">
                      {resetMethods.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset_password_confirmation">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="reset_password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      {...resetMethods.register("password_confirmation")}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {resetMethods.formState.errors.password_confirmation && (
                    <p className="text-xs text-destructive font-medium">
                      {resetMethods.formState.errors.password_confirmation.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode("change")}
                  className="rounded-md text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isResetPending} className="gap-1.5 rounded-md text-xs">
                  {isResetPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {isResetPending ? "Verifying & Resetting..." : "Verify OTP & Reset Password"}
                </Button>
              </div>
            </form>
          </FormProvider>
        )}
      </Card>
    </div>
  );
}
