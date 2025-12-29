"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { convertCurrency, formatCurrency, CurrencyCode, CURRENCIES } from "@/lib/utils"

interface CurrencyContextType {
  displayCurrency: CurrencyCode
  setDisplayCurrency: (currency: CurrencyCode) => void
  rates: Record<string, number>
  isLoading: boolean
  convert: (amount: number, fromCurrency: string, toCurrency?: string) => number
  formatAmount: (amount: number, fromCurrency?: string) => string
  refreshRates: () => Promise<void>
  lastUpdated: string | null
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: React.ReactNode
  initialDisplayCurrency?: CurrencyCode
}

export function CurrencyProvider({ children, initialDisplayCurrency = "PHP" }: CurrencyProviderProps) {
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(initialDisplayCurrency)
  const [rates, setRates] = useState<Record<string, number>>({
    USD: 1,
    PHP: 56.5,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 157.5,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/exchange/rates")
      if (response.ok) {
        const data = await response.json()
        setRates(data.rates)
        setLastUpdated(data.lastUpdated)
      }
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchRates])

  const convert = useCallback(
    (amount: number, fromCurrency: string, toCurrency?: string) => {
      const targetCurrency = toCurrency || displayCurrency
      return convertCurrency(amount, fromCurrency, targetCurrency, rates)
    },
    [displayCurrency, rates]
  )

  // Format amount in display currency (optionally converting from another currency)
  const formatAmount = useCallback(
    (amount: number, fromCurrency?: string) => {
      const from = fromCurrency || displayCurrency
      const convertedAmount = from === displayCurrency 
        ? amount 
        : convertCurrency(amount, from, displayCurrency, rates)
      return formatCurrency(convertedAmount, displayCurrency)
    },
    [displayCurrency, rates]
  )

  const refreshRates = useCallback(async () => {
    await fetchRates()
  }, [fetchRates])

  return (
    <CurrencyContext.Provider
      value={{
        displayCurrency,
        setDisplayCurrency,
        rates,
        isLoading,
        convert,
        formatAmount,
        refreshRates,
        lastUpdated,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}

// Hook for getting currency options for dropdowns
export function useCurrencyOptions() {
  return CURRENCIES.map(c => ({
    value: c.code,
    label: `${c.symbol} ${c.code} - ${c.name}`,
    symbol: c.symbol,
  }))
}
