export const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "CNY", "CHF",
  "PHP", "SGD", "HKD", "KRW", "TWD", "THB", "MYR", "IDR", "VND", "INR", "PKR", "BDT", "AUD", "NZD",
  "CAD", "MXN", "BRL", "ARS", "CLP", "COP", "PEN",
  "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "TRY", "RUB", "UAH",
  "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "ILS", "EGP", "ZAR", "NGN", "KES",
  "BTC", "ETH"
]

export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 157.5,
  CNY: 7.24,
  CHF: 0.90,
  PHP: 56.5,
  SGD: 1.35,
  HKD: 7.82,
  KRW: 1320,
  TWD: 31.5,
  THB: 35.2,
  MYR: 4.47,
  IDR: 15800,
  VND: 24500,
  INR: 83.4,
  PKR: 278,
  BDT: 110,
  AUD: 1.55,
  NZD: 1.68,
  CAD: 1.36,
  MXN: 17.2,
  BRL: 4.97,
  ARS: 365,
  CLP: 885,
  COP: 3950,
  PEN: 3.72,
  SEK: 10.5,
  NOK: 10.8,
  DKK: 6.92,
  PLN: 4.02,
  CZK: 22.8,
  HUF: 358,
  RON: 4.62,
  TRY: 29.5,
  RUB: 92,
  UAH: 37.5,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.39,
  ILS: 3.65,
  EGP: 30.9,
  ZAR: 18.8,
  NGN: 790,
  KES: 153,
  BTC: 0.000024,
  ETH: 0.00043,
}

let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export async function getExchangeRates() {
  const now = Date.now()

  if (cachedRates && now - cachedRates.timestamp < CACHE_DURATION) {
    return cachedRates.rates
  }

  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) throw new Error("Failed to fetch")

    const data = await response.json()
    const rates: Record<string, number> = { USD: 1 }
    
    for (const code of SUPPORTED_CURRENCIES) {
      if (code === "USD") continue
      rates[code] = data.rates[code] || FALLBACK_RATES[code] || 1
    }

    cachedRates = { rates, timestamp: now }
    return rates
  } catch (error) {
    console.error("Currency conversion error, using fallback:", error)
    return FALLBACK_RATES
  }
}
