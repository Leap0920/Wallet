# WalletWise

WalletWise is a modern personal finance tracker built with Next.js 16, Prisma, and MongoDB. It helps you manage your wallets, track transactions, set savings goals (Ipon Challenge), and manage your debts effectively.

## 🚀 Recent Features

### 💰 Debt Tracking
A comprehensive debt management system that allows you to:
- **Lent Money (Pinautang):** Track who borrowed from you, set interest rates (with smart 5% suggestions), and record payments received.
- **Borrowed Money (Utang):** Keep track of what you owe to others and your repayment progress.
- **Visualization:** Real-time progress bars and status badges (Pending, Partial, Paid) for every record.
- **Computation:** Automatic calculation of principal, interest, and remaining balances.

### 🐷 Ipon Challenge
- Set specific savings goals with target amounts and dates.
- **Smart Denominations:** Automatically generates a bill breakdown (₱1000, ₱500, etc.) to make reaching your goal easier.
- Interactive checklist to track physical cash savings.
- 

### 🌍 Multi-Currency Support
- Support for 50+ world currencies including PHP, USD, EUR, etc.
- Real-time exchange rates with automatic balance conversion.
- Personalized display currency preferences in Settings.

### 📊 Dashboard Analytics
- Visualized expense categories with interactive charts.
- 30-day balance trends and monthly income/expense summaries.

## 🛠️ Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** MongoDB with Prisma ORM
- **Styling:** Tailwind CSS
- **Authentication:** Auth.js (NextAuth)
- **Icons:** Lucide React
- **Toast Notifications:** Sonner
- **Charts:** Recharts

## ⚙️ Development

### Prerequisites
- Node.js 18+
- MongoDB instance (Local or Atlas)

### Getting Started
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file with `DATABASE_URL` and `AUTH_SECRET`.
4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

### Database Management
Whenever you modify the `schema.prisma` file, ensure you run:
```bash
npx prisma generate
```
The build script is already configured to run this automatically for deployments on platforms like Render or Vercel.

## 📄 License
This project is licensed under the MIT License.
