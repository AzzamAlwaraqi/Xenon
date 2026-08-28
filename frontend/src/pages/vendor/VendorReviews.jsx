// Libraries
import { useState } from 'react'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { reviewApi } from '../../services/api.js'
import { validateResponseText } from '../../utils/formValidation.js'
import { getCollection, getId } from '../../utils/vendorData.js'

function reviewPackage(review) {
  return review.package_id?.package_name || review.package_name || 'Package'
}

// Vendor review list and reply page
export default function VendorReviews() {
  const [refresh, setRefresh] = useState(0)
  const [drafts, setDrafts] = useState({})
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const state = useApi(reviewApi.getMine, [refresh])
  const reviews = getCollection(state.data)

  function updateDraft(reviewId, value) {
    setDrafts((current) => ({ ...current, [reviewId]: value }))
  }

  async function submitReply(event, reviewId) {
    event.preventDefault()
    const reply = drafts[reviewId] || ''
    const validationError = validateResponseText(reply, { min: 2, max: 500, label: 'Review reply' })
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setBusy(reviewId)
    setMessage({ type: '', text: '' })
    try {
      await reviewApi.reply(reviewId, reply.trim())
      setDrafts((current) => ({ ...current, [reviewId]: '' }))
      setMessage({ type: 'success', text: 'Your reply was added to the review.' })
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusy('')
    }
  }

  return (
    <VendorShell title="Reviews" subtitle="Read traveller feedback and reply as the package provider.">
      {message.text && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
      <VendorNotice state={state} empty={!reviews.length} />
      <section className="vendor-stack">
        {reviews.map((review) => {
          const reviewId = getId(review)
          return (
            <article className="vendor-card" key={reviewId}>
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                <h2>{reviewPackage(review)}</h2>
                <VendorStatus value={review.review_status || 'in-progress'} />
              </div>
              <VendorInfo label="Rating" value={`${review.review_rating ?? review.rating ?? '—'} / 5`} />
              <VendorInfo label="Traveller" value={review.user_id?.name || review.user?.name || 'Traveller'} />
              <p>{review.review_text || review.comment || 'No written feedback.'}</p>
              {review.vendor_reply && <p className="vendor-hint"><strong>Your reply:</strong> {review.vendor_reply}</p>}
              <form className="vendor-form" onSubmit={(event) => submitReply(event, reviewId)} noValidate>
                <label>
                  {review.vendor_reply ? 'Update reply' : 'Reply to review'}
                  <textarea rows="4" minLength="2" maxLength="500" value={drafts[reviewId] || ''} onChange={(event) => updateDraft(reviewId, event.target.value)} placeholder="Write a professional response" required />
                </label>
                <button className="vendor-button" disabled={busy === reviewId}>{busy === reviewId ? 'Sending…' : 'Send reply'}</button>
              </form>
            </article>
          )
        })}
      </section>
    </VendorShell>
  )
}
