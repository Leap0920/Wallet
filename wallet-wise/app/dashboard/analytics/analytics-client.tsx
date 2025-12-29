"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthlyChart } from "@/components/charts/monthly-chart"
import { formatCurrency } from "@/lib/utils"
import { useCurrency } from "@/components/providers/currency-provider"

interface AnalyticsData {
  monthlyData: Array<{
    month: string
    income: number
    expenses: number
    net: number
  }>
  categoryData: Array<{
    name: string
    value: number
  }>
  totalIncome: number
  totalExpenses: number
  transactionCount: number
}

interface AnalyticsClientProps {
  data: AnalyticsData
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')
  const { displayCurrency } = useCurrency()

  const netIncome = data.totalIncome - data.totalExpenses
  const savingsRate = data.totalIncome > 0 ? (netIncome / data.totalIncome) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-neutral-500 text-sm">Financial insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-white">{formatCurrency(data.totalIncome, displayCurrency)}</div>
            <p className="text-xs text-neutral-500">Last 6 months</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-white">{formatCurrency(data.totalExpenses, displayCurrency)}</div>
            <p className="text-xs text-neutral-500">Last 6 months</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-semibold ${netIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(netIncome, displayCurrency)}
            </div>
            <p className="text-xs text-neutral-500">{netIncome >= 0 ? 'Positive' : 'Negative'}</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-white">{savingsRate.toFixed(1)}%</div>
            <p className="text-xs text-neutral-500">
              {savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs work'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white font-medium">Monthly Trends</CardTitle>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'bar' | 'line')}>
            <TabsList className="bg-neutral-800 border-neutral-700">
              <TabsTrigger value="bar" className="data-[state=active]:bg-neutral-700 text-xs">Bar</TabsTrigger>
              <TabsTrigger value="line" className="data-[state=active]:bg-neutral-700 text-xs">Line</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {data.monthlyData.length > 0 ? (
            <MonthlyChart data={data.monthlyData} type={chartType} displayCurrency={displayCurrency} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-neutral-500">
              <div className="text-center">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No data yet</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      {data.categoryData.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white font-medium">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.categoryData.slice(0, 5).map((category, index) => {
                const percentage = (category.value / data.totalExpenses) * 100
                return (
                  <div key={category.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-300 capitalize">{category.name}</span>
                      <span className="text-white font-medium">{formatCurrency(category.value, displayCurrency)}</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5">
                      <div 
                        className="bg-neutral-400 h-1.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}