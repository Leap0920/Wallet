"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface ExpenseDonutChartProps {
  data: Array<{ name: string; value: number; color: string }>
  total: number
  showBalance: boolean
}

const COLORS = ['#3b82f6', '#f59e0b', '#6b7280', '#8b5cf6', '#22c55e', '#ef4444', '#06b6d4', '#ec4899']

export function ExpenseDonutChart({ data, total, showBalance }: ExpenseDonutChartProps) {
  const formatCurrency = (amount: number) => {
    return `₱${Math.abs(amount).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  // Assign colors to data
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length]
  }))

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48" style={{ minWidth: 192, minHeight: 192 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={1}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-neutral-500">All</p>
          <p className="text-lg font-semibold text-white">
            {showBalance ? formatCurrency(total) : "••••"}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {chartData.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-neutral-400 capitalize">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
