"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils'

interface MonthlyChartProps {
  data: Array<{
    month: string
    income: number
    expenses: number
    net: number
  }>
  type?: 'bar' | 'line'
  displayCurrency?: string
}

export function MonthlyChart({ data, type = 'bar', displayCurrency = "PHP" }: MonthlyChartProps) {
  const formatCurrency = (value: number) => {
    return formatCurrencyUtil(value, displayCurrency)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis dataKey="month" stroke="#737373" fontSize={12} />
          <YAxis stroke="#737373" fontSize={12} tickFormatter={formatCurrency} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Income" />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Expenses" />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
        <XAxis dataKey="month" stroke="#737373" fontSize={12} />
        <YAxis stroke="#737373" fontSize={12} tickFormatter={formatCurrency} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="income" fill="#22c55e" radius={[2, 2, 0, 0]} name="Income" />
        <Bar dataKey="expenses" fill="#ef4444" radius={[2, 2, 0, 0]} name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  )
}