"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PiggyBank, Plus, Trash2, Check, Target, Edit2, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AddIponDialog } from "@/components/dialogs/add-ipon-dialog"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { useCurrency } from "@/components/providers/currency-provider"

interface Denomination {
  denom: number
  required: number
  checked: number
}

interface IponGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  isCompleted: boolean
  targetDate: Date | null
  denominations: Denomination[] | null
  createdAt: Date
}

interface IponClientProps {
  goals: IponGoal[]
}

export function IponClient({ goals }: IponClientProps) {
  const router = useRouter()
  const { displayCurrency } = useCurrency()
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<IponGoal | null>(null)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; goalId: string | null; goalName: string }>({
    open: false,
    goalId: null,
    goalName: ""
  })

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ open: true, goalId: id, goalName: name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.goalId) return

    try {
      const res = await fetch(`/api/ipon/${deleteConfirm.goalId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Goal deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete")
    } finally {
      setDeleteConfirm({ open: false, goalId: null, goalName: "" })
    }
  }

  const handleToggleDenom = async (goalId: string, denomIndex: number, currentDenoms: Denomination[], action: 'add' | 'remove') => {
    setUpdating(goalId)

    const newDenoms = [...currentDenoms]
    const denom = newDenoms[denomIndex]

    if (action === 'add') {
      // Add one check (if not at max)
      if (denom.checked < denom.required) {
        denom.checked += 1
      }
    } else {
      // Remove one check (if not at zero)
      if (denom.checked > 0) {
        denom.checked -= 1
      }
    }

    try {
      const res = await fetch(`/api/ipon/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denominations: newDenoms })
      })

      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      toast.error("Failed to update")
    } finally {
      setUpdating(null)
    }
  }

  const activeGoals = goals.filter(g => !g.isCompleted)
  const completedGoals = goals.filter(g => g.isCompleted)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Ipon Challenge</h1>
          <p className="text-neutral-500 text-sm">Track your savings goals</p>
        </div>
        <Button
          className="bg-white text-black hover:bg-neutral-200"
          onClick={() => setShowAddGoal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                <Target className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{activeGoals.length}</p>
                <p className="text-sm text-neutral-500">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{completedGoals.length}</p>
                <p className="text-sm text-neutral-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-neutral-400">Active Goals</h2>
          {activeGoals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100
            const denoms = goal.denominations as Denomination[] | null
            const isExpanded = expandedGoal === goal.id

            return (
              <Card key={goal.id} className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-5">
                  {/* Goal Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    >
                      <h3 className="font-medium text-white text-lg">{goal.name}</h3>
                      <p className="text-sm text-neutral-500">
                        {formatCurrency(goal.currentAmount, displayCurrency)} of {formatCurrency(goal.targetAmount, displayCurrency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{Math.round(progress)}%</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-500 hover:text-blue-400"
                        onClick={() => setEditingGoal(goal)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-500 hover:text-red-400"
                        onClick={() => handleDeleteClick(goal.id, goal.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-800 rounded-full h-2 mb-4">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  {/* Denomination Checklist */}
                  {denoms && denoms.length > 0 && (
                    <div
                      className={`space-y-3 overflow-hidden transition-all ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                    >
                      <p className="text-xs text-neutral-500 pt-2 border-t border-neutral-800">
                        Tap + to add a bill, - to undo:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {denoms.map((d, idx) => {
                          const maxDots = 8
                          const showDots = d.required <= maxDots
                          const progressPercent = d.required > 0 ? (d.checked / d.required) * 100 : 0

                          return (
                            <div
                              key={`${d.denom}-${idx}`}
                              className={`p-3 rounded-xl border transition-all ${d.checked === d.required
                                ? 'bg-green-500/10 border-green-500/30'
                                : d.checked > 0
                                  ? 'bg-neutral-800 border-neutral-600'
                                  : 'bg-neutral-800/50 border-neutral-700'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xl font-semibold text-white">₱{d.denom}</span>
                                {d.checked === d.required && (
                                  <Check className="w-5 h-5 text-green-500" />
                                )}
                              </div>

                              {/* Progress indicator */}
                              <div className="mb-3">
                                {showDots ? (
                                  <div className="flex items-center flex-wrap gap-1">
                                    {Array.from({ length: d.required }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-colors ${i < d.checked ? 'bg-green-500' : 'bg-neutral-600'
                                          }`}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="w-full bg-neutral-700 rounded-full h-1.5">
                                    <div
                                      className="bg-green-500 h-1.5 rounded-full transition-all"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                )}
                                <span className="text-xs text-neutral-500 mt-1 block">
                                  {d.checked}/{d.required}
                                </span>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleDenom(goal.id, idx, denoms, 'remove')}
                                  disabled={updating === goal.id || d.checked === 0}
                                  className="flex-1 h-9 px-2 text-[11px] sm:text-xs border-neutral-600 text-neutral-400 hover:text-white hover:bg-neutral-700 disabled:opacity-30"
                                >
                                  <Undo2 className="w-3 h-3 sm:mr-1 shrink-0" />
                                  <span className="hidden sm:inline">Undo</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleDenom(goal.id, idx, denoms, 'add')}
                                  disabled={updating === goal.id || d.checked >= d.required}
                                  className="flex-1 h-9 px-2 text-[11px] sm:text-xs border-green-600 text-green-400 hover:text-white hover:bg-green-600 disabled:opacity-30"
                                >
                                  <Plus className="w-3 h-3 sm:mr-1 shrink-0" />
                                  <span className="hidden sm:inline">Add</span>
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Expand hint */}
                  {denoms && denoms.length > 0 && !isExpanded && (
                    <button
                      className="text-xs text-neutral-500 hover:text-white transition-colors"
                      onClick={() => setExpandedGoal(goal.id)}
                    >
                      Tap to show denomination checklist →
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-neutral-400">Completed</h2>
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{goal.name}</h3>
                      <p className="text-sm text-neutral-500">{formatCurrency(goal.targetAmount, displayCurrency)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-500 hover:text-blue-400"
                      onClick={() => setEditingGoal(goal)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-500 hover:text-red-400"
                      onClick={() => handleDeleteClick(goal.id, goal.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PiggyBank className="w-12 h-12 text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No savings goals yet</h3>
            <p className="text-neutral-500 text-sm text-center mb-6 max-w-sm">
              Create your first Ipon goal and track your progress with denomination checklists.
            </p>
            <Button
              className="bg-white text-black hover:bg-neutral-200"
              onClick={() => setShowAddGoal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Goal Dialog */}
      <AddIponDialog
        open={showAddGoal || editingGoal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddGoal(false)
            setEditingGoal(null)
          }
        }}
        editGoal={editingGoal}
        onSuccess={() => router.refresh()}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Delete Goal"
        description={`Are you sure you want to delete "${deleteConfirm.goalName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}