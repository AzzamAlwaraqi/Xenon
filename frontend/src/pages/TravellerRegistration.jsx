// Libraries
import { ArrowRight, CalendarDays, Mail, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

// Components and services
import AuthImage from '../components/AuthImage.jsx'
import PasswordField from '../components/PasswordField.jsx'
import { authApi } from '../services/api.js'
import { validateTraveller } from '../utils/formValidation.js'

// Page image
const travellerImage = 'https://images.unsplash.com/photo-1500120194857-62b493650979?auto=format&fit=crop&w=1800&q=88'

// Traveller registration page
export default function TravellerRegistration() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', mobileNumber:'', DateOfBirth:'', gender:'Mr.' })
  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState({ loading:false, message:'', type:'' })
  // Keep form field updates reusable
  const update = (key) => (event) => setForm((current) => ({...current,[key]:event.target.value}))

  // Validate and create the traveller account
  async function submit(event) {
    event.preventDefault()
    const validationError = validateTraveller(form, agreed)
    if (validationError) {
      setStatus({ loading:false, message:validationError, type:'error' })
      return
    }
    setStatus({loading:true,message:'',type:''})
    try {
      await authApi.registerTraveller({ name:form.name, email:form.email, password:form.password, gender:form.gender, mobileNumber:form.mobileNumber, DateOfBirth:form.DateOfBirth, role:'user' })
      setStatus({loading:false,message:'Registration complete. You can now sign in.',type:'success'})
    } catch (error) { setStatus({loading:false,message:error.message,type:'error'}) }
  }

  return (
    <div className="auth-page">
      <div className="top-row"><Link className="brand" to="/">Xenon</Link><div className="top-actions"><Link className="text-link" to="/register/vendor">Partner Registration</Link><Link className="text-link" to="/login">Log In</Link></div></div>
      <main className="auth-panel register-panel">
        <div className="auth-inner">
          <header className="auth-head"><h1 className="auth-title">Begin Your Journey</h1><p className="auth-subtitle">Register to unlock curated, artisanal travel experiences tailored to your sophisticated tastes.</p></header>
          <form className="register-form" onSubmit={submit}>
            <div className="field"><label>Full Name</label><div className="input-wrap"><UserRound size={17}/><input className="has-icon" placeholder="Jane Doe" value={form.name} onChange={update('name')} required /></div></div>
            <div className="field"><label>Email Address</label><div className="input-wrap"><Mail size={17}/><input className="has-icon" type="email" placeholder="jane@example.com" value={form.email} onChange={update('email')} required /></div></div>
            <PasswordField value={form.password} onChange={update('password')} />
            <PasswordField label="Confirm Password" value={form.confirm} onChange={update('confirm')} />
            <div className="field-grid">
              <div className="field"><label>Mobile Number</label><div className="input-wrap"><Phone size={17}/><input className="has-icon" type="tel" placeholder="+1 (555) 000-0000" value={form.mobileNumber} onChange={update('mobileNumber')} required /></div></div>
              <div className="field"><label>Date of Birth</label><div className="input-wrap"><CalendarDays size={17}/><input className="has-icon" type="date" max={new Date().toISOString().split('T')[0]} value={form.DateOfBirth} onChange={update('DateOfBirth')} required /></div></div>
            </div>
            <div className="field"><label>Title / Prefix</label><div className="prefix-group">{['Mr.', 'Ms.'].map((title) => <label className="prefix-option" key={title}><input type="radio" name="gender" value={title} checked={form.gender === title} onChange={update('gender')} /><span>{title}</span></label>)}</div></div>
            <label className="check-line"><input type="checkbox" checked={agreed} onChange={(e)=>setAgreed(e.target.checked)} required /><span>I agree to the <a className="text-link" href="#">Terms of Service</a> and <a className="text-link" href="#">Privacy Policy</a>.</span></label>
            {status.message && <p className={`form-message ${status.type}`}>{status.message}</p>}
            <button className="primary-button" disabled={status.loading || !agreed}>{status.loading ? 'Creating account…' : <>Complete Registration <ArrowRight size={15}/></>}</button>
          </form>
        </div>
      </main>
      <AuthImage image={travellerImage} quote='"The art of travel is not in the destination, but in the texture of the journey."' attribution="PETRA · JORDAN" />
    </div>
  )
}
