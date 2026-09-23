import { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import api, { getImageUrl } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const ranges = [
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
];

// A wider, more distinct spread of hues (still warm/earthy) so each product
// slice in the pie chart is easy to tell apart at a glance.
const PIE_COLORS = ['#6F4A32', '#C2703D', '#3D8C6F', '#4A6FA5', '#B5507A', '#8C6544', '#5C8C3D', '#A9805F', '#7A5AA6', '#CB9C3D'];
const STATUS_COLORS: Record<string, string> = {
  Preparing: '#CBB694',
  'To Ship': '#A9805F',
  'To Receive': '#8C6544',
  Completed: '#3D8C6F',
  Cancelled: '#C0392B',
};

const monthOptions = () => {
  const now = new Date();
  const opts: { label: string; year: number; month: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }), year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return opts;
};

const yearOptions = () => {
  const now = new Date();
  return Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
};

// Fills in every day/week-day/month of the selected period with a 0 when
// there were no sales that day, so the line chart always draws a full,
// continuous line where ups and downs are actually visible — instead of
// only plotting the handful of days that happened to have an order.
const buildFullSeries = (range: string, series: { date: string; total: number }[], month: { year: number; month: number }, year: number) => {
  const map = new Map(series.map((s) => [s.date, s.total]));
  const pad = (n: number) => String(n).padStart(2, '0');

  if (range === 'week') {
    const now = new Date();
    const dow = now.getDay() === 0 ? 7 : now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (dow - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), total: map.get(key) || 0 };
    });
  }
  if (range === 'year') {
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${pad(i + 1)}`;
      const d = new Date(year, i, 1);
      return { date: d.toLocaleString('en-US', { month: 'short' }), total: map.get(key) || 0 };
    });
  }
  // month
  const daysInMonth = new Date(month.year, month.month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const key = `${month.year}-${pad(month.month)}-${pad(i + 1)}`;
    return { date: String(i + 1), total: map.get(key) || 0 };
  });
};

const peso = (n: number) => `₱${Math.round(n || 0).toLocaleString()}`;

const StatCard = ({ icon, label, value, tone = 'default' }: { icon: string; label: string; value: string | number; tone?: 'default' | 'danger' | 'warn' | 'good' }) => (
  <div className="card-surface p-4">
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm mb-2 ${
        tone === 'danger' ? 'bg-red-50 text-red-500' : tone === 'warn' ? 'bg-amber-50 text-amber-600' : tone === 'good' ? 'bg-emerald-50 text-emerald-600' : 'bg-olive/10 text-oliveDark'
      }`}
    >
      <i className={`fas ${icon}`} />
    </div>
    <p className="text-xs text-bark/50">{label}</p>
    <p className="font-display text-xl text-bark truncate">{value}</p>
  </div>
);

const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <i className={`fas ${icon} text-oliveDark`} />
    <h2 className="font-display text-lg text-bark">{title}</h2>
  </div>
);

const AdminDashboard = () => {
  const [range, setRange] = useState('month');
  const months = useMemo(monthOptions, []);
  const years = useMemo(yearOptions, []);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: any = { range };
    if (range === 'month') { params.year = selectedMonth.year; params.month = selectedMonth.month; }
    if (range === 'year') { params.year = selectedYear; }

    Promise.all([
      api.get('/admin/analytics', { params }),
      api.get('/admin/best-sellers'),
      api.get('/admin/overview'),
    ]).then(([a, b, o]) => {
      setAnalytics(a.data);
      setBestSellers(b.data);
      setOverview(o.data);
    }).finally(() => setLoading(false));
  }, [range, selectedMonth, selectedYear]);

  if (loading || !analytics || !overview) return <LoadingSpinner label="Loading analytics..." />;

  // Top 10 best sellers only.
  const topBestSellers = bestSellers.slice(0, 10);
  const pieData = topBestSellers.slice(0, 8).map((b) => ({ name: b.product.name, value: b.revenue, image: b.product.images?.[0] }));
  const fullSeries = buildFullSeries(range, analytics.series, selectedMonth, selectedYear);

  const growth = overview.sales.growthPercent || 0;
  const growthUp = growth >= 0;

  // Only surface the alerts that genuinely need attention at a glance here —
  // low stock / needs-processing / new-orders-today counts are already
  // covered by the Products, Orders and notification bell elsewhere.
  const alerts: { icon: string; text: string; tone: 'danger' | 'warn' | 'good' }[] = [];
  if (overview.alerts.outOfStock > 0) alerts.push({ icon: 'fa-circle-xmark', text: `${overview.alerts.outOfStock} product${overview.alerts.outOfStock !== 1 ? 's are' : ' is'} out of stock`, tone: 'danger' });
  if (overview.alerts.refundRequests > 0) alerts.push({ icon: 'fa-rotate-left', text: `${overview.alerts.refundRequests} refund request${overview.alerts.refundRequests !== 1 ? 's' : ''} need review`, tone: 'danger' });

  const orderStatusData = overview.charts.orderStatusDistribution.map((s: any) => ({ name: s.status, value: s.count }));
  const categoryData = overview.charts.salesByCategory.slice(0, 8);
  const locationData = overview.charts.salesByLocation;

  // Only the 10 most recent orders, and the top 5 customers.
  const recentOrders = (overview.ordersOverview.recent || []).slice(0, 10);
  const topCustomers = (overview.customers.top || []).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* ALERTS */}
      {alerts.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold ${
                a.tone === 'danger' ? 'bg-red-50 text-red-600' : a.tone === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <i className={`fas ${a.icon}`} /> <span className="truncate">{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* SALES OVERVIEW */}
      <div>
        <SectionHeader title="Sales Overview" icon="fa-chart-line" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="fa-sun" label="Today's Sales" value={peso(overview.sales.today)} />
          <StatCard icon="fa-calendar-week" label="This Week" value={peso(overview.sales.week)} />
          <StatCard icon="fa-calendar-days" label="This Month" value={peso(overview.sales.month)} />
          <StatCard icon="fa-sack-dollar" label="Total Revenue (All Time)" value={peso(overview.sales.allTime)} />
          <StatCard icon="fa-hand-holding-dollar" label="Net Revenue" value={peso(overview.sales.netRevenue)} />
          <StatCard icon="fa-receipt" label="Average Order Value" value={peso(overview.sales.averageOrderValue)} />
          <StatCard
            icon={growthUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}
            label="Growth vs Last Month"
            value={`${growthUp ? '+' : ''}${growth.toFixed(1)}%`}
            tone={growthUp ? 'good' : 'danger'}
          />
          <StatCard icon="fa-boxes-packing" label="Total Orders (All Time)" value={overview.sales.totalOrders} />
        </div>
      </div>

      {/* CHARTS: revenue line + best-seller pie */}
      <div className="card-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-lg text-bark">Sales Chart — {analytics.label}</h2>
          <div className="flex flex-wrap gap-2 items-center">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  range === r.key ? 'bg-oliveDark text-paper border-oliveDark' : 'border-tan/50 text-ink'
                }`}
              >
                {r.label}
              </button>
            ))}
            {range === 'month' && (
              <select
                className="input-field !w-auto !py-1.5 text-xs"
                value={`${selectedMonth.year}-${selectedMonth.month}`}
                onChange={(e) => {
                  const found = months.find((m) => `${m.year}-${m.month}` === e.target.value);
                  if (found) setSelectedMonth(found);
                }}
              >
                {months.map((m) => (
                  <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{m.label}</option>
                ))}
              </select>
            )}
            {range === 'year' && (
              <select
                className="input-field !w-auto !py-1.5 text-xs"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Line graph — per day/month, now zero-filled so ups & downs always show */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold text-bark/50 mb-2">Sales Revenue Chart</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={fullSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C7" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#5C4A34" interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} stroke="#5C4A34" domain={[0, 'auto']} allowDecimals={false} />
                <Tooltip formatter={(v: any) => peso(Number(v))} contentStyle={{ borderRadius: 10, border: '1px solid #E4D9C7' }} />
                <Line type="monotone" dataKey="total" stroke="#6F4A32" strokeWidth={2.5} dot={{ r: 3, fill: '#6F4A32' }} activeDot={{ r: 5 }} name="Sales (₱)" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart — best-selling items share of revenue */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold text-bark/50 mb-2">Top Products (by Revenue)</p>
            {pieData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-bark/50">No sales data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => peso(Number(v))} contentStyle={{ borderRadius: 10, border: '1px solid #E4D9C7' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="space-y-1.5 mt-2 max-h-[110px] overflow-y-auto pr-1">
              {pieData.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <img src={getImageUrl(p.image)} className="w-5 h-5 rounded object-cover shrink-0" />
                  <span className="text-ink truncate flex-1">{p.name}</span>
                  <span className="text-bark/50">{peso(p.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MORE CHARTS: category / location / order status */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <p className="text-xs font-semibold text-bark/50 mb-3">Sales by Category</p>
          {categoryData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-bark/50">No sales data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C7" />
                <XAxis dataKey="category" tick={{ fontSize: 9 }} stroke="#5C4A34" interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} stroke="#5C4A34" />
                <Tooltip formatter={(v: any) => peso(Number(v))} contentStyle={{ borderRadius: 10, border: '1px solid #E4D9C7' }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {categoryData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-surface p-5">
          <p className="text-xs font-semibold text-bark/50 mb-3">Sales by Location</p>
          {locationData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-bark/50">No sales data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C7" />
                <XAxis dataKey="location" tick={{ fontSize: 9 }} stroke="#5C4A34" interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} stroke="#5C4A34" />
                <Tooltip formatter={(v: any) => peso(Number(v))} contentStyle={{ borderRadius: 10, border: '1px solid #E4D9C7' }} />
                <Bar dataKey="revenue" fill="#8C6544" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-surface p-5">
          <p className="text-xs font-semibold text-bark/50 mb-3">Order Status Distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={70} paddingAngle={2}>
                {orderStatusData.map((d: any, i: number) => <Cell key={i} fill={STATUS_COLORS[d.name] || PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E4D9C7' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
            {orderStatusData.map((d: any, i: number) => (
              <span key={i} className="flex items-center gap-1.5 text-[11px] text-bark/60">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[d.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BEST SELLERS — top 10 only */}
      <div>
        <SectionHeader title="Best-Selling Products" icon="fa-star" />
        <div className="card-surface p-5">
          {topBestSellers.length === 0 ? (
            <p className="text-sm text-bark/50">No sales data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-bark/50 border-b border-tan/30">
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Units Sold</th>
                    <th className="py-2 pr-3">Revenue</th>
                    <th className="py-2 pr-3">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {topBestSellers.map((b, i) => (
                    <tr key={i} className="border-b border-tan/15">
                      <td className="py-2 pr-3 flex items-center gap-2">
                        <img src={getImageUrl(b.product.images?.[0])} className="w-8 h-8 rounded-soft object-cover" />
                        <div className="min-w-0">
                          <span className="font-medium text-ink block">{b.product.name}</span>
                          {b.product.sku && <span className="text-[11px] text-bark/50 font-mono">Code: {b.product.sku}</span>}
                        </div>
                      </td>
                      <td className="py-2 pr-3">{b.unitsSold}</td>
                      <td className="py-2 pr-3">{peso(b.revenue)}</td>
                      <td className="py-2 pr-3">{b.product.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ORDERS — card-style rows, 10 most recent, with item picture + what was bought */}
      <div>
        <SectionHeader title="Orders" icon="fa-truck-fast" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <StatCard icon="fa-boxes-packing" label="Total Orders" value={overview.ordersOverview.total} />
          <StatCard icon="fa-hourglass-half" label="Pending / Preparing" value={overview.ordersOverview.preparing} tone="warn" />
          <StatCard icon="fa-dolly" label="To Ship" value={overview.ordersOverview.toShip} />
          <StatCard icon="fa-truck" label="To Receive" value={overview.ordersOverview.toReceive} />
          <StatCard icon="fa-circle-check" label="Completed" value={overview.ordersOverview.completed} tone="good" />
          <StatCard icon="fa-ban" label="Cancelled" value={overview.ordersOverview.cancelled} tone="danger" />
        </div>
        {recentOrders.length === 0 ? (
          <div className="card-surface p-6 text-center text-sm text-bark/50">No orders yet.</div>
        ) : (
          <div className="card-surface overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-bark/50 border-b border-tan/30">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o: any) => (
                  <tr key={o._id} className="border-b border-tan/15">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={getImageUrl(o.items?.[0]?.image)}
                        className="w-11 h-11 rounded-soft object-cover shrink-0"
                        alt={o.items?.[0]?.name}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{o.orderNumber}</p>
                        <p className="text-xs text-bark/50 truncate max-w-[200px]">
                          {o.items?.[0]?.name}{o.items?.length > 1 ? ` +${o.items.length - 1} more item${o.items.length - 1 !== 1 ? 's' : ''}` : ''}
                        </p>
                        {o.items?.[0]?.sku && <p className="text-[10px] text-bark/40 font-mono">{o.items[0].sku}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-bark/70">{o.user?.firstName} {o.user?.lastName}</td>
                    <td className="py-3 px-4 text-bark/70">{peso(o.total)}</td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full inline-block"
                        style={{ background: `${STATUS_COLORS[o.status] || '#CBB694'}22`, color: STATUS_COLORS[o.status] || '#6F4A32' }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-bark/50 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUSTOMERS — card-style rows, top 5 spenders */}
      <div>
        <SectionHeader title="Customers" icon="fa-users" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard icon="fa-users" label="Total Customers" value={overview.customers.total} />
          <StatCard icon="fa-user-plus" label="New This Month" value={overview.customers.newThisMonth} tone="good" />
          <StatCard icon="fa-user-check" label="Returning / Active" value={overview.customers.returning} />
          <StatCard icon="fa-crown" label="Top Spender" value={overview.customers.top[0]?.name || '—'} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-bark/50 mb-3">Top 5 Customers</p>
            {topCustomers.length === 0 ? (
              <div className="card-surface p-5"><p className="text-sm text-bark/50">No customer orders yet.</p></div>
            ) : (
              <div className="card-surface overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-bark/50 border-b border-tan/30">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Orders</th>
                      <th className="py-3 px-4">Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c: any, i: number) => (
                      <tr key={i} className="border-b border-tan/15">
                        <td className="py-3 px-4">
                          <div className="w-7 h-7 rounded-full bg-olive/10 text-oliveDark flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-ink truncate max-w-[160px]">{c.name}</td>
                        <td className="py-3 px-4 text-bark/70">{c.orders} order{c.orders !== 1 ? 's' : ''}</td>
                        <td className="py-3 px-4 font-display text-bark">{peso(c.totalSpending)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="card-surface p-5">
            <p className="text-xs font-semibold text-bark/50 mb-3">Customer Registration Trend (Last 6 Months)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={overview.customers.registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4D9C7" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#5C4A34" />
                <YAxis tick={{ fontSize: 11 }} stroke="#5C4A34" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E4D9C7' }} />
                <Bar dataKey="count" fill="#A9805F" radius={[6, 6, 0, 0]} name="New Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
