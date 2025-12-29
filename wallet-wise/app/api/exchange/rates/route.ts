import { NextResponse } from "next/server"
import { getExchangeRates, FALLBACK_RATES } from "@/lib/currency"

export async function GET() {
  try {
    const rates = await getExchangeRates()

    return NextResponse.json({
      rates,
      cached: true, // simplified for API response
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching exchange rates:", error)
    return NextResponse.json({
      rates: FALLBACK_RATES,
      cached: false,
      fallback: true,
      lastUpdated: new Date().toISOString(),
    })
  }
}
