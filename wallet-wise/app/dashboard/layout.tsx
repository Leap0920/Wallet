import { auth } from "@/lib/auth-helper"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <DashboardLayout user={{ name: session.user.name!, email: session.user.email! }}>
      {children}
    </DashboardLayout>
  )
}