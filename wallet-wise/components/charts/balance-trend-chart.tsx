"use client"

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface BalanceTrendChartProps {
  data: Array<{ date: string; balance: number }>
  showBalance: boolean
}

export function BalanceTrendChart({ data, showBalance }: BalanceTrendChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
  }

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-neutral-500 text-sm">
        No data yet
      </div>
    )
  }

  // Mask data if balance is hidden
  const chartData = showBalance
    ? data
    : data.map(d => ({ ...d, balance: 0 }))

  const minBalance = Math.min(...data.map(d => d.balance))
  const maxBalance = Math.max(...data.map(d => d.balance))
  const padding = (maxBalance - minBalance) * 0.1 || 1000

  return (
    <div className="h-32" style={{ minHeight: 128 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={1}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke="#525252"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#525252"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
            domain={[minBalance - padding, maxBalance + padding]}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#262626',
              border: '1px solid #404040',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#a3a3a3' }}
            formatter={(value) => [
              showBalance ? `₱${Number(value).toLocaleString()}` : '••••',
              'Balance'
            ]}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#balanceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
