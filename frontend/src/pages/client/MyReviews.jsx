// Libraries
import { Star, Trash2 } from 'lucide-react'
import { useState } from 'react'

// Components and services
import ClientShell from '../../components/client/ClientShell.jsx'
import { VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { reviewApi } from '../../services/api.js'
import { getCollection, getId } from '../../utils/vendorData.js'

// Page component
export default function MyReviews() {
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const reviewsState = useApi(reviewApi.getMine, [refresh])
  const reviews = getCollection(reviewsState.data)

  async function removeReview(id) {
    if (!window.confirm('Delete this review?')) return
    setBusy(id)
    try {
      await reviewApi.remove(id)
      setRefresh((value) => value + 1)
    } catch (error) {
      window.alert(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <ClientShell title="Your reviews" subtitle="Everything you have shared about past journeys.">
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
              <p>{review.review_text}</p>
              {review.vendor_reply && <p className="vendor-hint">Vendor reply: {review.vendor_reply}</p>}
              <div className="row-actions">
                <button className="vendor-button danger" disabled={busy === id} onClick={() => removeReview(id)}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </article>
          )
        })}
      </section>
    </ClientShell>
  )
}
