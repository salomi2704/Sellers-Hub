import { Component, useEffect, useState, type PropsWithChildren, type ReactNode } from 'react'
import { Bell, Bot, Boxes, ChartColumn, CircleDollarSign, ClipboardList, LayoutDashboard, PackageSearch, ShieldCheck, Truck, UserRoundCog } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { create } from 'zustand'

type Role = 'OWNER' | 'MANAGER' | 'OPERATIONS' | 'FINANCE' | 'SUPPORT' | 'ADMIN'
type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

type SessionState = {
  authenticated: boolean
  sellerId: string
  storeId: string
  role: Role
  permissions: string[]
  login: (payload: Omit<SessionState, 'login' | 'logout' | 'authenticated'>) => void
  logout: () => void
}

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

const useSessionStore = create<SessionState>((set) => ({
  authenticated: false,
  sellerId: '',
  storeId: '',
  role: 'OWNER',
  permissions: [],
  login: (payload) => set({ authenticated: true, ...payload }),
  logout: () => set({ authenticated: false, sellerId: '', storeId: '', role: 'OWNER', permissions: [] }),
}))

const performanceData = [
  { name: 'Mon', revenue: 42000, orders: 124, ctr: 4.3 },
  { name: 'Tue', revenue: 56000, orders: 182, ctr: 4.8 },
  { name: 'Wed', revenue: 61000, orders: 196, ctr: 5.4 },
  { name: 'Thu', revenue: 59000, orders: 203, ctr: 5.1 },
  { name: 'Fri', revenue: 68000, orders: 228, ctr: 6.1 },
  { name: 'Sat', revenue: 74000, orders: 254, ctr: 6.4 },
]

const baseProducts: Product[] = [
  { id: 'p-1', title: 'Wysh Portable Blender', sku: 'WB-100', brand: 'Wysh', status: 'ACTIVE', price: 2499, inventory: 128 },
  { id: 'p-2', title: 'Wysh Cold Brew Bottle', sku: 'WB-101', brand: 'Wysh', status: 'DRAFT', price: 1299, inventory: 45 },
  { id: 'p-3', title: 'Wysh Travel Kettle', sku: 'WB-102', brand: 'Wysh', status: 'ACTIVE', price: 3199, inventory: 68 },
  { id: 'p-4', title: 'Wysh Meal Jar', sku: 'WB-103', brand: 'Wysh', status: 'ARCHIVED', price: 899, inventory: 0 },
  { id: 'p-5', title: 'Wysh Smart Tumbler', sku: 'WB-104', brand: 'Wysh', status: 'ACTIVE', price: 1899, inventory: 94 },
  { id: 'p-6', title: 'Wysh Runner Bottle', sku: 'WB-105', brand: 'Wysh', status: 'ACTIVE', price: 799, inventory: 212 },
]

const comparisonOffers: Offer[] = [
  { id: 'offer-1', platform: 'Amazon', price: 2399, discount: '20% off', availability: 'In stock', eta: 'Tomorrow', affiliateUrl: 'https://example.com/amazon/offer-1', confidence: 0.98 },
  { id: 'offer-2', platform: 'Flipkart', price: 2449, discount: '18% off', availability: 'In stock', eta: '2 days', affiliateUrl: 'https://example.com/flipkart/offer-2', confidence: 0.94 },
  { id: 'offer-3', platform: 'Myntra', price: 2529, discount: '15% off', availability: 'Limited stock', eta: '3 days', affiliateUrl: 'https://example.com/myntra/offer-3', confidence: 0.89 },
]

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/onboarding', label: 'Onboarding', icon: UserRoundCog },
  { to: '/catalog', label: 'Catalog', icon: Boxes },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/shipments', label: 'Shipments', icon: Truck },
  { to: '/finance', label: 'Finance', icon: CircleDollarSign },
  { to: '/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/discovery', label: 'Discovery', icon: PackageSearch },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
]

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

const fetchProducts = async (page: number, search: string, products: Product[]) => {
  await wait(250)
  const filtered = products.filter((product) => product.title.toLowerCase().includes(search.toLowerCase()) || product.sku.toLowerCase().includes(search.toLowerCase()))
  const pageSize = 3
  return {
    data: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
  }
}

const checkSlugAvailability = async (slug: string) => {
  await wait(300)
  return { available: !['wysh', 'admin', 'seller'].includes(slug.toLowerCase()) }
}

const fakeLogin = async (email: string, password: string) => {
  await wait(300)
  if (email !== 'owner@wysh.test' || password !== 'Password@123') {
    throw new Error('Use owner@wysh.test / Password@123 to access the tenant workspace.')
  }

  return {
    sellerId: 'seller_demo',
    storeId: 'store_wysh',
    role: 'OWNER' as Role,
    permissions: ['catalog:write', 'orders:manage', 'finance:read', 'admin:read'],
  }
}

const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

class RouteErrorBoundary extends Component<PropsWithChildren, { hasError: boolean }> {
  public state = { hasError: false }

  public static getDerivedStateFromError() {
    return { hasError: true }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6 text-center text-white">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/60">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Route recovery</p>
            <h1 className="mt-4 text-3xl font-semibold">Something went wrong.</h1>
            <p className="mt-3 text-slate-300">Reload the page to restore your session and continue managing the store.</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  return (
    <RouteErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/*" element={<ProtectedRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouteErrorBoundary>
  )
}

function ProtectedRoute() {
  const authenticated = useSessionStore((state) => state.authenticated)
  return authenticated ? <Shell /> : <Navigate to="/login" replace />
}

function PermissionRoute({ children, permission }: { children: ReactNode; permission: string }) {
  const permissions = useSessionStore((state) => state.permissions)
  if (!permissions.includes(permission)) {
    return <EmptyState title="Admin access required" description="This area is limited to roles with the admin:read permission." />
  }
  return <>{children}</>
}

function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { role, sellerId, storeId, logout } = useSessionStore()
  const [toasts, setToasts] = useState<Toast[]>([])

  const pushToast = (message: string) => {
    const id = Date.now()
    setToasts((current) => [...current, { id, message }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 2500)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wysh Sellers Hub</p>
              <h1 className="text-lg font-semibold">Tenant OS</h1>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">{sellerId || 'seller_demo'}</p>
            <p className="mt-1">{storeId || 'store_wysh'} • {role}</p>
          </div>
          <nav className="mt-6 space-y-2">
            {navigation.map(({ to, label, icon: Icon }) => {
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
          <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Enterprise commerce OS</p>
              <h2 className="mt-2 text-2xl font-semibold">Secure, observable, multi-tenant seller operations</h2>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
              <Bell className="h-4 w-4 text-cyan-300" />
              Affiliate links may earn us a commission.
            </div>
          </header>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/catalog" element={<CatalogPage onToast={pushToast} />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/discovery" element={<DiscoveryPage onToast={pushToast} />} />
            <Route path="/comparison" element={<ComparisonPage />} />
            <Route path="/admin" element={<PermissionRoute permission="admin:read"><AdminPage /></PermissionRoute>} />
          </Routes>
        </main>
      </div>
      <ToastRegion toasts={toasts} />
    </div>
  )
}

function LoginPage() {
  const login = useSessionStore((state) => state.login)
  const navigate = useNavigate()
  const [email, setEmail] = useState('owner@wysh.test')
  const [password, setPassword] = useState('Password@123')
  const mutation = useMutation({
    mutationFn: () => fakeLogin(email, password),
    onSuccess: (payload) => {
      login(payload)
      navigate('/')
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-900 p-8 shadow-2xl shadow-slate-950/60">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Wysh Sellers Hub</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Run seller ops, finance, discovery, and affiliate intelligence from one control plane.</h1>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <FeatureCard title="Strict tenancy" description="Tenant claims are preserved across every operational view." />
            <FeatureCard title="Affiliate discovery" description="Match offers across marketplaces with confidence scoring." />
            <FeatureCard title="Financial correctness" description="Immutable ledger and payout readiness tracked in one workflow." />
            <FeatureCard title="Operational observability" description="Live event analytics and readiness health surfaced by design." />
          </div>
        </div>
        <form
          className="rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-2xl shadow-slate-950/60"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <h2 className="text-2xl font-semibold">Seller login</h2>
          <p className="mt-2 text-sm text-slate-400">Use the seeded owner account to access the production scaffold.</p>
          <label className="mt-6 block text-sm text-slate-300">
            Email
            <input className="input mt-2" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="mt-4 block text-sm text-slate-300">
            Password
            <input className="input mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {mutation.error instanceof Error ? <p className="mt-4 text-sm text-rose-300">{mutation.error.message}</p> : null}
          <button className="btn-primary mt-6 w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in…' : 'Access workspace'}
          </button>
          <div className="mt-4 flex justify-between text-sm text-cyan-300">
            <Link to="/forgot-password">Forgot password</Link>
            <Link to="/reset-password">Reset password</Link>
          </div>
        </form>
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
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-2xl shadow-slate-950/60">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-slate-400">{description}</p>
        <input className="input mt-6" placeholder="Email address" />
        <button type="button" className="btn-primary mt-4 w-full">{cta}</button>
        <Link className="mt-4 inline-flex text-sm text-cyan-300" to="/login">Back to login</Link>
      </div>
    </div>
  )
}

function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue" value="₹6.8L" detail="+12.4% WoW" />
        <MetricCard label="Orders" value="1,247" detail="93 awaiting packing" />
        <MetricCard label="Payouts" value="₹2.1L" detail="Next settlement in 12h" />
        <MetricCard label="Shipments" value="142" detail="18 require intervention" />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Activity trend" description="Revenue and order growth across the current trading week.">
          <ChartBox>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={3} />
                <Line type="monotone" dataKey="orders" stroke="#818cf8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
        <Panel title="Top products" description="SKU contribution snapshot for this settlement window.">
          <ChartBox>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="orders" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
      </section>
    </div>
  )
}

function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [slug, setSlug] = useState('wysh-collective')
  const debouncedSlug = useDebouncedValue(slug, 400)
  const slugQuery = useQuery({
    queryKey: ['slug-check', debouncedSlug],
    queryFn: () => checkSlugAvailability(debouncedSlug),
    enabled: debouncedSlug.trim().length > 2,
  })

  return (
    <Panel title="Seller onboarding" description="Four-step onboarding with debounced slug validation and KYC readiness.">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((value) => (
            <button key={value} type="button" className={`step ${step === value ? 'step-active' : ''}`} onClick={() => setStep(value)}>
              Step {value}
            </button>
          ))}
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          {step === 1 ? <FormBlock title="Account details" fields={["Owner name", "Business email", "Primary contact"]} /> : null}
          {step === 2 ? (
            <div>
              <h3 className="text-xl font-semibold">Store details</h3>
              <p className="mt-2 text-sm text-slate-400">Choose a unique tenant slug for customer-facing links and webhook signatures.</p>
              <input className="input mt-4" value={slug} onChange={(event) => setSlug(event.target.value)} aria-label="Store slug" />
              <div className="mt-3 text-sm">
                {slugQuery.isFetching ? 'Checking slug availability…' : slugQuery.data ? (slugQuery.data.available ? <span className="text-emerald-300">Slug available.</span> : <span className="text-amber-300">Slug already reserved.</span>) : 'Type at least 3 characters to validate.'}
              </div>
            </div>
          ) : null}
          {step === 3 ? <FormBlock title="KYC upload" fields={["PAN proof", "GST certificate", "Business registration"]} /> : null}
          {step === 4 ? <FormBlock title="Review & submit" fields={["Tenancy setup", "Webhook secrets", "Settlement profile"]} /> : null}
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep((current) => Math.max(1, current - 1))}>Back</button>
            <button type="button" className="btn-primary" onClick={() => setStep((current) => Math.min(4, current + 1))}>{step === 4 ? 'Submit onboarding' : 'Continue'}</button>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function CatalogPage({ onToast }: { onToast?: (message: string) => void }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState(baseProducts)
  const query = useQuery({
    queryKey: ['catalog', page, search, products],
    queryFn: () => fetchProducts(page, search, products),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await wait(250)
      return {
        id: `p-${products.length + 1}`,
        title: 'Wysh AI Matched Flask',
        sku: `WB-10${products.length}`,
        brand: 'Wysh',
        status: 'DRAFT' as ProductStatus,
        price: 2099,
        inventory: 36,
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['catalog'] })
      const optimisticProduct: Product = { id: `temp-${Date.now()}`, title: 'Saving draft…', sku: 'PENDING', brand: 'Wysh', status: 'DRAFT', price: 0, inventory: 0 }
      setProducts((current) => [optimisticProduct, ...current])
      return optimisticProduct.id
    },
    onSuccess: (product, _variables, temporaryId) => {
      setProducts((current) => [product, ...current.filter((entry) => entry.id !== temporaryId)])
      onToast?.('Draft product created with optimistic update.')
    },
  })

  return (
    <Panel title="Catalog management" description="Server-side pagination, optimistic updates, status workflow, and AI enrichment entry points.">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input className="input md:max-w-sm" placeholder="Search title or SKU" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary">AI Enhance Description</button>
          <button type="button" className="btn-secondary">AI SEO Title</button>
          <button type="button" className="btn-secondary">AI Tags</button>
          <button type="button" className="btn-primary" onClick={() => createMutation.mutate()}>New product</button>
        </div>
      </div>
      {query.isLoading ? <SkeletonRows /> : null}
      {query.data && query.data.data.length === 0 ? <EmptyState title="No products found" description="Adjust the search or create a new SKU to populate this tenant catalog." /> : null}
      {query.data && query.data.data.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Inventory</th>
              </tr>
            </thead>
            <tbody>
              {query.data.data.map((product) => (
                <tr key={product.id} className="border-t border-white/10 bg-slate-950/55">
                  <td className="px-4 py-4">
                    <p className="font-medium text-white">{product.title}</p>
                    <p className="text-xs text-slate-400">{product.sku} • {product.brand}</p>
                  </td>
                  <td className="px-4 py-4"><StatusPill value={product.status} /></td>
                  <td className="px-4 py-4">₹{product.price}</td>
                  <td className="px-4 py-4">{product.inventory}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between bg-white/5 px-4 py-3 text-sm text-slate-300">
            <span>Page {query.data.page} of {Math.max(1, Math.ceil(query.data.total / query.data.pageSize))}</span>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
              <button type="button" className="btn-secondary" onClick={() => setPage((current) => current + 1)} disabled={query.data.page * query.data.pageSize >= query.data.total}>Next</button>
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
  )
}

function OrdersPage() {
  return (
    <Panel title="Orders" description="Manage the NEW → CONFIRMED → PACKED → SHIPPED → DELIVERED state machine with bulk actions and document generation.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {['NEW', 'CONFIRMED', 'PACKED', 'SHIPPED'].map((status) => (
          <div key={status} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">{status}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{status === 'NEW' ? 18 : status === 'CONFIRMED' ? 44 : status === 'PACKED' ? 32 : 27}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function ShipmentsPage() {
  return (
    <Panel title="Shipments" description="Track courier state, AWB lifecycle, and exception management for every store shipment.">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          <h3 className="text-lg font-semibold">Shipment timeline</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>PENDING → label requested</li>
            <li>SCHEDULED → pickup slot confirmed</li>
            <li>IN_TRANSIT → courier checkpoint synchronized</li>
            <li>OUT_FOR_DELIVERY → ETA surfaced to support</li>
            <li>RTO → reverse logistics initiated</li>
          </ul>
        </div>
        <ChartBox>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="orders" stroke="#22d3ee" fill="rgba(34, 211, 238, 0.18)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </Panel>
  )
}

function FinancePage() {
  return (
    <Panel title="Finance & settlements" description="Ledger-derived balance visibility with payout review and reconciliation readiness.">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Available balance" value="₹4.4L" detail="Derived from immutable ledger" />
        <MetricCard label="Pending settlement" value="₹1.6L" detail="Batch closes at 23:00" />
        <MetricCard label="Reconciliation flags" value="3" detail="Duplicate payout checks pending" />
      </div>
    </Panel>
  )
}

function AnalyticsPage() {
  return (
    <Panel title="Analytics" description="Activity trends, top products, live events, CTR metrics, and affiliate performance in one reporting workspace.">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <ChartBox>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="ctr" stroke="#818cf8" fill="rgba(129, 140, 248, 0.18)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          <h3 className="text-lg font-semibold">Live events</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>product_view → 14,582</li>
            <li>affiliate_click → 1,242</li>
            <li>redirect → 1,240</li>
            <li>search → 3,994</li>
          </ul>
        </div>
      </div>
    </Panel>
  )
}

function DiscoveryPage({ onToast }: { onToast?: (message: string) => void }) {
  const [query, setQuery] = useState('portable blender')
  const [mode, setMode] = useState<'keyword' | 'url' | 'image'>('keyword')

  return (
    <Panel title="Affiliate product discovery" description="Search by keyword, URL, or image upload to compare approved affiliate offers across supported networks.">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          <div className="flex flex-wrap gap-2">
            {(['keyword', 'url', 'image'] as const).map((value) => (
              <button key={value} type="button" className={`chip ${mode === value ? 'chip-active' : ''}`} onClick={() => setMode(value)}>{value}</button>
            ))}
          </div>
          <input className="input mt-4" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Paste a URL, enter a keyword, or attach an image URL" />
          <button type="button" className="btn-primary mt-4" onClick={() => onToast?.(`Discovery refreshed for ${query}.`)}>Run approved discovery</button>
          <p className="mt-3 text-sm text-slate-400">Only approved affiliate APIs, feeds, and integrations are used.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          <h3 className="text-lg font-semibold">Matched offer set</h3>
          <p className="mt-2 text-sm text-slate-400">AI confidence blends exact identifiers, semantic title matching, and visual similarity.</p>
          <div className="mt-4 space-y-3">
            {comparisonOffers.map((offer) => (
              <div key={offer.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{offer.platform}</p>
                  <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-200">{Math.round(offer.confidence * 100)}% confidence</span>
                </div>
                <p className="mt-3 text-2xl font-semibold">₹{offer.price}</p>
                <p className="mt-1 text-sm text-slate-400">{offer.discount} • {offer.eta} • {offer.availability}</p>
                <Link className="mt-4 inline-flex text-sm text-cyan-300" to="/comparison">Review comparison</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

function ComparisonPage() {
  return (
    <Panel title="Product comparison" description="Canonical product record with matched offers, confidence scoring, and affiliate-compliant call-to-action blocks.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-slate-950 p-6">
          <div className="hero-image">WB</div>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Wysh Portable Blender</h3>
              <p className="mt-2 text-sm text-slate-300">Canonical affiliate product • category: Home Appliances</p>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-200">98% exact match</span>
          </div>
        </div>
        <div className="space-y-3">
          {comparisonOffers.map((offer) => (
            <div key={offer.id} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{offer.platform}</p>
                  <p className="text-sm text-slate-400">{offer.availability} • ETA {offer.eta} • {offer.discount}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold">₹{offer.price}</p>
                  <a className="btn-primary mt-2 inline-flex" href={offer.affiliateUrl} target="_blank" rel="noreferrer">Buy now</a>
                </div>
              </div>
            </div>
          ))}
          <p className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">Affiliate links may earn us a commission.</p>
        </div>
      </div>
    </Panel>
  )
}

function AdminPage() {
  return (
    <Panel title="Admin panel" description="Seller governance, disputes, payout controls, feature flags, webhook monitoring, and immutable audit views.">
      <div className="grid gap-4 md:grid-cols-2">
        <FeatureCard title="Seller management" description="Review KYC posture, risk flags, and tenant entitlements." />
        <FeatureCard title="Webhook monitoring" description="Inspect signature failures, retries, and delivery logs." />
        <FeatureCard title="Payout controls" description="Approve or pause settlement batches with auditable actions." />
        <FeatureCard title="Audit logs" description="Access immutable operational history for support and compliance." />
      </div>
    </Panel>
  )
}

function Panel({ title, description, children }: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60">
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
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/60">
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

function FormBlock({ title, fields }: { title: string; fields: string[] }) {
  return (
    <div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <input key={field} className="input" placeholder={field} />
        ))}
      </div>
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="mt-6 space-y-3">
      {[1, 2, 3].map((value) => (
        <div key={value} className="h-20 animate-pulse rounded-3xl bg-white/5" />
      ))}
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-white/20 bg-slate-950/50 p-10 text-center">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  )
}

function StatusPill({ value }: { value: ProductStatus }) {
  const tone = value === 'ACTIVE' ? 'bg-emerald-400/15 text-emerald-200' : value === 'DRAFT' ? 'bg-amber-400/15 text-amber-200' : 'bg-slate-400/15 text-slate-200'
  return <span className={`rounded-full px-3 py-1 text-xs ${tone}`}>{value}</span>
}

function ChartBox({ children }: PropsWithChildren) {
  return <div className="h-[320px] rounded-3xl border border-white/10 bg-slate-950/70 p-4">{children}</div>
}

function ToastRegion({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 space-y-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="rounded-2xl border border-cyan-400/20 bg-slate-900/90 px-4 py-3 text-sm text-cyan-100 shadow-lg shadow-slate-950/60">
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export default App
