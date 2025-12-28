import Link from "next/link"
import { Wallet, ArrowRight, PiggyBank, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-white" />
            <span className="font-semibold text-lg text-white">WalletWise</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-neutral-400 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-white text-black hover:bg-neutral-200">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-neutral-500 text-sm mb-4">Personal Finance Companion</p>
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6 leading-tight">
            Take Control of Your Financial Future
          </h1>
          <p className="text-lg text-neutral-400 mb-8 max-w-2xl mx-auto">
            Track expenses across GCash, Maya, PayPal, and cash. Visualize spending patterns and achieve your savings goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-black hover:bg-neutral-200 px-8">
                Start for Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800 px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl mx-auto">
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5 text-neutral-300" />
            </div>
            <h3 className="font-medium text-white mb-2">Multi-Wallet Tracking</h3>
            <p className="text-sm text-neutral-500">
              Track GCash, Maya, PayPal, bank accounts, and cash all in one place.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
              <PiggyBank className="w-5 h-5 text-neutral-300" />
            </div>
            <h3 className="font-medium text-white mb-2">Ipon Challenge</h3>
            <p className="text-sm text-neutral-500">
              Set savings goals and track them with a fun denomination checklist.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-neutral-300" />
            </div>
            <h3 className="font-medium text-white mb-2">Visual Analytics</h3>
            <p className="text-sm text-neutral-500">
              Beautiful charts showing weekly, monthly, and yearly spending patterns.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-20">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-neutral-600 text-sm">
            © 2024 WalletWise. Built with Next.js and MongoDB.
          </p>
        </div>
      </footer>
    </div>
  )
}