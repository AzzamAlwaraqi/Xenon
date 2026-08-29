// Libraries
import { Star } from 'lucide-react'
import { useState } from 'react'

// Components and services
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { reviewApi } from '../../services/api.js'
import { getCollection, getId } from '../../utils/vendorData.js'

// Page component
export default function AdminReviews() {
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')
  const reviewsState = useApi(() => reviewApi.getAll({ page, limit: 10, status: statusFilter, rating: ratingFilter }), [refresh, statusFilter, ratingFilter, page])
  const reviews = getCollection(reviewsState.data)
  const pagination = reviewsState.data?.pagination || reviewsState.data?.data?.pagination || {}
  const totalPages = Number(pagination.totalPages) || 1

  async function updateStatus(reviewId, status) {
    setBusy(reviewId)
    setMessage('')
    try {
      await reviewApi.updateStatus(reviewId, status)
      setMessage(`Review changed to ${status}.`)
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <header className="admin-header"><div><h1>Reviews</h1><p>Moderate traveller reviews before they go live.</p></div><div className="row-actions"><select aria-label="Filter review status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}><option value="">All statuses</option><option value="in-progress">In progress</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select><select aria-label="Filter review rating" value={ratingFilter} onChange={(event) => { setRatingFilter(event.target.value); setPage(1) }}><option value="">All ratings</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></div></header>
      {message && <p className="admin-data-state">{message}</p>}
      <VendorNotice state={reviewsState} empty={!reviews.length} />
      <section className="vendor-stack">
        {reviews.map((review) => {
          const id = getId(review)
          const status = review.review_status || 'in-progress'
          return (
            <article className="vendor-card" key={id}>
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                <h2>{review.package_id?.package_name || 'Package'}</h2>
                <VendorStatus value={status} />
              </div>
              <p className="star-rating" aria-label={`${review.review_rating} out of 5`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} size={16} fill={index < review.review_rating ? 'currentColor' : 'none'} />
                ))}
              </p>
              <VendorInfo label="Traveller" value={review.user_id?.name || review.user_id?.email} />
              <VendorInfo label="Vendor" value={review.vendor_id?.vendor_company_name} />
              <p>{review.review_text}</p>
              {review.vendor_reply && <p className="vendor-hint"><strong>Vendor reply:</strong> {review.vendor_reply}</p>}
              <div className="row-actions">
                {status !== 'accepted' && <button className="vendor-button" disabled={busy === id} onClick={() => updateStatus(id, 'accepted')}>Accept</button>}
                {status !== 'rejected' && <button className="vendor-button danger" disabled={busy === id} onClick={() => updateStatus(id, 'rejected')}>Reject</button>}
                {status !== 'in-progress' && <button className="vendor-button secondary" disabled={busy === id} onClick={() => updateStatus(id, 'in-progress')}>Return to queue</button>}
              </div>
            </article>
          )
        })}
      </section>
      {totalPages > 1 && <nav className="row-actions" aria-label="Review pages"><button className="vendor-button secondary" disabled={page <= 1 || reviewsState.loading} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="vendor-button secondary" disabled={page >= totalPages || reviewsState.loading} onClick={() => setPage((value) => value + 1)}>Next</button></nav>}
    </>
  )
}
