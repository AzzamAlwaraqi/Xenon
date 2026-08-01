// Libraries
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

// Components and validation
import AuthImage from '../components/AuthImage.jsx'
import PasswordField from '../components/PasswordField.jsx'
import { validateVendorAccount, validateVendorBusiness } from '../utils/formValidation.js'

// Page image
const vendorImage = 'https://images.unsplash.com/photo-1666689468289-bd7ae53d5ba9?auto=format&fit=crop&w=1800&q=88'

// Vendor registration page
export default function VendorRegistration() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({name:'',email:'',password:'',company_name:'',mobile:'',vendor_type:'Boutique Hotel',address:'',city:'',country:''})
  const [message, setMessage] = useState('')
  // Keep form field updates reusable
  const update = (key) => (event) => setForm((current)=>({...current,[key]:event.target.value}))

  // Validate account details before step two
  function next(event) {
    event.preventDefault()
    const validationError = validateVendorAccount(form)
    if (validationError) {
      setMessage(validationError)
      return
    }
    setMessage('')
    setStep(2)
  }

  // Validate the application before attempting submission
  function submit(event) {
    event.preventDefault()
    const validationError = validateVendorBusiness(form)
    if (validationError) {
      setMessage(validationError)
      return
    }
    setMessage('Your partner application is ready, but the vendor registration API is not enabled on the server yet.')
  }

  return (
    <div className="auth-page">
      <div className="top-row"><Link className="brand" to="/">Xenon</Link><Link className="text-link" to="/">Return to Home</Link></div>
      <main className="auth-panel vendor-panel">
        <div className="auth-inner">
          <div className="stepper"><p>STEP {step} OF 2</p><div className="step-track"><span style={{width:`${step*50}%`}} /></div></div>
          <header className="auth-head"><h1 className="auth-title">Partner Registration</h1><p className="auth-subtitle">{step === 1 ? "Join Xenon's curated collection of artisanal travel experiences. Begin by establishing your administrative credentials." : 'Tell us about the distinctive business and experience you would like to bring to Xenon.'}</p></header>
          {step === 1 ? (
            <form className="register-form" onSubmit={next}>
              <div className="field"><label>Full Name</label><input placeholder="Jane Doe" value={form.name} onChange={update('name')} required /></div>
              <div className="field"><label>Work Email</label><input type="email" placeholder="jane@example.com" value={form.email} onChange={update('email')} required /></div>
              <PasswordField value={form.password} onChange={update('password')} />
              {message && <p className="form-message error">{message}</p>}
              <div className="vendor-actions"><button className="primary-button">Continue to Business Details <ArrowRight size={15}/></button></div>
            </form>
          ) : (
            <form className="register-form" onSubmit={submit}>
              <div className="field"><label>Business Name</label><input placeholder="Atelier Retreats" value={form.company_name} onChange={update('company_name')} required /></div>
              <div className="field-grid">
                <div className="field"><label>Business Type</label><select value={form.vendor_type} onChange={update('vendor_type')}><option>Boutique Hotel</option><option>Tour Operator</option><option>Artisan Experience</option><option>Wellness Retreat</option></select></div>
                <div className="field"><label>Mobile Number</label><input type="tel" placeholder="+962 7 9000 0000" value={form.mobile} onChange={update('mobile')} required /></div>
              </div>
              <div className="field"><label>Business Address</label><input placeholder="Street and building" value={form.address} onChange={update('address')} required /></div>
              <div className="field-grid">
                <div className="field"><label>City</label><input placeholder="Amman" value={form.city} onChange={update('city')} required /></div>
                <div className="field"><label>Country</label><input placeholder="Jordan" value={form.country} onChange={update('country')} required /></div>
              </div>
              {message && <p className="form-message error">{message}</p>}
              <div className="vendor-actions"><button className="secondary-button" type="button" onClick={()=>setStep(1)}><ArrowLeft size={15}/> Back</button><button className="primary-button">Submit Application <ArrowRight size={15}/></button></div>
            </form>
          )}
          <p className="legal">Already a partner? <Link className="text-link" to="/login">Sign in here.</Link></p>
        </div>
      </main>
      <AuthImage image={vendorImage} quote='"Jordan rewards those who slow down, listen, and travel with intention."' attribution="WADI RUM · JORDAN" />
    </div>
  )
}
