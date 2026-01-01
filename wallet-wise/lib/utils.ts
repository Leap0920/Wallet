import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Supported currencies with their metadata
export const CURRENCIES = [
  // Major currencies
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc", locale: "de-CH" },

  // Asia Pacific
  { code: "PHP", symbol: "₱", name: "Philippine Peso", locale: "en-PH" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", locale: "zh-HK" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", locale: "ko-KR" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar", locale: "zh-TW" },
  { code: "THB", symbol: "฿", name: "Thai Baht", locale: "th-TH" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", locale: "ms-MY" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", locale: "id-ID" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", locale: "vi-VN" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", locale: "en-PK" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", locale: "bn-BD" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", locale: "en-NZ" },

  // Americas
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", locale: "es-MX" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
  { code: "ARS", symbol: "$", name: "Argentine Peso", locale: "es-AR" },
  { code: "CLP", symbol: "$", name: "Chilean Peso", locale: "es-CL" },
  { code: "COP", symbol: "$", name: "Colombian Peso", locale: "es-CO" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol", locale: "es-PE" },

  // Europe
  { code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv-SE" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", locale: "nb-NO" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", locale: "da-DK" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", locale: "pl-PL" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", locale: "cs-CZ" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint", locale: "hu-HU" },
  { code: "RON", symbol: "lei", name: "Romanian Leu", locale: "ro-RO" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", locale: "tr-TR" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", locale: "ru-RU" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia", locale: "uk-UA" },

  // Middle East & Africa
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", locale: "ar-SA" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal", locale: "ar-QA" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", locale: "ar-KW" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar", locale: "ar-BH" },
  { code: "OMR", symbol: "﷼", name: "Omani Rial", locale: "ar-OM" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel", locale: "he-IL" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", locale: "ar-EG" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", locale: "en-NG" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", locale: "en-KE" },

  // Crypto (display only)
  { code: "BTC", symbol: "₿", name: "Bitcoin", locale: "en-US" },
  { code: "ETH", symbol: "Ξ", name: "Ethereum", locale: "en-US" },
] as const

export type CurrencyCode = typeof CURRENCIES[number]["code"]

// Get currency metadata by code
export function getCurrency(code: string) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0]
}

// Format amount with currency symbol
export function formatCurrency(amount: number, currencyCode: string = "PHP"): string {
  const currency = getCurrency(currencyCode)
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: currency.code === "JPY" ? 0 : 2,
    maximumFractionDigits: currency.code === "JPY" ? 0 : 2,
  }).format(amount)
}

// Format amount with absolute value (for display purposes)
export function formatCurrencyAbs(amount: number, currencyCode: string = "PHP"): string {
  return formatCurrency(Math.abs(amount), currencyCode)
}

// Convert amount between currencies using exchange rates
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount

  // Rates are relative to USD (base currency)
  const fromRate = rates[fromCurrency] || 1
  const toRate = rates[toCurrency] || 1

  // Convert: amount -> USD -> target currency
  const amountInUSD = amount / fromRate
  return amountInUSD * toRate
}

export const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Salary",
  "Freelance",
  "Gift",
  "Other"
]
