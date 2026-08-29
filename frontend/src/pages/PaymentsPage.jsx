// Libraries
import { useState } from 'react'

// Components and services
import { VendorInfo, VendorNotice, VendorStatus } from '../components/vendor/VendorUi.jsx'
import useApi from '../hooks/useApi.js'
import { paymentApi } from '../services/api.js'
import { isUuid, normalizePhone, validatePayment } from '../utils/formValidation.js'
import { getCollection, getId } from '../utils/vendorData.js'

// Financial records for vendor and administrator roles
export default function PaymentsPage({ role = 'vendor' }) {
  const [refresh, setRefresh] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingMethod, setEditingMethod] = useState('Cash')
  const [editingAmount, setEditingAmount] = useState('')
  const [editingReceipt, setEditingReceipt] = useState(null)
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerStatement, setCustomerStatement] = useState(null)
  const [statementVendorId, setStatementVendorId] = useState('')
  const [adminVendorStatement, setAdminVendorStatement] = useState(null)
  const [form, setForm] = useState(role === 'admin'
    ? { vendor_id: '', amount: '', payment_method: 'ManualBankTransfer', payment_description: '', receipt: null }
    : { booking_id: '', amount: '', payment_method: 'Cash', customer_phone: '', payment_description: '', receipt: null })
  const load = role === 'admin'
    ? () => Promise.all([paymentApi.getSubscriptions(), paymentApi.getBookingPayments()])
    : () => Promise.all([paymentApi.getBookingPayments(), paymentApi.getSubscriptions(), paymentApi.getVendorStatement()])
  const state = useApi(load, [refresh])
  const payloads = state.data || []
  const bookingPayments = getCollection(payloads[role === 'admin' ? 1 : 0])
  const subscriptions = getCollection(payloads[role === 'admin' ? 0 : 1])
  const statement = role === 'vendor' ? payloads[2]?.data || {} : {}
  const empty = !bookingPayments.length && !subscriptions.length && !Object.keys(statement).length

  function updateField(event) {
    const value = event.target.type === 'file' ? event.target.files?.[0] || null : event.target.value
    setForm((current) => ({ ...current, [event.target.name]: value }))
  }

  async function createPayment(event) {
    event.preventDefault()
    const validationError = validatePayment(form, role)
    if (validationError) {
      setMessage(validationError)
      return
    }
    setBusy('create')
    setMessage('')
    try {
      const body = {
        ...form,
        amount: Number(form.amount),
        payment_description: form.payment_description.trim(),
        ...(role === 'admin' ? { vendor_id: form.vendor_id.trim() } : { booking_id: form.booking_id.trim(), customer_phone: normalizePhone(form.customer_phone) }),
      }
      if (role === 'admin') await paymentApi.createSubscription(body)
      else await paymentApi.createBookingPayment(body)
      setMessage('Payment record created.')
      setShowForm(false)
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  async function editPayment(payment) {
    const id = getId(payment)
    if (!isUuid(id)) {
      setMessage('This payment record does not contain a valid ID.')
      return
    }
    if (role === 'vendor') {
      setEditingId(id)
      setEditingMethod(payment.payment_method || 'Cash')
      setMessage('')
      return
    }
    setEditingId(id)
    setEditingAmount(String(payment.amount ?? ''))
    setEditingReceipt(null)
    setMessage('')
  }

  async function updateAdminSubscription(event, paymentId) {
    event.preventDefault()
    const amount = Number(editingAmount)
    if (!Number.isFinite(amount) || amount < 0.01) {
      setMessage('Amount must be at least JOD 0.01.')
      return
    }
    setBusy(paymentId)
    setMessage('')
    try {
      const update = { amount, receipt: editingReceipt }
      const validationError = editingReceipt ? validatePaymentReceipt(editingReceipt) : ''
      if (validationError) throw new Error(validationError)
      await paymentApi.updateSubscription(paymentId, update)
      setMessage('Subscription amount updated.')
      setEditingId('')
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  async function findVendorStatement(event) {
    event.preventDefault()
    const vendorId = statementVendorId.trim()
    if (!isUuid(vendorId)) {
      setMessage('Enter a valid vendor UUID.')
      return
    }
    setBusy('vendor-statement')
    setMessage('')
    try {
      const result = await paymentApi.getVendorStatement(vendorId)
      setAdminVendorStatement(result?.data || result)
    } catch (error) {
      setAdminVendorStatement(null)
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  async function updateVendorPayment(event, paymentId) {
    event.preventDefault()
    const methods = ['CliQ', 'Cash', 'ManualBankTransfer', 'OnlineGateway']
    if (!methods.includes(editingMethod)) {
      setMessage('Select a supported payment method.')
      return
    }
    setBusy(paymentId)
    setMessage('')
    try {
      const validationError = editingReceipt ? validatePaymentReceipt(editingReceipt) : ''
      if (validationError) throw new Error(validationError)
      await paymentApi.updateBookingPayment(paymentId, { payment_method: editingMethod, receipt: editingReceipt })
      setMessage('Payment method updated.')
      setEditingId('')
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  async function findCustomerStatement(event) {
    event.preventDefault()
    const phone = normalizePhone(customerPhone)
    if (!/^\d{10}$/.test(phone)) {
      setMessage('Customer phone must contain exactly 10 digits.')
      return
    }
    setBusy('customer-statement')
    setMessage('')
    try {
      const result = await paymentApi.getCustomerStatement(phone)
      setCustomerStatement(result?.data || result)
    } catch (error) {
      setCustomerStatement(null)
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  async function cancelPayment(payment) {
    const id = getId(payment)
    if (!isUuid(id)) {
      setMessage('This payment record does not contain a valid ID.')
      return
    }
    if (!window.confirm('Cancel this payment record?')) return
    setBusy(id)
    try {
      if (role === 'admin') await paymentApi.cancelSubscription(id)
      else await paymentApi.cancelBookingPayment(id)
      setMessage('Payment record cancelled.')
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  return <>
    <header className="admin-header"><div><h1>Payments and statements</h1><p>{role === 'admin' ? 'Review and register vendor subscription payments.' : 'Review booking payments, subscription status, and your financial statement.'}</p></div><button className="admin-primary" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Close form' : role === 'admin' ? 'Add subscription payment' : 'Add booking payment'}</button></header>
    {showForm && <form className="vendor-card vendor-form" onSubmit={createPayment} noValidate><h2>{role === 'admin' ? 'New subscription payment' : 'New booking payment'}</h2><label>{role === 'admin' ? 'Vendor ID' : 'Booking ID'}<input name={role === 'admin' ? 'vendor_id' : 'booking_id'} value={role === 'admin' ? form.vendor_id : form.booking_id} onChange={updateField} autoComplete="off" required /></label><div className="field-grid"><label>Amount (JOD)<input type="number" min="0.01" step="0.01" name="amount" value={form.amount} onChange={updateField} required /></label><label>Method<select name="payment_method" value={form.payment_method} onChange={updateField}>{(role === 'vendor' ? ['CliQ', 'Cash', 'ManualBankTransfer', 'OnlineGateway'] : ['CliQ', 'ManualBankTransfer', 'OnlineGateway']).map((method) => <option key={method}>{method}</option>)}</select></label></div>{role === 'vendor' && <label>Customer phone<input name="customer_phone" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" value={form.customer_phone} onChange={updateField} required /></label>}<label>Description<textarea name="payment_description" rows="3" maxLength="500" value={form.payment_description} onChange={updateField} required /></label><label>Receipt (optional)<input type="file" name="receipt" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={updateField} /><span className="field-hint">JPEG, PNG, WebP, or PDF · maximum 5 MB</span></label><button className="vendor-button" disabled={busy === 'create'}>Save payment</button></form>}
    {message && <p className="admin-data-state">{message}</p>}
    <VendorNotice state={state} empty={empty} />
    {role === 'vendor' && !state.loading && !state.error && <section className="vendor-card"><h2>Vendor financial statement</h2>{Object.entries(statement).slice(0, 10).map(([label, value]) => <VendorInfo key={label} label={label.split('_').join(' ')} value={typeof value === 'object' ? JSON.stringify(value) : value} />)}</section>}
    {role === 'vendor' && <section className="vendor-card"><form className="vendor-form" onSubmit={findCustomerStatement} noValidate><h2>Customer financial statement</h2><label>Customer phone<input inputMode="numeric" pattern="[0-9]{10}" maxLength="10" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="0791234567" required /></label><button className="vendor-button" disabled={busy === 'customer-statement'}>{busy === 'customer-statement' ? 'Loading…' : 'View statement'}</button></form>{customerStatement && <div>{Object.entries(customerStatement).slice(0, 12).map(([label, value]) => <VendorInfo key={label} label={label.split('_').join(' ')} value={typeof value === 'object' ? JSON.stringify(value) : value} />)}</div>}</section>}
    {role === 'admin' && <section className="vendor-card"><form className="vendor-form" onSubmit={findVendorStatement} noValidate><h2>Vendor financial statement</h2><label>Vendor ID<input value={statementVendorId} onChange={(event) => setStatementVendorId(event.target.value)} placeholder="Vendor UUID" required /></label><button className="vendor-button" disabled={busy === 'vendor-statement'}>{busy === 'vendor-statement' ? 'Loading…' : 'View statement'}</button></form>{adminVendorStatement && <div>{Object.entries(adminVendorStatement).slice(0, 12).map(([label, value]) => <VendorInfo key={label} label={label.split('_').join(' ')} value={typeof value === 'object' ? JSON.stringify(value) : value} />)}</div>}</section>}
    <section className="vendor-stack">
      {bookingPayments.map((payment) => <PaymentCard key={getId(payment)} payment={payment} label="Booking payment" busy={busy} onEdit={role === 'vendor' ? editPayment : null} onCancel={role === 'vendor' ? cancelPayment : null} editing={role === 'vendor' && editingId === getId(payment)} editingMethod={editingMethod} setEditingMethod={setEditingMethod} setEditingReceipt={setEditingReceipt} onSave={role === 'vendor' ? updateVendorPayment : null} onClose={() => setEditingId('')} />)}
      {subscriptions.map((payment) => <PaymentCard key={getId(payment)} payment={payment} label="Vendor subscription" busy={busy} onEdit={role === 'admin' ? editPayment : null} onCancel={role === 'admin' ? cancelPayment : null} editing={role === 'admin' && editingId === getId(payment)} editingAmount={editingAmount} setEditingAmount={setEditingAmount} setEditingReceipt={setEditingReceipt} onSaveAmount={updateAdminSubscription} onClose={() => setEditingId('')} />)}
    </section>
  </>
}

function PaymentCard({ payment, label, busy, onEdit, onCancel, editing = false, editingMethod = 'Cash', setEditingMethod, setEditingReceipt, onSave, editingAmount, setEditingAmount, onSaveAmount, onClose }) {
  return <article className="vendor-card">
    <div className="row-actions" style={{ justifyContent: 'space-between' }}><h2>{label}</h2><VendorStatus value={payment.payment_status || payment.subscription_status || 'Pending'} /></div>
    <VendorInfo label="Amount" value={payment.amount !== undefined ? `JOD ${payment.amount}` : '-'} />
    <VendorInfo label="Method" value={payment.payment_method} />
    <VendorInfo label="Transaction" value={payment.transaction_id || getId(payment)} />
    <VendorInfo label="Description" value={payment.payment_description} />
    {payment.receipt_image_url && <p><a className="text-link" href={payment.receipt_image_url} target="_blank" rel="noreferrer">View receipt</a></p>}
    {editing && onSave && <form className="vendor-form" onSubmit={(event) => onSave(event, getId(payment))}><label>Payment method<select value={editingMethod} onChange={(event) => setEditingMethod(event.target.value)}>{['CliQ', 'Cash', 'ManualBankTransfer', 'OnlineGateway'].map((method) => <option key={method}>{method}</option>)}</select></label><label>Replace receipt (optional)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setEditingReceipt(event.target.files?.[0] || null)} /></label><div className="row-actions"><button className="vendor-button" disabled={busy === getId(payment)}>Save method</button><button className="vendor-button secondary" type="button" onClick={onClose}>Cancel</button></div></form>}
    {editing && onSaveAmount && <form className="vendor-form" onSubmit={(event) => onSaveAmount(event, getId(payment))}><label>Amount (JOD)<input type="number" min="0.01" step="0.01" value={editingAmount} onChange={(event) => setEditingAmount(event.target.value)} required /></label><label>Replace receipt (optional)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setEditingReceipt(event.target.files?.[0] || null)} /></label><div className="row-actions"><button className="vendor-button" disabled={busy === getId(payment)}>Save amount</button><button className="vendor-button secondary" type="button" onClick={onClose}>Cancel</button></div></form>}
    {(onEdit || onCancel) && <div className="row-actions">{onEdit && <button className="vendor-button secondary" disabled={busy === getId(payment)} onClick={() => onEdit(payment)}>Edit</button>}{onCancel && <button className="vendor-button danger" disabled={busy === getId(payment)} onClick={() => onCancel(payment)}>Cancel</button>}</div>}
  </article>
}

function validatePaymentReceipt(receipt) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(receipt.type)) return 'Receipt must be a JPEG, PNG, WebP, or PDF file.'
  if (receipt.size <= 0 || receipt.size > 5 * 1024 * 1024) return 'Receipt must be a non-empty file no larger than 5 MB.'
  return ''
}
