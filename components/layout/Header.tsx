"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";
import { useAuth } from "@/context/userContext";
import { useDoctorProfile } from "@/queries/useProfile";
import { cn } from "@/lib/utils";
import icon from "@/public/assets/icon/logo-green.png";
import type { NavItem } from "@/types/header";
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  User as UserIcon,
} from "lucide-react";
import { useSettings } from "@/context/settingsContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationDropdown } from "./NotificationDropdown";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function Header() {
  const { settings } = useSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use actual media query for responsive check
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen scroll for sticky effect (optional, or remove if unused)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pathname = usePathname();
  const { user, initializing, logout } = useAuth();
  // Test-mode flag from the profile API (works for sessions started before the flag was in the login response).
  const { data: doctorProfile } = useDoctorProfile();
  const isTestDoctor = Boolean(user?.is_test_doctor || (doctorProfile?.data as { is_test_doctor?: boolean } | undefined)?.is_test_doctor);
  const {
    permission,
    subscription,
    loading: notificationsLoading,
    subscribeToPush,
    unsubscribeFromPush,
    isSupported,
  } = usePushNotifications();

  // For notification label (Name fallback)
  const name =
    user && (user.first_name || user.last_name)
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
      : "User";


  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      title: "My Schedules",
      href: "/my-schedules",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      title: "Appointments",
      href: "/appointments",
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      title: "Feedbacks",
      href: "/feedbacks",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ];


  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm",
        isScrolled
          ? "bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b"
          : "bg-background",
      )}
    >
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 container mx-auto">
        {/* Logo and App Name */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <Image
            src={settings.logoUrl || icon}
            alt={settings.appName || "Logo"}
            width={180}
            height={32}
            className="w-28 sm:w-32 md:w-44 h-auto"
            priority
            unoptimized
          />
        </Link>

        {/* Navigation Bar (Icons on Mobile, Icon + Text on Desktop) */}
        <nav className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={cn(
                "relative flex items-center justify-center gap-2 rounded-xl p-2 lg:px-3 lg:py-2 text-xs lg:text-sm font-semibold transition-all shadow-2xs",
                pathname === item.href
                  ? "border border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/85"
                  : "border border-primary/25 bg-white text-primary hover:bg-primary hover:text-primary-foreground",
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="hidden lg:inline">{item.title}</span>
              {item.badge ? (
                <Badge
                  variant={pathname === item.href ? "secondary" : "default"}
                  className="ml-auto flex h-4 w-4 items-center justify-center text-[10px] bg-primary/10 rounded-full p-1"
                >
                  {Number(item.badge) > 99 ? "99+" : item.badge}
                </Badge>
              ) : null}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <NotificationDropdown />

          {user || initializing ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop User Info - Only visible on desktop */}
              <div className="flex-col text-right hidden lg:flex">
                <span className="flex items-center justify-end gap-1.5 text-sm font-semibold leading-none">
                  {initializing ? "unknown name" : name}
                  {!initializing && isTestDoctor && (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Test</span>
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {initializing
                    ? "unknown email"
                    : user?.email || "healthcare@info.test"}
                </span>
              </div>

              {/* Desktop Avatar - Only visible on desktop */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full border-0 p-0 hover:bg-transparent"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar || ""} alt={name} />
                        <AvatarFallback>
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={async () => {
                        await logout();
                        window.location.href = "/auth/login";
                      }}
                      disabled={initializing}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu Hamburger Button - Always visible on mobile screens */}
              <div className="block lg:hidden">
                <Sheet
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>

                  <SheetContent
                    side="right"
                    className="w-87.5 p-0"
                  >
                    {/* Header with Logo and Close */}
                    <SheetHeader className="border-b p-4">
                      <SheetTitle className="sr-only">Menu</SheetTitle>
                      {/* Profile Section - Mobile Menu */}
                      <div className="bg-muted/10">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user?.avatar || ""} alt={name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {name.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="flex items-center gap-1.5 text-base font-semibold truncate">
                              {initializing ? "Loading..." : name}
                              {!initializing && isTestDoctor && (
                                <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Test</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {initializing ? "Loading..." : user?.email || "healthcare@info.test"}
                            </p>
                            <Link
                              href="/profile"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="inline-block mt-1 text-sm text-primary hover:underline"
                            >
                              View Profile →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </SheetHeader>

                    {/* Navigation Items */}
                    <nav className="flex flex-col gap-2.5 p-4 overflow-y-auto">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 shadow-2xs",
                            pathname === item.href
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border/70 bg-background text-foreground/85 hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                          )}
                        >
                          <span className={cn("shrink-0", pathname === item.href ? "text-primary-foreground" : "text-primary")}>
                            {item.icon}
                          </span>
                          <span className="flex-1">{item.title}</span>
                          {item.badge ? (
                            <Badge className="ml-auto">
                              {Number(item.badge) > 99 ? "99+" : item.badge}
                            </Badge>
                          ) : null}
                        </Link>
                      ))}

                      <div className="mt-2 rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Notifications</p>
                            <p className="text-[11px] text-muted-foreground">Enable push alerts for appointments and updates.</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                            {subscription ? "On" : permission === "denied" ? "Blocked" : "Off"}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant={subscription ? "outline" : "default"}
                          className="w-full justify-center rounded-xl font-semibold text-xs"
                          disabled={!isSupported || notificationsLoading || permission === "denied"}
                          onClick={async () => {
                            try {
                              if (subscription) {
                                await unsubscribeFromPush();
                              } else {
                                await subscribeToPush();
                              }
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                        >
                          {notificationsLoading ? (
                            <span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4 opacity-0" />Loading...</span>
                          ) : permission === "denied" ? (
                            "Notifications blocked"
                          ) : subscription ? (
                            "Disable notifications"
                          ) : (
                            "Enable notifications"
                          )}
                        </Button>
                      </div>

                      <Separator className="my-1" />

                      {/* Logout Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          await logout();
                          window.location.href = "/auth/login";
                        }}
                        className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive transition-all duration-200 hover:bg-destructive/10 cursor-pointer w-full"
                      >
                        <LogOut className="h-4 w-4 shrink-0 text-destructive" />
                        <span>Log out</span>
                      </button>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          ) : (
            !initializing && (
              <Link
                href="/auth/login"
                className="text-sm font-medium text-primary hover:underline px-3 py-2"
              >
                Sign In
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
