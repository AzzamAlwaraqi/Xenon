// Normalize API response shapes used by the vendor pages
export function getCollection(payload) {
  const value = payload?.data ?? payload

  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return value?.packages || value?.bookings || value?.notifications || value?.complaints || value?.reviews || value?.payments || value?.employees || value?.results || []
}

export function getRecord(payload) {
  return payload?.data?.package
    || payload?.data?.booking
    || payload?.data?.user
    || payload?.data?.vendor
    || payload?.data?.profile
    || payload?.data?.data
    || payload?.data
    || payload
    || {}
}

export function getPackageId(item) {
  return item?._id || item?.id || item?.package_id
}

export function getPackageImage(item) {
  return item?.images?.[0]?.url || item?.image?.url || item?.image || ''
}

export function getId(item) {
  return item?._id || item?.id || item?.employee_id || item?.notification_id || item?.complaint_id || item?.report_id
}

export function getBookingId(item) {
  return item?._id || item?.id || item?.booking_id
}

export function getBookingTraveller(item) {
  return item?.user_id?.name || item?.user?.name || item?.client?.name || item?.name || 'Traveller'
}

export function getBookingPackage(item) {
  return item?.package_id?.package_name || item?.package?.package_name || item?.package_name || 'Package'
}
