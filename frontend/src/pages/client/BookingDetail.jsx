// Libraries
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// Components and services
import ClientShell from '../../components/client/ClientShell.jsx'
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { bookingApi, reviewApi } from '../../services/api.js'
import { validateReview } from '../../utils/formValidation.js'
import { getRecord } from '../../utils/vendorData.js'

// Constants
const EMPTY_REVIEW = { rating: 5, comment: '' }

// Page component
export default function BookingDetail() {
  const { bookingId: id } = useParams()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState(false)
  const [review, setReview] = useState(EMPTY_REVIEW)
  const [reviewStatus, setReviewStatus] = useState({ loading: false, message: '', type: '' })
  const bookingState = useApi(() => bookingApi.getById(id), [id, refresh])
  const booking = getRecord(bookingState.data)
  const canCancel = ['pending', 'accepted'].includes(booking.status)

  async function cancelBooking() {
    if (!window.confirm('Cancel this booking?')) return
    setBusy(true)
    try {
      await bookingApi.cancel(id)
      setRefresh((value) => value + 1)
    } catch (error) {
      window.alert(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitReview(event) {
    event.preventDefault()
    const validationError = validateReview(review)
    if (validationError) {
      setReviewStatus({ loading: false, message: validationError, type: 'error' })
      return
    }

    setReviewStatus({ loading: true, message: '', type: '' })
    try {
      await reviewApi.create({
        PACKAGE_Name: booking.package_id?.package_name,
        VENDOR_Name: booking.vendor_id?.vendor_name,
        rating: Number(review.rating),
        comment: review.comment,
      })
      setReviewStatus({ loading: false, message: 'Review submitted for approval.', type: 'success' })
    } catch (error) {
      setReviewStatus({ loading: false, message: error.message, type: 'error' })
    }
  }

  return (
    <ClientShell title={booking.package_id?.package_name || 'Booking details'} subtitle={`${booking.status || 'Pending'} booking`}>
      <VendorNotice state={bookingState} />
      {!bookingState.loading && !bookingState.error && (
        <section className="vendor-grid two">
          <div className="vendor-card">
            <h2>Trip summary</h2>
            <VendorInfo label="Vendor" value={booking.vendor_id?.vendor_name} />
            <VendorInfo label="Date" value={booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : ''} />
            <VendorInfo label="Guests" value={booking.number_of_people} />
            <VendorInfo label="Total price" value={booking.total_price ? `JOD ${booking.total_price}` : ''} />
            <VendorStatus value={booking.status} />
          </div>
          <div className="vendor-card">
            <h2>Manage booking</h2>
            <button className="vendor-button danger" disabled={!canCancel || busy} onClick={cancelBooking}>
              {busy ? 'Cancelling…' : 'Cancel booking'}
            </button>
            <button className="vendor-button secondary" style={{ marginTop: 10 }} onClick={() => navigate('/bookings')}>Back to bookings</button>
          </div>
        </section>
      )}

      {booking.status === 'completed' && (
        <form className="vendor-card vendor-form" onSubmit={submitReview}>
          <h2>Leave a review</h2>
          <label>Rating
            <select value={review.rating} onChange={(event) => setReview((current) => ({ ...current, rating: event.target.value }))}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>)}
            </select>
          </label>
          <label>Comment<textarea rows="4" value={review.comment} onChange={(event) => setReview((current) => ({ ...current, comment: event.target.value }))} /></label>
          {reviewStatus.message && <p className={`form-message ${reviewStatus.type}`}>{reviewStatus.message}</p>}
          <button className="vendor-button" disabled={reviewStatus.loading}>{reviewStatus.loading ? 'Submitting…' : 'Submit review'}</button>
        </form>
      )}
    </ClientShell>
  )
}
