"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, Minus, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface AddIponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editGoal?: {
    id: string
    name: string
    targetAmount: number
    targetDate: Date | null
    denominations: Array<{ denom: number; required: number; checked: number }> | null
  } | null
}

const AVAILABLE_DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1]

function generateSmartDenominations(amount: number) {
  // Create a more balanced breakdown with smaller bills for easier achievement
  const result: { denom: number; required: number }[] = []
  let remaining = amount

  // Strategy: Use larger bills sparingly, focus on 100s, 50s, 20s, 10s
  const strategy = [
    { denom: 1000, maxCount: Math.floor(amount / 2000) }, // Use 1000s only if amount > 2000, max half
    { denom: 500, maxCount: Math.floor(amount / 1000) },  // Use 500s more liberally
    { denom: 200, maxCount: Math.floor(amount / 800) },   // Use 200s moderately
    { denom: 100, maxCount: Infinity },                   // Use 100s freely
    { denom: 50, maxCount: Infinity },                    // Use 50s freely
    { denom: 20, maxCount: Infinity },                    // Use 20s freely
    { denom: 10, maxCount: Infinity },                    // Use 10s freely
    { denom: 5, maxCount: Infinity },                     // Use 5s freely
    { denom: 1, maxCount: Infinity }                      // Use 1s freely
  ]

  for (const { denom, maxCount } of strategy) {
    const idealCount = Math.floor(remaining / denom)
    const actualCount = Math.min(idealCount, maxCount)

    if (actualCount > 0) {
      result.push({ denom, required: actualCount })
      remaining -= actualCount * denom
    }
  }

  return result
}

export function AddIponDialog({ open, onOpenChange, onSuccess, editGoal = null }: AddIponDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [customizeMode, setCustomizeMode] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    targetDate: ""
  })
  const [customDenominations, setCustomDenominations] = useState<{ denom: number; required: number }[]>([])

  // Initialize form data when editing
  useEffect(() => {
    if (editGoal) {
      setFormData({
        name: editGoal.name,
        targetAmount: editGoal.targetAmount.toString(),
        targetDate: editGoal.targetDate ? editGoal.targetDate.toISOString().split('T')[0] : ""
      })
      if (editGoal.denominations) {
        setCustomDenominations(editGoal.denominations.map(d => ({ denom: d.denom, required: d.required })))
        setCustomizeMode(true)
      }
    } else {
      setFormData({ name: "", targetAmount: "", targetDate: "" })
      setCustomDenominations([])
      setCustomizeMode(false)
    }
  }, [editGoal, open])

  const suggestedDenominations = formData.targetAmount
    ? generateSmartDenominations(parseFloat(formData.targetAmount))
    : []

  // Use custom denominations when in customize mode, otherwise use suggestions
  const activeDenominations = customizeMode ? customDenominations : suggestedDenominations

  const totalFromDenominations = activeDenominations.reduce((sum, d) => sum + (d.denom * d.required), 0)
  const targetAmount = parseFloat(formData.targetAmount) || 0
  const difference = targetAmount - totalFromDenominations

  const handleCustomize = () => {
    if (!customizeMode) {
      // When entering customize mode, copy the suggestions as starting point
      setCustomDenominations(suggestedDenominations.length > 0 ? [...suggestedDenominations] : [])
    }
    setCustomizeMode(!customizeMode)
  }

  const updateDenomination = (denom: number, change: number) => {
    setCustomDenominations(prev => {
      const existing = prev.find(d => d.denom === denom)
      if (existing) {
        const newRequired = Math.max(0, existing.required + change)
        if (newRequired === 0) {
          return prev.filter(d => d.denom !== denom)
        }
        return prev.map(d => d.denom === denom ? { ...d, required: newRequired } : d)
      } else if (change > 0) {
        return [...prev, { denom, required: 1 }].sort((a, b) => b.denom - a.denom)
      }
      return prev
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (Math.abs(difference) > 0.01) {
      toast.error(`Denomination total (₱${totalFromDenominations}) doesn't match target amount (₱${targetAmount})`)
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        denominations: activeDenominations.map(d => ({ ...d, checked: 0 }))
      }

      const url = editGoal ? `/api/ipon/${editGoal.id}` : "/api/ipon"
      const method = editGoal ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error(`Failed to ${editGoal ? 'update' : 'create'} goal`)

      toast.success(`Ipon goal ${editGoal ? 'updated' : 'created'}`)
      setFormData({ name: "", targetAmount: "", targetDate: "" })
      setCustomDenominations([])
      setCustomizeMode(false)
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(`Failed to ${editGoal ? 'update' : 'create'} goal`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-800 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editGoal ? 'Edit Ipon Goal' : 'New Ipon Goal'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-neutral-300 text-sm">Goal Name</Label>
            <Input
              placeholder="e.g., New Mouse"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300 text-sm">Target Amount (₱)</Label>
            <Input
              type="number"
              placeholder="800"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300 text-sm">Target Date (Optional)</Label>
            <Input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="bg-neutral-800 border-neutral-700 text-white"
            />
          </div>

          {/* Denomination Breakdown */}
          {(suggestedDenominations.length > 0 || customizeMode) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-neutral-300 text-sm">Bill Breakdown</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCustomize}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  {customizeMode ? 'Use Suggestion' : 'Customize'}
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
                {customizeMode ? (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-400">Customize your bill breakdown:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AVAILABLE_DENOMINATIONS.map((denom) => {
                        const current = customDenominations.find(d => d.denom === denom)
                        const count = current?.required || 0
                        return (
                          <div key={denom} className="flex items-center justify-between bg-neutral-700/50 rounded-lg p-1.5 px-3 border border-neutral-600">
                            <span className="text-sm font-medium text-white">₱{denom}</span>
                            <div className="flex items-center gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-neutral-600 rounded-md"
                                onClick={() => updateDenomination(denom, -1)}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <span className="text-sm font-bold text-white w-8 text-center">{count}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-neutral-600 rounded-md"
                                onClick={() => updateDenomination(denom, 1)}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="pt-2 border-t border-neutral-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Total:</span>
                        <span className={`font-medium ${Math.abs(difference) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                          ₱{totalFromDenominations}
                        </span>
                      </div>
                      {Math.abs(difference) > 0.01 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-500">Difference:</span>
                          <span className="text-red-400">₱{difference.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-neutral-400 mb-2">Smart suggestion for easier saving:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedDenominations.map((item) => (
                        <span key={item.denom} className="text-sm text-white bg-neutral-700 px-2 py-1 rounded">
                          {item.required}x ₱{item.denom}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Uses more smaller bills (₱100, ₱50, ₱20) for easier achievement
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-neutral-200"
            disabled={isLoading || (customizeMode && Math.abs(difference) > 0.01)}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              editGoal ? 'Update Goal' : 'Create Goal'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}