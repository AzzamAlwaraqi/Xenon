// Libraries
import { Star } from 'lucide-react'
import { useState } from 'react'

// Components and services
import AdminShell from '../../components/admin/AdminShell.jsx'
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { reviewApi } from '../../services/api.js'
import { getCollection, getId } from '../../utils/vendorData.js'

// Page component
export default function AdminReviews() {
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const reviewsState = useApi(reviewApi.getAll, [refresh])
  const reviews = getCollection(reviewsState.data)

  async function updateStatus(reviewId, status) {
    setBusy(reviewId)
    try {
      await reviewApi.updateStatus(reviewId, status)
      setRefresh((value) => value + 1)
    } catch (error) {
      window.alert(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <AdminShell title="Reviews" subtitle="Moderate traveller reviews before they go live.">
      <VendorNotice state={reviewsState} empty={!reviews.length} />
      <section className="vendor-stack">
        {reviews.map((review) => {
          const id = getId(review)
          return (
            <article className="vendor-card" key={id}>
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                <h2>{review.package_id?.package_name || 'Package'}</h2>
                <VendorStatus value={review.review_status} />
              </div>
              <p className="star-rating" aria-label={`${review.review_rating} out of 5`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} size={16} fill={index < review.review_rating ? 'currentColor' : 'none'} />
                ))}
              </p>
              <VendorInfo label="Traveller" value={review.user_id?.name || review.user_id?.email} />
              <VendorInfo label="Vendor" value={review.vendor_id?.vendor_name} />
              <p>{review.review_text}</p>
              <div className="row-actions">
                <button className="vendor-button" disabled={busy === id} onClick={() => updateStatus(id, 'accepted')}>Accept</button>
                <button className="vendor-button danger" disabled={busy === id} onClick={() => updateStatus(id, 'rejected')}>Reject</button>
              </div>
            </article>
          )
        })}
      </section>
    </AdminShell>
  )
}
