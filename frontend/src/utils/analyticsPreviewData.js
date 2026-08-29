const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function trends(values) {
  return months.map((month, index) => ({ month, revenue: values[index], bookings: Math.round(values[index] / 320) }))
}

export const vendorAnalyticsPreview = {
  data: {
    financials: {
      total_revenue: 18420,
      breakdown: { earned_revenue: 18420, pending_revenue: 2640, lost_revenue: 940, total_bookings: 86 },
      payment_methods: [
        { method: 'Cash', usageCount: 42, percentage: 49 },
        { method: 'ManualBankTransfer', usageCount: 29, percentage: 34 },
        { method: 'OnlineGateway', usageCount: 15, percentage: 17 },
      ],
      revenue_trends_this_year: trends([820, 1050, 980, 1360, 1680, 1420, 1940, 2180, 1760, 2340, 2880, 3120]),
    },
    customer_insights: { retention_metrics: { total_unique_customers: 63, one_time_customers: 45, repeat_customers: 18, retention_rate: 28.6 } },
    bookings_overview: [
      { status: 'completed', count: 38 },
      { status: 'accepted', count: 21 },
      { status: 'pending', count: 15 },
      { status: 'cancelled', count: 7 },
      { status: 'rejected', count: 5 },
    ],
    capacity_management: [
      { package_name: 'Wadi Rum Stargazing', occupancy_percentage: 88 },
      { package_name: 'Petra Heritage Trail', occupancy_percentage: 74 },
      { package_name: 'Dana Eco Retreat', occupancy_percentage: 61 },
      { package_name: 'Aqaba Sea Weekend', occupancy_percentage: 53 },
    ],
    quality_score: { total_complaints_received: 3, average_rating: 4.7 },
  },
}

export const adminAnalyticsPreview = {
  data: {
    financials: {
      gross_revenue: 287450,
      net_profit_summary: { totalSuccessfulBookings: 624, totalPlatformSales: 287450, adminActualRevenue: 28745 },
      payment_methods: [
        { method: 'Cash', usageCount: 244, percentage: 39 },
        { method: 'ManualBankTransfer', usageCount: 205, percentage: 33 },
        { method: 'OnlineGateway', usageCount: 175, percentage: 28 },
      ],
    },
    platform_performance: {
      revenue_trends_this_year: trends([15200, 17800, 19400, 21100, 22600, 24700, 23100, 26800, 27900, 30100, 28600, 35400]),
      top_destinations: [
        { package_name: 'Petra Heritage Trail', total_bookings: 148 },
        { package_name: 'Wadi Rum Stargazing', total_bookings: 126 },
        { package_name: 'Aqaba Sea Weekend', total_bookings: 102 },
        { package_name: 'Dana Eco Retreat', total_bookings: 86 },
      ],
      vendors_leaderboard: [
        { vendor_company_name: 'Jordan Horizon Tours', totalRevenue: 68420 },
        { vendor_company_name: 'Desert Compass', totalRevenue: 54780 },
        { vendor_company_name: 'Nabataean Trails', totalRevenue: 49360 },
        { vendor_company_name: 'Aqaba Blue', totalRevenue: 42190 },
        { vendor_company_name: 'Dana Wild Jordan', totalRevenue: 38740 },
      ],
    },
    platform_traffic: { total_bookings: 742 },
    demographics_overview: [{ role: 'user', count: 1248 }, { role: 'vendor', count: 76 }, { role: 'admin', count: 8 }],
    moderation_efficiency: { total_reports: 64, breakdown: [{ status: 'resolved', count: 42 }, { status: 'dismissed', count: 9 }, { status: 'pending', count: 10 }, { status: 'escalated', count: 3 }] },
  },
}
