import { Component, useEffect, useState } from 'react'
import { Bell, Bot, Boxes, ChartColumn, CircleDollarSign, LayoutDashboard, PackageSearch, ShieldCheck, Truck, UserRoundCog } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { create } from 'zustand'

import { login } from './api'
import { setAuthToken, getCurrentSeller, apiFetch } from './api'

type Role = 'OWNER' | 'MANAGER' | 'OPERATIONS' | 'FINANCE' | 'SUPPORT' | 'ADMIN'
type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

type Product = {
  id: string
  title: string
  sku: string
  brand: string
  status: ProductStatus
  price: number
  inventory: number
}

type Offer = {
  id: string
  platform: string
  price: number
  discount: string
  availability: string
  eta: string
  affiliateUrl: string
  confidence: number
}

type Toast = { id: number; message: string }

const useSessionStore = create<SessionState>((set, get) => ({
  authenticated: false,
  sellerId: '',
  storeId: '',
  role: 'OWNER',
  permissions: [],
  login: (payload: Omit<SessionState, 'login' | 'logout' | 'authenticated'>) => set({ authenticated: true, ...payload }),
  logout: () => {
    set({ authenticated: false, sellerId: '', storeId: '', role: 'OWNER', permissions: [] })
    localStorage.removeItem('wyh_auth_token')
    localStorage.removeItem('wyh_refresh_token')
    navigate('/login')
  },
}))

type SessionState = {
  authenticated: boolean
  sellerId: string
  storeId: string
  role: Role
  permissions: string[]
  login: (payload: Omit<SessionState, 'login' | 'logout' | 'authenticated'>) => void
  logout: () => void
}

@Component
@Component
function App() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { sellerId, storeId } = getCurrentSeller()
  const [toasts, setToasts] = useState<Toast[]>([])
  
  useEffect(() => {
    const token = localStorage.getItem('wyh_auth_token')
    if (token) {
      setAuthToken(token)
      // Verify token by fetching dashboard summary
      apiFetch('dashboard/summary').then(
        () => setAuthenticated(true),
        () => (setAuthToken(''), localStorage.removeItem('wyh_refresh_token'))
      )
    } else {
      setAuthenticated(false)
    }
  }, [setAuthenticated])

  const [authenticated, setAuthenticated] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const pushToast = (message: string) => {
    const id = Date.now()
    setToasts((current) => [...current, { id, message }])
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      2500
    )
  }

  const navigation = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/catalog', label: 'Catalog', icon: Boxes },
    { to: '/orders', label: 'Orders', icon: ClipboardList },
    { to: '/finance', label: 'Finance', icon: CircleDollarSign },
    { to: '/discovery', label: 'Discovery', icon: PackageSearch },
    { to: '/admin', label: 'Admin', icon: ShieldCheck },
  ]

  const login = async (email: string, password: string) => {
    try {
      const response = await login({ email, password })
      setAuthToken(response.accessToken)
      localStorage.setItem('wyh_refresh_token', response.refreshToken || '')
      setAuthenticated(true)
      navigate('/')
    } catch (error) {
      pushToast(`Login failed: ${error.message}`)
    }
  }

  const logout = () => {
    getSessionStoreState().logout()
  }

  const toggleSearch = (value: string) => setSearch(value)

  const authenticatedRoutes = navigation.filter((n) => n.to !== '/login' && n.to !== '/forgot-password' && n.to !== '/reset-password')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {authenticated ? (
        <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wysh Sellers Hub</p>
                <h1 className="text-lg font-semibold">Tenant OS</h1>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">{sellerId || 'seller_demo'}</p>
              <p className="mt-1">{storeId || 'store_wysh'} • {role}</p>
            </div>
            <nav className="mt-6 space-y-2">
              {authenticatedRoutes.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${active ? 'bg-cyan-400/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <button
              type="button"
              className="mt-6 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
              onClick={() => {
                logout()
                pushToast('Signed out successfully.')
                navigate('/login')
              }}
            >
              Sign out
            </button>
          </aside>

          <main className="space-y-6">
            <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/60 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Enterprise commerce OS</p>
                <h2 className="mt-2 text-2xl font-semibold">Secure, observable, multi-tenant seller operations</h2>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                <Bell className="h-4 w-4 text-cyan-300" />
                Affiliate links may earn us a commission.
              </div>
            </header>

            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/*" element={<ProtectedRoute />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-900 p-8 shadow-2xl shadow-slate-950/60">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Wysh Sellers Hub</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">Run seller ops, finance, discovery, and affiliate intelligence from one control plane.</h1>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <FeatureCard title="Strict tenancy" description="Tenant claims are preserved across every operational view." />
              <FeatureCard title="Affiliate discovery" description="Match offers across marketplaces with confidence scoring." />
              <FeatureCard title="Financial correctness" description="Immutable ledger and payout readiness tracked in one workflow." />
              <FeatureCard title="Operational observability" description="Live event analytics and readiness health surfaced by design." />
            </div>
            <form
              className="rounded-3xl border border-white/10 bg-white/85 p-8 shadow-2xl shadow-slate-950/60"
              onSubmit={(event) => {
                event.preventDefault()
                const email = (document.querySelector('input[type="email"]') as HTMLInputElement).value
                const password = (document.querySelector('input[type="password"]') as HTMLInputElement).value
                login(email, password)
              }}
            >
              <h2 className="text-2xl font-semibold">Seller login</h2>
              <p className="mt-2 text-sm text-slate-400">Use the seeded owner account to access the tenant workspace.</p>
              <label className="mt-6 block text-sm text-slate-300">
                Email
                <input className="input mt-2" type="email" placeholder="owner@wysh.test" />
              </label>
              <label className="mt-4 block text-sm text-slate-300">
                Password
                <input className="input mt-2" type="password" placeholder="Password@123" />
              </label>
              <button className="btn-primary mt-6 w-full" type="submit" disabled={true}>
                Access workspace
              </button>
              <div className="mt-4 flex justify-between text-sm text-cyan-300">
                <Link to="/forgot-password">Forgot password</Link>
                <Link to="/reset-password">Reset password</Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function LoginPage() {
  const [email, setEmail] = useState('owner@wysh.test')
  const [password, setPassword] = useState('Password@123')
  const mutation = useMutation({
    mutationFn: ({ email: string, password: string }) => login({ email, password }),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="grid w-full max-w-lg gap-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/60">
          <h1 className="text-2xl font-semibold">Seller login</h1>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                const result = await mutation.mutateAsync({ email, password })
                setAuthToken(result.accessToken)
                localStorage.setItem('wyh_refresh_token', result.refreshToken || '')
                setAuthenticated(true)
                navigate('/')
              } catch (error: any) {
                pushToast(`Login failed: ${error.message}`)
              }
            }}
          >
            <h2 className="text-2xl font-semibold">Seller login</h2>
            <p className="mt-2 text-sm text-slate-400">Use the seeded owner account to access the tenant workspace.</p>
            <label className="mt-6 block text-sm text-slate-300">
              Email
              <input className="input mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="mt-4 block text-sm text-slate-300">
              Password
              <input className="input mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {mutation.error instanceof Error ? <p className="mt-4 text-sm text-rose-300">{mutation.error.message}</p> : null}
            <button className="btn-primary mt-6 w-full" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Signing in…' : 'Access workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function ForgotPasswordPage() {
  return <SimpleAuthPage title="Forgot password" description="Trigger a secure recovery workflow with throttled email delivery and audit logging." cta="Send reset link" />
}

function ResetPasswordPage() {
  return <SimpleAuthPage title="Reset password" description="Refresh the credential pair and invalidate previous refresh sessions." cta="Set new password" />
}

function SimpleAuthPage({ title, description, cta }: { title: string; description: string; cta: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/60">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-slate-400">{description}</p>
        <input className="input mt-6" placeholder="Email address" />
        <button type="button" className="btn-primary mt-4 w-full">{cta}</button>
        <Link className="mt-4 inline-flex text-sm text-cyan-300" to="/login">Back to login</Link>
      </div>
    </div>
  )
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/60">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/60">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-cyan-200">{detail}</p>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  )
}