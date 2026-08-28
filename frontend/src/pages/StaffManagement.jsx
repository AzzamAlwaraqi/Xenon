// Libraries
import { useState } from 'react'

// Components and services
import { VendorInfo, VendorNotice, VendorStatus } from '../components/vendor/VendorUi.jsx'
import useApi from '../hooks/useApi.js'
import { staffApi } from '../services/api.js'
import { normalizePhone, validateStaff } from '../utils/formValidation.js'
import { getCollection } from '../utils/vendorData.js'

const POSITIONS = { admin: ['manager', 'supervisor', 'customer-support', 'accountant'], vendor: ['tour-guide', 'driver', 'event-organizer', 'photographer', 'translator', 'hospitality'] }
const createEmptyForm = (role) => ({ name: '', email: '', mobileNumber: '', password: '', role, workSystem: 'full-time', position: role === 'admin' ? 'manager' : 'tour-guide', basePay: '', allowances: '' })

// Staff management shared by vendors and administrators
export default function StaffManagement({ role = 'vendor' }) {
  const [refresh, setRefresh] = useState(0)
  const [form, setForm] = useState(() => createEmptyForm(role))
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [editingPosition, setEditingPosition] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const state = useApi(staffApi.getAll, [refresh])
  const allStaff = getCollection(state.data)
  const staff = role === 'admin' ? allStaff.filter((employee) => employee.role === 'admin') : allStaff

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value, ...(name === 'workSystem' && !['full-time', 'contract'].includes(value) ? { allowances: '' } : {}) }))
  }

  async function createStaff(event) {
    event.preventDefault()
    const validationError = validateStaff(form, role)
    if (validationError) {
      setMessage(validationError)
      return
    }
    setBusy('create')
    setMessage('')
    try {
      const payload = { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), mobileNumber: normalizePhone(form.mobileNumber), basePay: Number(form.basePay) }
      delete payload.role
      delete payload.allowances
      await staffApi.create(payload)
      setMessage('Staff member added successfully.')
      setForm(createEmptyForm(role))
      setShowForm(false)
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  async function editStaff(employee) {
    setEditingId(employee.employee_id)
    setEditingPosition(employee.position || POSITIONS[role][0])
    setMessage('')
  }

  async function updatePosition(event, employeeId) {
    event.preventDefault()
    if (!POSITIONS[role].includes(editingPosition)) {
      setMessage(`Choose a valid ${role} position.`)
      return
    }

    setBusy(employeeId)
    setMessage('')
    try {
      await staffApi.update(employeeId, { position: editingPosition })
      setMessage('Staff position updated.')
      setEditingId('')
      setEditingPosition('')
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  async function removeStaff(employeeId) {
    if (!window.confirm('Remove this staff member from the active team?')) return
    setBusy(employeeId)
    try {
      await staffApi.remove(employeeId)
      setMessage('Staff member removed.')
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <header className="admin-header"><div><h1>Staff management</h1><p>Add employees and manage their active employment status.</p></div><button className="admin-primary" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Close form' : 'Add staff'}</button></header>
      {showForm && <form className="vendor-card vendor-form" onSubmit={createStaff} noValidate>
        <div className="vendor-grid two">
          <label>Name<input name="name" value={form.name} onChange={updateField} minLength="3" maxLength="50" required /></label>
          <label>Corporate email<input type="email" name="email" value={form.email} onChange={updateField} pattern=".+@xenon\.com" required /></label>
          <label>Mobile number<input name="mobileNumber" inputMode="numeric" value={form.mobileNumber} onChange={updateField} pattern="[0-9]{10}" maxLength="10" required /></label>
          <label>Temporary password<input type="password" name="password" value={form.password} onChange={updateField} minLength="8" required /></label>
          <label>Work system<select name="workSystem" value={form.workSystem} onChange={updateField}><option value="full-time">Full time</option><option value="part-time">Part time</option><option value="contract">Contract</option><option value="freelance">Freelance</option></select></label>
          <label>Position<select name="position" value={form.position} onChange={updateField}>{POSITIONS[role].map((position) => <option key={position} value={position}>{position.split('-').join(' ')}</option>)}</select></label>
          <label>Base pay<input type="number" name="basePay" value={form.basePay} onChange={updateField} min="0" step="0.01" required /></label>
        </div>
        <button className="vendor-button" disabled={busy === 'create'}>Create staff account</button>
      </form>}
      {message && <p className="admin-data-state">{message}</p>}
      <VendorNotice state={state} empty={!staff.length} />
      <section className="vendor-stack">
        {staff.map((employee) => <article className="vendor-card" key={employee.employee_id}>
          <div className="row-actions" style={{ justifyContent: 'space-between' }}><h2>{employee.name || 'Staff member'}</h2><VendorStatus value={employee.job_active === false ? 'Inactive' : 'Active'} /></div>
          <VendorInfo label="Email" value={employee.email} /><VendorInfo label="Position" value={employee.position} /><VendorInfo label="Work system" value={employee.workSystem} />
          {editingId === employee.employee_id && <form className="vendor-form" onSubmit={(event) => updatePosition(event, employee.employee_id)}>
            <label>Position<select value={editingPosition} onChange={(event) => setEditingPosition(event.target.value)}>{POSITIONS[role].map((position) => <option key={position} value={position}>{position.split('-').join(' ')}</option>)}</select></label>
            <div className="row-actions"><button className="vendor-button" disabled={busy === employee.employee_id}>Save position</button><button className="vendor-button secondary" type="button" onClick={() => setEditingId('')}>Cancel</button></div>
          </form>}
          <div className="row-actions"><button className="vendor-button secondary" disabled={busy === employee.employee_id} onClick={() => editStaff(employee)}>Edit position</button><button className="vendor-button danger" disabled={busy === employee.employee_id} onClick={() => removeStaff(employee.employee_id)}>Remove</button></div>
        </article>)}
      </section>
    </>
  )
}
