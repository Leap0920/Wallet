import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { IponClient } from "./ipon-client"

export default async function IponPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const goalsData = await prisma.iponGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  })

  // Transform the data to match the expected type
  const goals = goalsData.map((goal: any) => ({
    ...goal,
    denominations: goal.denominations as Array<{ denom: number; required: number; checked: number }> | null
  }))

  return <IponClient goals={goals} />
}