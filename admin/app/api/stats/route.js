import { NextResponse } from 'next/server';
import { initDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await initDb();

    // 1. Fetch Orders and Products (exclude abandoned checkout drafts)
    const orders = await db
      .collection('orders')
      .find({ 'payment.status': { $ne: 'PENDING_PAYMENT' } })
      .sort({ createdAt: -1 })
      .toArray();
    const products = await db.collection('products').find({}).toArray();
    const totalCustomers = await db.collection('users').countDocuments();

    // 2. Compute Cost & Category Map for accurate Profit & Category calculation
    const prodCostMap = {};
    const prodCategoryMap = {};
    products.forEach((p) => {
      const nameKey = p.name?.toLowerCase();
      if (nameKey) {
        prodCostMap[nameKey] =
          Number(p.costPrice) ||
          (Number(p.priceNumber) ? Number(p.priceNumber) * 0.45 : 0);
        prodCategoryMap[nameKey] = p.category || 'Footwear';
      }
    });

    // 3. Compute Totals & Global Stats
    const totalOrders = orders.length;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalUnitsSold = 0;
    const productSalesMap = {};
    const dayVolumeMap = { Tue: 0, Wed: 0, Thu: 0, Fri: 0 };

    orders.forEach((ord) => {
      let ordRev =
        Number(ord.totalAmount) ||
        (ord.items || []).reduce(
          (sum, item) => sum + (Number(item.priceNumber) || 0) * (Number(item.quantity) || 1),
          0
        );
      totalRevenue += ordRev;

      let ordCost = 0;
      let ordUnits = 0;

      (ord.items || []).forEach((item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.priceNumber) || (ordRev > 0 ? ordRev / qty : 0);
        const name = item.name || 'Footwear';
        const cost = prodCostMap[name.toLowerCase()] ?? (price * 0.45);
        ordCost += cost * qty;
        ordUnits += qty;
        totalUnitsSold += qty;

        const key = item.name || item.id || 'Product';
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: item.name || 'Footwear',
            quantity: 0,
            revenue: 0,
            price: Number(item.priceNumber) || 0,
            image: item.image || '',
          };
        }
        productSalesMap[key].quantity += qty;
        productSalesMap[key].revenue += (Number(item.priceNumber) || 0) * qty;
      });

      const ordProfit = Math.max(0, ordRev - ordCost);
      totalProfit += ordProfit;

      // Day of week sales volume
      const d = ord.createdAt ? new Date(ord.createdAt) : null;
      if (d) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[d.getDay()];
        if (dayVolumeMap[dayName] !== undefined) {
          dayVolumeMap[dayName] += ordUnits;
        }
      }
    });

    // 4. Products Stock Volume & Categories
    const totalStockVolume = products.reduce(
      (sum, p) => sum + (Number(p.stockQuantity) || 0),
      0
    );

    const categoryMap = {};
    products.forEach((p) => {
      const cat = p.category || 'Footwear';
      categoryMap[cat] = (categoryMap[cat] || 0) + (Number(p.stockQuantity) || 1);
    });

    // 5. Determine 5-day sales (Mon through Fri or last 5 days around latest orders)
    let refDate = new Date();
    if (orders.length > 0 && orders[0].createdAt) {
      const latestDate = new Date(orders[0].createdAt);
      if (Math.abs(refDate.getTime() - latestDate.getTime()) > 7 * 86400000) {
        refDate = latestDate;
      }
    }

    const daysData = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(refDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      daysData.push({
        dateStr,
        day: dayLabel,
        fullDate,
        revenue: 0,
        profit: 0,
        ordersCount: 0,
        unitsSold: 0,
        productsSold: {},
      });
    }

    orders.forEach((ord) => {
      if (!ord.createdAt) return;
      const oDate = new Date(ord.createdAt).toISOString().split('T')[0];
      const targetDay = daysData.find((d) => d.dateStr === oDate);
      if (!targetDay) return;

      let ordRev =
        Number(ord.totalAmount) ||
        (ord.items || []).reduce(
          (sum, item) => sum + (Number(item.priceNumber) || 0) * (Number(item.quantity) || 1),
          0
        );

      let ordCost = 0;
      let ordUnits = 0;

      (ord.items || []).forEach((item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.priceNumber) || (ordRev > 0 ? ordRev / qty : 0);
        const name = item.name || 'Footwear';
        const cost = prodCostMap[name.toLowerCase()] ?? (price * 0.45);
        ordCost += cost * qty;
        ordUnits += qty;

        if (!targetDay.productsSold[name]) {
          targetDay.productsSold[name] = { name, qty: 0, revenue: 0 };
        }
        targetDay.productsSold[name].qty += qty;
        targetDay.productsSold[name].revenue += price * qty;
      });

      targetDay.revenue += ordRev;
      targetDay.profit += Math.max(0, ordRev - ordCost);
      targetDay.ordersCount += 1;
      targetDay.unitsSold += ordUnits;
    });

    const dailySales = daysData.map((d) => {
      const sorted = Object.values(d.productsSold).sort((a, b) => b.qty - a.qty);
      const topProducts = sorted.slice(0, 3).map((p) => ({
        name: p.name,
        category: prodCategoryMap[p.name?.toLowerCase()] || 'Footwear',
        qty: p.qty,
        revenue: p.revenue,
      }));
      return {
        dateStr: d.dateStr,
        day: d.day,
        fullDate: d.fullDate,
        revenue: d.revenue,
        profit: d.profit,
        ordersCount: d.ordersCount,
        unitsSold: d.unitsSold,
        topProducts,
        topProduct: topProducts[0] || null,
      };
    });

    // 6. Determine Lifetime Top Selling Products (Multiple products, lifetime)
    const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity);
    let topSellingProducts = sortedProducts.slice(0, 4).map((best, idx) => {
      const matchedDb = products.find(
        (p) => p.name?.toLowerCase() === best.name?.toLowerCase() || p.id === best.name
      );
      return {
        id: matchedDb?._id?.toString() || best.name,
        name: best.name,
        brand: matchedDb?.brand || 'Sonu Shoe',
        stockAvailable: matchedDb?.stockQuantity ? `${matchedDb.stockQuantity} in Stock` : 'In Stock',
        price: best.price ? `₹${best.price.toLocaleString('en-IN')}` : (matchedDb?.price || '₹1,000'),
        image: matchedDb?.image || best.image || '',
        quantitySold: best.quantity,
        revenue: best.revenue,
        rank: idx + 1,
      };
    });

    if (topSellingProducts.length < 4 && products.length > 0) {
      products.forEach((p) => {
        if (topSellingProducts.length >= 4) return;
        if (!topSellingProducts.some((t) => t.name.toLowerCase() === p.name.toLowerCase())) {
          topSellingProducts.push({
            id: p._id.toString(),
            name: p.name,
            brand: p.brand || 'Sonu Shoe',
            stockAvailable: `${p.stockQuantity || 10} in Stock`,
            price: p.price || (p.priceNumber ? `₹${p.priceNumber.toLocaleString('en-IN')}` : '₹1,000'),
            image: p.image || '',
            quantitySold: 0,
            revenue: 0,
            rank: topSellingProducts.length + 1,
          });
        }
      });
    }

    const topProduct = topSellingProducts[0] || null;

    // 7. Formatted Orders for Overview Table
    const formattedOrders = orders.slice(0, 10).map((ord) => {
      const firstItem = ord.items?.[0] || {};
      const itemCount = ord.items?.length || 1;
      const prodName = firstItem.name
        ? itemCount > 1
          ? `${firstItem.name} (+${itemCount - 1})`
          : firstItem.name
        : 'Sonu Footwear';

      // Find real shoe image from order item or matched product catalog
      const matchedDb = products.find(
        (p) =>
          p.name?.toLowerCase() === firstItem.name?.toLowerCase() ||
          p.id === firstItem.productId ||
          p._id?.toString() === firstItem.productId
      );
      const shoeImage = firstItem.image || matchedDb?.image || matchedDb?.gallery?.[0] || '';

      const d = ord.createdAt ? new Date(ord.createdAt) : new Date();
      const dateStr = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      let payment = 'UPI';
      const rawMethod = (ord.payment?.method || ord.paymentMethod || '').toLowerCase();
      if (rawMethod === 'partial_cod') payment = 'Partial COD';
      else if (rawMethod === 'prepaid') payment = 'Prepaid';
      else if (rawMethod === 'upi') payment = 'UPI';
      else if (rawMethod === 'cod') payment = 'Cash on Delivery';
      else if (rawMethod) payment = rawMethod.toUpperCase();

      const amtNum =
        Number(ord.totalAmount) ||
        (ord.items || []).reduce(
          (sum, item) => sum + (Number(item.priceNumber) || 0) * (Number(item.quantity) || 1),
          0
        );
      const amountStr = `₹${amtNum.toLocaleString('en-IN')}`;

      // Accurate status based on DB fulfillment and payment
      const fStatus = (ord.fulfillmentStatus || ord.shiprocket?.status || '').toLowerCase();
      const pStatus = (ord.paymentStatus || ord.payment?.status || '').toLowerCase();

      let status = 'Confirmed';
      let statusBg = 'bg-[#e0edff]';
      let statusText = 'text-[#2563eb]';

      if (fStatus === 'cancelled' || pStatus === 'cancelled') {
        status = 'Cancelled';
        statusBg = 'bg-[#fef2f2]';
        statusText = 'text-[#dc2626]';
      } else if (fStatus === 'delivered') {
        status = 'Delivered';
        statusBg = 'bg-[#e8f8ec]';
        statusText = 'text-[#16a34a]';
      } else if (fStatus === 'in_transit' || fStatus === 'shipped' || fStatus === 'out_for_delivery') {
        status = 'In Transit';
        statusBg = 'bg-[#e0edff]';
        statusText = 'text-[#2563eb]';
      } else if (fStatus === 'pickup_scheduled' || fStatus === 'pickup_queued' || fStatus === 'picked_up') {
        status = 'Pickup Scheduled';
        statusBg = 'bg-[#e0edff]';
        statusText = 'text-[#2563eb]';
      } else if (fStatus === 'ready_to_ship') {
        status = 'Ready to Ship';
        statusBg = 'bg-[#fff7ed]';
        statusText = 'text-[#c2410c]';
      } else if (fStatus === 'on_hold' || fStatus === 'hold') {
        status = 'On Hold';
        statusBg = 'bg-[#fffbeb]';
        statusText = 'text-[#b45309]';
      } else if (fStatus === 'rto' || fStatus === 'return_to_origin' || fStatus === 'returned') {
        status = 'RTO';
        statusBg = 'bg-neutral-100';
        statusText = 'text-neutral-700';
      } else if (pStatus === 'pending_payment') {
        status = 'Pending Payment';
        statusBg = 'bg-[#fff7ed]';
        statusText = 'text-[#c2410c]';
      } else if (pStatus === 'paid') {
        status = 'Confirmed';
        statusBg = 'bg-[#e8f8ec]';
        statusText = 'text-[#16a34a]';
      } else if (pStatus === 'partially_paid') {
        status = 'Confirmed';
        statusBg = 'bg-[#e0edff]';
        statusText = 'text-[#2563eb]';
      }

      const fullOrderId = ord.orderId || `#${ord._id.toString().slice(-6)}`;

      return {
        id: fullOrderId,
        rawId: ord.orderId || ord._id.toString(),
        productName: prodName,
        image: shoeImage,
        date: dateStr,
        payment,
        amount: amountStr,
        amountNumber: amtNum,
        status,
        statusBg,
        statusText,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalProfit,
        totalOrders,
        totalUnitsSold,
        totalStockVolume,
        productCount: products.length,
        totalCustomers,
      },
      dailySales,
      topProduct,
      topSellingProducts,
      lifetimeProducts: sortedProducts,
      dayVolumeMap,
      categoryMap,
      recentOrders: formattedOrders,
    });
  } catch (error) {
    console.error('[Admin Stats API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve admin stats', details: error.message },
      { status: 500 }
    );
  }
}
