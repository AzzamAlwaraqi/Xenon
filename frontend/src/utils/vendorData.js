// Normalize API response shapes shared across vendor, traveller, and admin pages
export function getCollection(payload) {
  const value = payload?.data ?? payload

  if (Array.isArray(value)) return value
  return value?.packages || value?.bookings || value?.reviews || value?.results || []
}

export function getRecord(payload) {
  return payload?.data?.package
    || payload?.data?.booking
    || payload?.data?.profile
    || payload?.data?.user
    || payload?.data
    || payload
    || {}
}

export function getPackageId(item) {
  return item?._id || item?.id || item?.package_id
}

export function getBookingId(item) {
  return item?._id || item?.id || item?.booking_id
}

export function getId(item) {
  return item?._id || item?.id
}
