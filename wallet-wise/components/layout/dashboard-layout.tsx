"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  Wallet, 
  PiggyBank, 
  Menu, 
  LogOut, 
  User,
  Home,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    name: string
    email: string
  }
}

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Ipon Challenge", href: "/dashboard/ipon", icon: PiggyBank },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-neutral-800 text-white" 
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            )}
            onClick={onNavigate}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-neutral-800 bg-neutral-900 px-5 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-2">
            <Wallet className="w-6 h-6 text-white" />
            <span className="font-semibold text-lg text-white">WalletWise</span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <div className="space-y-1">
              <NavItems />
            </div>
          </nav>

          {/* User Info */}
          <div className="border-t border-neutral-800 pt-4">
            <div className="flex items-center gap-3 px-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-neutral-700 text-white text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-x-4 border-b border-neutral-800 bg-neutral-900 px-4 sm:px-6">
          {/* Mobile menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-neutral-400 hover:text-white" suppressHydrationWarning>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-neutral-900 border-neutral-800 p-0">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto px-5 pb-4 pt-4">
                <div className="flex h-12 shrink-0 items-center gap-2">
                  <Wallet className="w-6 h-6 text-white" />
                  <span className="font-semibold text-lg text-white">WalletWise</span>
                </div>
                <nav className="flex flex-1 flex-col">
                  <div className="space-y-1">
                    <NavItems onNavigate={() => setSidebarOpen(false)} />
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0" suppressHydrationWarning>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-neutral-700 text-white text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-neutral-900 border-neutral-800" align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <DropdownMenuItem asChild className="text-neutral-300 focus:bg-neutral-800 focus:text-white cursor-pointer">
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-neutral-300 focus:bg-neutral-800 focus:text-white cursor-pointer">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <DropdownMenuItem 
                  className="text-red-400 focus:bg-neutral-800 focus:text-red-400 cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}