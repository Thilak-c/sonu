'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import {
  Search,
  Upload,
  Download,
  Activity,
  Store,
  ArrowRight,
  MoreHorizontal,
  MoreVertical,
  ChevronDown,
  Headphones,
  Shirt,
  Footprints,
  Layers,
  Watch,
} from 'lucide-react';

const INITIAL_RECENT_ORDERS = [
  {
    id: 'SONU-IN-908372',
    rawId: 'SONU-IN-908372',
    productName: 'nike',
    image: '/api/uploads/1e462d9nike-io3815-102_1-1793184826924-pbq2z8.webp',
    date: '29 Oct 2026',
    payment: 'UPI',
    amount: '₹2,000',
    amountNumber: 2000,
    status: 'Confirmed',
    statusBg: 'bg-[#e8f8ec]',
    statusText: 'text-[#16a34a]',
  },
  {
    id: 'SONU-IN-777609',
    rawId: 'SONU-IN-777609',
    productName: 'nike',
    image: '/api/uploads/1e462d9nike-io3815-102_1-1793184826924-pbq2z8.webp',
    date: '29 Oct 2026',
    payment: 'UPI',
    amount: '₹2,000',
    amountNumber: 2000,
    status: 'Confirmed',
    statusBg: 'bg-[#e8f8ec]',
    statusText: 'text-[#16a34a]',
  },
  {
    id: 'SONU-IN-576577',
    rawId: 'SONU-IN-576577',
    productName: 'Sonu Hybrid RN v1 - Road Edition',
    image: '/images/test/1e462d9Nike-IV2476-200_1.avif',
    date: '28 Oct 2026',
    payment: 'Partial COD',
    amount: '₹13,995',
    amountNumber: 13995,
    status: 'Pickup Scheduled',
    statusBg: 'bg-[#e0edff]',
    statusText: 'text-[#2563eb]',
  },
  {
    id: 'SONU-IN-265765',
    rawId: 'SONU-IN-265765',
    productName: 'Sonu Hybrid RN v1 - Road Edition',
    image: '/images/test/1e462d9Nike-IV2476-200_1.avif',
    date: '28 Oct 2026',
    payment: 'Prepaid',
    amount: '₹13,995',
    amountNumber: 13995,
    status: 'Delivered',
    statusBg: 'bg-[#e8f8ec]',
    statusText: 'text-[#16a34a]',
  },
  {
    id: 'SONU-IN-400204',
    rawId: 'SONU-IN-400204',
    productName: 'Sonu Hybrid RN v1 - Road Edition',
    image: '/images/test/1e462d9Nike-IV2476-200_1.avif',
    date: '28 Oct 2026',
    payment: 'Partial COD',
    amount: '₹13,995',
    amountNumber: 13995,
    status: 'Cancelled',
    statusBg: 'bg-[#fef2f2]',
    statusText: 'text-[#dc2626]',
  },
];

export default function OverviewPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dbData, setDbData] = useState(null);

  // Sync real-time DB stats in background if available
  useEffect(() => {
    let isMounted = true;
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success) {
          setDbData(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load live database stats:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute profit margin percentage
  const profitMarginPct = useMemo(() => {
    if (dbData?.stats?.totalRevenue && dbData?.stats?.totalProfit) {
      const pct = Math.round((dbData.stats.totalProfit / dbData.stats.totalRevenue) * 100);
      return `+${pct}%`;
    }
    return '+45%';
  }, [dbData]);

  // Daily sales bars for the Center Bar Chart (shown in days with real revenue & profit)
  const dailyBars = useMemo(() => {
    const rawDays = dbData?.dailySales || [
      { day: 'Mon', fullDate: '26 Oct', revenue: 0, profit: 0, ordersCount: 0, unitsSold: 0, topProducts: [] },
      { day: 'Tue', fullDate: '27 Oct', revenue: 0, profit: 0, ordersCount: 0, unitsSold: 0, topProducts: [] },
      {
        day: 'Wed',
        fullDate: '28 Oct',
        revenue: 111479,
        profit: 71288,
        ordersCount: 7,
        unitsSold: 8,
        topProducts: [
          { name: 'Sonu Hybrid RN v1 - Road Edition', category: 'Footwear', qty: 4, revenue: 55980 },
          { name: 'test-67', category: 'Running shoe', qty: 3, revenue: 45000 },
          { name: 'test-12', category: 'Running shoe', qty: 1, revenue: 10499 },
        ],
      },
      {
        day: 'Thu',
        fullDate: '29 Oct',
        revenue: 6000,
        profit: 3000,
        ordersCount: 3,
        unitsSold: 3,
        topProducts: [
          { name: 'nike', category: 'Sports Running', qty: 3, revenue: 6000 },
        ],
      },
      { day: 'Fri', fullDate: '30 Oct', revenue: 0, profit: 0, ordersCount: 0, unitsSold: 0, topProducts: [] },
    ];

    const xCoords = [80, 155, 230, 305, 380];
    const maxVal = Math.max(1000, ...rawDays.map((d) => (d.revenue || 0) + (d.profit || 0)));

    return rawDays.slice(0, 5).map((d, idx) => {
      const rev = d.revenue || 0;
      const profit = d.profit || 0;
      const x = xCoords[idx] || 80 + idx * 75;

      let revHeight = 0;
      let profitHeight = 0;
      if (rev > 0) {
        revHeight = Math.max(18, Math.min(78, Math.round((rev / maxVal) * 80)));
        profitHeight = Math.max(14, Math.min(65, Math.round((profit / maxVal) * 65)));
      } else {
        revHeight = 4;
        profitHeight = 0;
      }

      let valDisplay = '0';
      if (rev >= 100000) {
        valDisplay = `${(rev / 100000).toFixed(1)}L`;
      } else if (rev >= 1000) {
        valDisplay = `${(rev / 1000).toFixed(rev >= 10000 ? 0 : 1)}k`;
      } else if (rev > 0) {
        valDisplay = `${rev}`;
      }

      return {
        ...d,
        x,
        val: valDisplay,
        revHeight,
        profitHeight,
        topProducts: d.topProducts || (d.topProduct ? [d.topProduct] : []),
      };
    });
  }, [dbData]);

  // Scaled Y-Axis reference lines & numbers
  const yAxisLines = useMemo(() => {
    const maxVal = Math.max(1000, ...dailyBars.map((b) => (b.revenue || 0) + (b.profit || 0)));
    const step = Math.ceil(maxVal / 7 / 1000) * 1000 || 1000;
    return [
      { y: 20, val: `${Math.round((step * 7) / 1000)}k` },
      { y: 45, val: `${Math.round((step * 6) / 1000)}k` },
      { y: 70, val: `${Math.round((step * 5) / 1000)}k` },
      { y: 95, val: `${Math.round((step * 4) / 1000)}k` },
      { y: 120, val: `${Math.round((step * 3) / 1000)}k` },
      { y: 145, val: `${Math.round((step * 2) / 1000)}k` },
      { y: 170, val: `${Math.round((step * 1) / 1000)}k` },
    ];
  }, [dailyBars]);

  // Active orders list (real database orders when loaded, fallback to initial)
  const activeOrders = useMemo(() => {
    return dbData?.recentOrders?.length ? dbData.recentOrders : INITIAL_RECENT_ORDERS;
  }, [dbData]);

  // Filter orders based on the search product term
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return activeOrders;
    const term = searchTerm.toLowerCase();
    return activeOrders.filter(
      (ord) =>
        ord.productName.toLowerCase().includes(term) ||
        ord.id.toLowerCase().includes(term) ||
        ord.payment.toLowerCase().includes(term) ||
        ord.status.toLowerCase().includes(term)
    );
  }, [searchTerm, activeOrders]);

  // Lifetime products sales breakdown for the Pie/Donut chart
  const lifetimeProducts = useMemo(() => {
    if (dbData?.lifetimeProducts && dbData.lifetimeProducts.length > 0) {
      return dbData.lifetimeProducts;
    }
    return [
      { name: 'Sonu Hybrid RN v1', quantity: 4, revenue: 55980 },
      { name: 'test-67', quantity: 3, revenue: 45000 },
      { name: 'nike', quantity: 3, revenue: 6000 },
      { name: 'test-12', quantity: 1, revenue: 10499 },
    ];
  }, [dbData]);

  // Lifetime Top Selling Products list
  const topSellingList = useMemo(() => {
    if (dbData?.topSellingProducts && dbData.topSellingProducts.length > 0) {
      return dbData.topSellingProducts;
    }
    return [
      {
        id: '1',
        name: 'Sonu Hybrid RN v1 - Road Edition',
        brand: 'Sonu Shoe',
        stockAvailable: 'In Stock',
        price: '₹13,995',
        quantitySold: 4,
        revenue: 55980,
        rank: 1,
      },
      {
        id: '2',
        name: 'test-67',
        brand: 'Sonu Shoe',
        stockAvailable: '30 in Stock',
        price: '₹15,000',
        quantitySold: 3,
        revenue: 45000,
        rank: 2,
      },
      {
        id: '3',
        name: 'nike',
        brand: 'nike',
        stockAvailable: '42 in Stock',
        price: '₹2,000',
        quantitySold: 3,
        revenue: 6000,
        rank: 3,
      },
      {
        id: '4',
        name: 'test-12',
        brand: 'Sonu Shoe',
        stockAvailable: '23 in Stock',
        price: '₹10,499',
        quantitySold: 1,
        revenue: 10499,
        rank: 4,
      },
    ];
  }, [dbData]);

  const donutProducts = useMemo(() => {
    const fallback = [
      { name: 'Sonu Hybrid RN v1', quantity: 4, revenue: 55980 },
      { name: 'test-67', quantity: 3, revenue: 45000 },
      { name: 'nike', quantity: 3, revenue: 6000 },
      { name: 'test-12', quantity: 1, revenue: 10499 },
    ];
    const list =
      lifetimeProducts.length >= 4
        ? lifetimeProducts.slice(0, 4)
        : [...lifetimeProducts, ...fallback].slice(0, 4);

    const totalQty = list.reduce((sum, p) => sum + (p.quantity || 1), 0) || 1;
    const circumference = 226; // 2 * Math.PI * 36

    let runningOffset = 0;
    const colors = [
      { bg: '#0f172a', ring: 'bg-[#0f172a]' },
      { bg: '#64748b', ring: 'bg-[#64748b]' },
      { bg: '#94a3b8', ring: 'bg-[#94a3b8]' },
      { bg: '#cbd5e1', ring: 'bg-[#cbd5e1]' },
    ];

    return list.map((p, idx) => {
      const qty = p.quantity || 1;
      const pct = qty / totalQty;
      const strokeLength = Math.max(14, Math.round(pct * circumference));
      const strokeOffset = -runningOffset;
      runningOffset += strokeLength;

      let shortName = p.name;
      if (shortName.length > 14) {
        shortName = shortName.split('-')[0].trim();
        if (shortName.length > 14) shortName = shortName.slice(0, 13) + '…';
      }

      return {
        ...p,
        shortName,
        pct: Math.round(pct * 100),
        strokeLength,
        strokeOffset,
        color: colors[idx]?.bg || '#94a3b8',
        ringClass: colors[idx]?.ring || 'bg-neutral-400',
      };
    });
  }, [lifetimeProducts]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = 'Order ID,Product Name,Date,Payment,Amount,Status\n';
    const rows = filteredOrders
      .map(
        (o) =>
          `"${o.id}","${o.productName}","${o.date}","${o.payment}","${o.amount}","${o.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ecommerce_sales_overview_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Report handler
  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <AdminShell>
      <div className="w-full min-h-screen bg-[#f3f4f7] px-4 py-6 sm:px-8 sm:py-8 font-['Helvetica_Now_Text',sans-serif] select-none">
        {/* ========================================================= */}
        {/* TOP BAR / DASHBOARD HEADER ROW                            */}
        {/* ========================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
          {/* Dashboard Title */}
          <h1 className="text-[28px] sm:text-[34px] font-semibold text-[#111111] tracking-tight">
            Dashboard
          </h1>

          {/* Search Pill and Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Pill Search Input */}
            <div className="relative w-full sm:w-[280px] md:w-[320px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#f3f4f6] text-[14px] text-[#111111] placeholder-neutral-400 pl-10 pr-4 py-2 rounded-full border border-neutral-200/50 outline-none focus:bg-white focus:border-neutral-300 transition-all font-normal"
              />
            </div>

            {/* Export CSV Pill Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-[#111111] text-[#111111] text-[13.5px] font-medium hover:bg-neutral-50 transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Download Report Pill Button */}
            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-[#111111] text-[#111111] text-[13.5px] font-medium hover:bg-neutral-50 transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TOP SECTION: 3 COLUMNS GRID                               */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* ------------------------------------------------------- */}
          {/* COLUMN 1 (LEFT, ~25%): 2 STACKED CARDS                  */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col gap-6 justify-between">
            {/* Card 1: Total Products Sales */}
            <div className="bg-white rounded-[26px] p-6 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-start justify-between">
                  <p className="text-[14px] text-neutral-500 font-normal">
                    Total Products Sales
                  </p>
                  <div className="w-9 h-9 rounded-xl border border-neutral-200/80 flex items-center justify-center text-neutral-700 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mt-3">
                  <span className="text-[34px] sm:text-[38px] font-bold text-[#111111] tracking-tight leading-none">
                    {dbData?.stats?.totalUnitsSold != null
                      ? dbData.stats.totalUnitsSold.toLocaleString('en-IN')
                      : '202,324'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-semibold">
                    +10%
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-100">
                <Link
                  href="/orders"
                  className="flex items-center justify-between text-[14px] font-medium text-neutral-800 hover:text-black transition-colors group"
                >
                  <span>View Sales Details</span>
                  <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 2: Total Volume Of Products */}
            <div className="bg-white rounded-[26px] p-6 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-start justify-between">
                  <p className="text-[14px] text-neutral-500 font-normal">
                    Total Volume Of Products
                  </p>
                  <div className="w-9 h-9 rounded-xl border border-neutral-200/80 flex items-center justify-center text-neutral-700 shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mt-3">
                  <span className="text-[34px] sm:text-[38px] font-bold text-[#111111] tracking-tight leading-none">
                    {dbData?.stats?.totalStockVolume != null
                      ? dbData.stats.totalStockVolume.toLocaleString('en-IN')
                      : '123,726'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] text-[11px] font-semibold">
                    -12%
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2.5 2.5L9.5 9.5M9.5 9.5H4.5M9.5 9.5V4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="pt-5 mt-6 border-t border-neutral-100">
                <Link
                  href="/products"
                  className="flex items-center justify-between text-[14px] font-medium text-neutral-800 hover:text-black transition-colors group"
                >
                  <span>View All Products</span>
                  <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* COLUMN 2 (CENTER, ~42%): TOTAL PRODUCTS SALES BAR CHART */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-white rounded-[26px] p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            {/* Header with Price, Badge and Menu */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] text-neutral-500 font-normal">
                    Total Products Sales
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[36px] sm:text-[40px] font-bold text-[#111111] tracking-tight leading-none">
                      {dbData?.stats?.totalRevenue != null
                        ? `₹${dbData.stats.totalRevenue.toLocaleString('en-IN')}`
                        : '$500,324'}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-semibold">
                      {profitMarginPct}
                      <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-8 h-8 rounded-full border border-neutral-200/80 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  aria-label="Options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Legend: Total Revenue (Black) vs Total Profit (Striped) */}
              <div className="flex items-center justify-end gap-5 mt-4">
                <div className="flex items-center gap-2 text-[12px] text-neutral-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#111111]" />
                  <span>Total Revenue</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <span>Total Profit</span>
                </div>
              </div>
            </div>

            {/* Hatched Bar Chart SVG */}
            <div className="w-full mt-4 h-[240px]">
              <svg
                viewBox="0 0 460 220"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Diagonal hatched stripe pattern for Total Profit */}
                  <pattern
                    id="barDiagonalHatch"
                    width="6"
                    height="6"
                    patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke="#d4d4d8"
                      strokeWidth="2.2"
                    />
                  </pattern>
                </defs>

                {/* Y-Axis Reference lines & numbers */}
                {yAxisLines.map((row) => (
                  <g key={row.y}>
                    <text
                      x="32"
                      y={row.y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-neutral-400 font-normal"
                    >
                      {row.val}
                    </text>
                    <line
                      x1="45"
                      y1={row.y}
                      x2="455"
                      y2={row.y}
                      stroke="#f3f4f6"
                      strokeDasharray="2 2"
                    />
                  </g>
                ))}

                {/* 5 Stacked Bars for Days */}
                {dailyBars.map((b) => {
                  const baseY = 175;
                  const revY = baseY - b.revHeight;
                  const profitY = revY - b.profitHeight;

                  return (
                    <g key={b.day}>
                      {/* Top Striped/Hatched Bar (Total Profit) */}
                      {b.profitHeight > 0 && (
                        <rect
                          x={b.x - 17}
                          y={profitY}
                          width="34"
                          height={b.profitHeight}
                          rx="14"
                          fill="url(#barDiagonalHatch)"
                          stroke="#e5e7eb"
                          strokeWidth="0.5"
                        />
                      )}

                      {/* Bottom Solid Black Bar (Total Revenue) */}
                      <rect
                        x={b.x - 17}
                        y={revY}
                        width="34"
                        height={b.revHeight}
                        rx={b.revHeight > 14 ? '14' : '3'}
                        fill="#111111"
                      />

                      {/* Number above solid black bar */}
                      <text
                        x={b.x}
                        y={revY - 5}
                        textAnchor="middle"
                        className="text-[9.5px] font-semibold fill-neutral-600"
                      >
                        {b.val}
                      </text>

                      {/* Day pill button on X-axis */}
                      <rect
                        x={b.x - 18}
                        y={186}
                        width="36"
                        height="18"
                        rx="9"
                        fill="#111111"
                      />
                      <text
                        x={b.x}
                        y={199}
                        textAnchor="middle"
                        className="text-[9.5px] fill-white font-medium"
                      >
                        {b.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* COLUMN 3 (RIGHT, ~33%): TOTAL SALES ANALYTICS DONUT      */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-4 bg-white rounded-[26px] p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            {/* Header: Title and Lifetime Badge */}
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#111111] tracking-tight">
                Total Sales Analytics
              </h3>
              <div className="px-3 py-1 rounded-full border border-neutral-200 text-[12px] font-medium text-neutral-700 bg-neutral-50/70 select-none">
                Lifetime
              </div>
            </div>

            {/* Donut Chart with Surrounding Product Labels */}
            <div className="relative w-full my-4 flex items-center justify-center">
              {/* Surrounding Labels */}
              {/* Top-Left: Product 1 */}
              <div className="absolute left-1 top-2 text-left max-w-[105px]">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <span className={`w-2 h-2 rounded-full ${donutProducts[0]?.ringClass || 'bg-[#0f172a]'}`} />
                  <span className="truncate">{donutProducts[0]?.shortName || 'Product 1'}</span>
                </div>
                <p className="text-[14px] font-bold text-[#111111] mt-0.5">
                  {donutProducts[0]?.quantity != null
                    ? `${donutProducts[0].quantity} Sold`
                    : '4 Sold'}
                </p>
              </div>

              {/* Bottom-Left: Product 3 */}
              <div className="absolute left-1 bottom-4 text-left max-w-[105px]">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <span className={`w-2 h-2 rounded-full ${donutProducts[2]?.ringClass || 'bg-[#94a3b8]'}`} />
                  <span className="truncate">{donutProducts[2]?.shortName || 'Product 3'}</span>
                </div>
                <p className="text-[14px] font-bold text-[#111111] mt-0.5">
                  {donutProducts[2]?.quantity != null
                    ? `${donutProducts[2].quantity} Sold`
                    : '3 Sold'}
                </p>
              </div>

              {/* Top-Right: Product 2 */}
              <div className="absolute right-1 top-2 text-right max-w-[105px]">
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-neutral-400">
                  <span className="truncate">{donutProducts[1]?.shortName || 'Product 2'}</span>
                  <span className={`w-2 h-2 rounded-full ${donutProducts[1]?.ringClass || 'bg-[#64748b]'}`} />
                </div>
                <p className="text-[14px] font-bold text-[#111111] mt-0.5">
                  {donutProducts[1]?.quantity != null
                    ? `${donutProducts[1].quantity} Sold`
                    : '3 Sold'}
                </p>
              </div>

              {/* Bottom-Right: Product 4 */}
              <div className="absolute right-1 bottom-4 text-right max-w-[105px]">
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-neutral-400">
                  <span className="truncate">{donutProducts[3]?.shortName || 'Product 4'}</span>
                  <span className={`w-2 h-2 rounded-full ${donutProducts[3]?.ringClass || 'bg-[#cbd5e1]'}`} />
                </div>
                <p className="text-[14px] font-bold text-[#111111] mt-0.5">
                  {donutProducts[3]?.quantity != null
                    ? `${donutProducts[3].quantity} Sold`
                    : '1 Sold'}
                </p>
              </div>

              {/* Donut SVG */}
              <div className="relative w-[180px] h-[180px] flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                  {donutProducts.map((p, idx) => (
                    <circle
                      key={`${p.name}-${idx}`}
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke={p.color}
                      strokeWidth="16"
                      strokeDasharray={`${p.strokeLength} 226`}
                      strokeDashoffset={p.strokeOffset}
                    />
                  ))}
                </svg>

                {/* Center stats in Donut Hole */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[23px] font-bold text-[#111111] tracking-tight leading-none">
                    {dbData?.stats?.totalUnitsSold != null
                      ? `${dbData.stats.totalUnitsSold} Sold`
                      : '11 Sold'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-semibold mt-1">
                    Lifetime
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Total Lifetime Sales */}
            <div className="text-center pt-4 border-t border-neutral-100/60">
              <p className="text-[13px] text-neutral-400 font-normal">
                Total Lifetime Sales
              </p>
              <p className="text-[30px] sm:text-[34px] font-bold text-[#111111] tracking-tight leading-none mt-1">
                {dbData?.stats?.totalRevenue != null
                  ? `₹${dbData.stats.totalRevenue.toLocaleString('en-IN')}`
                  : '₹1,17,479'}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM SECTION: 2 COLUMNS GRID (RECANT ORDERS + TOP PROD) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mt-6">
          {/* ------------------------------------------------------- */}
          {/* LEFT: RECANT ORDERS TABLE (~68% WIDTH)                  */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-8 bg-white rounded-[26px] p-6 sm:p-8 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            {/* Header: Recant Orders Title + View All */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-[20px] font-semibold text-[#111111] tracking-tight">
                  Recant Orders
                </h3>
                <p className="text-[13px] text-neutral-400 font-normal mt-0.5">
                  Keep track of recant order data and others information.
                </p>
              </div>

              <Link
                href="/orders"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-neutral-200 text-[13px] font-medium text-neutral-800 hover:border-neutral-400 hover:text-black transition-colors shrink-0"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-[12px] text-neutral-400 font-normal">
                    <th className="pb-3 font-normal">Order Id</th>
                    <th className="pb-3 font-normal">Product Name</th>
                    <th className="pb-3 font-normal">Date</th>
                    <th className="pb-3 font-normal">Payment</th>
                    <th className="pb-3 font-normal">Amount</th>
                    <th className="pb-3 font-normal">Status</th>
                    <th className="pb-3 font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100/60 text-[13.5px]">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-50/50 transition-colors">
                      {/* Order Id */}
                      <td className="py-4 font-semibold text-neutral-900 whitespace-nowrap">
                        <Link
                          href={`/orders?id=${encodeURIComponent(ord.rawId || ord.id)}`}
                          className="hover:underline hover:text-black tracking-tight"
                        >
                          {ord.id}
                        </Link>
                      </td>

                      {/* Product Name with shoe image thumbnail */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/60 overflow-hidden flex items-center justify-center shrink-0">
                            {ord.image ? (
                              <img
                                src={ord.image}
                                alt={ord.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Footprints className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                          <span className="font-medium text-neutral-900">
                            {ord.productName}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 text-neutral-600 whitespace-nowrap">
                        {ord.date}
                      </td>

                      {/* Payment */}
                      <td className="py-4 text-neutral-600 whitespace-nowrap">
                        {ord.payment}
                      </td>

                      {/* Amount */}
                      <td className="py-4 font-semibold text-neutral-900 whitespace-nowrap">
                        {ord.amount}
                      </td>

                      {/* Status */}
                      <td className="py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium ${ord.statusBg} ${ord.statusText}`}
                        >
                          {ord.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/orders?id=${encodeURIComponent(ord.rawId || ord.id)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 text-[12px] font-medium text-neutral-700 hover:border-neutral-900 hover:text-black transition-colors"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-400 text-[14px]">
                        No orders found matching &ldquo;{searchTerm}&rdquo;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* RIGHT: TOP SELLING PRODUCTS (~32% WIDTH)                */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-4 bg-white rounded-[26px] p-6 sm:p-7 border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            {/* Header: Title and Lifetime Badge */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#111111] tracking-tight">
                  Top Selling Products
                </h3>
               
              </div>

              {/* Top Selling Products List (Lifetime) */}
              <div className="flex flex-col gap-2.5">
                {topSellingList.map((prod, idx) => (
                  <div
                    key={prod.id || prod.name}
                    className="flex items-center justify-between shadow-xs hover:border-neutral-300 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-sm bg-neutral-100 flex items-center justify-center shrink-0  overflow-hidden">
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Footprints className="w-5 h-5 text-neutral-800" />
                        )}
                      </div>
                      <div className="min-w-0 pr-1">
                        <h4 className="text-[13px] font-semibold text-[#111111] leading-tight truncate max-w-[170px] sm:max-w-[195px]">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          Brand: {prod.brand || 'Sonu Shoe'} <span className="mx-1">•</span> {prod.stockAvailable || 'In Stock'}
                        </p>
                        <p className="text-[12.5px] font-bold text-[#111111] mt-0.5">
                          {prod.price}{' '}
                          <span className="text-[11px] font-normal text-neutral-500 ml-1">
                            • {prod.quantitySold} {prod.quantitySold === 1 ? 'unit' : 'units'} sold
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                    
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifetime Sales Volume Comparison Chart across Top Products */}
        
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
