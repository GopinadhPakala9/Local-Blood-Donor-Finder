import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requests } from '../api'

const GROUPS   = ['A+','A-','B+','B-','O+','O-','AB+','AB-']
const URGENCY  = [
  { value:'Normal',   label:'Normal',   icon:'✅', desc:'Within a few days',     bg:'#F0FDF4', color:'#166534', border:'#86EFAC' },
  { value:'Urgent',   label:'Urgent',   icon:'⚠️', desc:'Within 24 hours',       bg:'#FFFBEB', color:'#92400E', border:'#FCD34D' },
  { value:'Critical', label:'Critical', icon:'🚨', desc:'Immediate — emergency', bg:'#FEF2F2', color:'#991B1B', border:'#FCA5A5' },
]

export default function CreateRequest() {
  const nav = useNavigate()
  const [form, setForm] = useState({
    patient_name:'', blood_group:'O+', units_required:1,
    hospital_name:'', contact_number:'', required_date:'', urgency:'Normal',
    city:'', latitude: null, longitude: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const upd = (k, v) => setForm(f => ({ ...f, [k]:v }))

  const geoLocate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      upd('latitude',  pos.coords.latitude)
      upd('longitude', pos.coords.longitude)
    })
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.patient_name || !form.hospital_name || !form.contact_number) {
      setError('Please fill all required fields'); return
    }
    setLoading(true); setError('')
    try {
      await requests.create({ ...form, required_date: form.required_date || undefined, latitude: form.latitude||undefined, longitude: form.longitude||undefined })
      setSuccess(true)
      setTimeout(() => nav('/requests'), 2000)
    } catch (err) {
      setError(err?.error?.message || 'Failed to create request. Please try again.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div style={S.successPage}>
      <div style={S.successCard} className="fade-in">
        <div style={{fontSize:72, marginBottom:16}}>✅</div>
        <h2 style={{fontSize:24, fontWeight:800, color:'var(--text)', marginBottom:8}}>Request Created!</h2>
        <p style={{color:'var(--text-3)', marginBottom:24}}>Nearby donors will be notified. Redirecting to requests…</p>
        <div style={S.confLoader} />
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.inner}>
        <button style={S.back} onClick={() => nav(-1)}>← Back</button>
        <h1 style={S.h1}>🩸 Create Blood Request</h1>
        <p style={S.sub}>Fill in the details below. Nearby donors will be notified automatically.</p>

        <form onSubmit={submit} style={S.form}>
          {/* Urgency */}
          <div style={S.section}>
            <h3 style={S.sectionTitle}>⚡ Urgency Level</h3>
            <div style={S.urgRow}>
              {URGENCY.map(u => (
                <button key={u.value} type="button"
                  style={{...S.urgCard, background:u.bg, borderColor: form.urgency===u.value ? u.color : u.border, boxShadow: form.urgency===u.value ? `0 0 0 2px ${u.color}40` : 'none'}}
                  onClick={() => upd('urgency', u.value)}>
                  <span style={{fontSize:24}}>{u.icon}</span>
                  <strong style={{color:u.color}}>{u.label}</strong>
                  <span style={{fontSize:12, color:u.color+'99'}}>{u.desc}</span>
                  {form.urgency===u.value && <span style={{...S.check, background:u.color}}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Blood Group + Units */}
          <div style={S.section}>
            <h3 style={S.sectionTitle}>🩸 Blood Requirement</h3>
            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Blood Group *</label>
                <div style={S.bgGrid}>
                  {GROUPS.map(g => (
                    <button key={g} type="button"
                      style={{...S.bgBtn, ...(form.blood_group===g ? S.bgBtnActive : {})}}
                      onClick={() => upd('blood_group', g)}>{g}</button>
                  ))}
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Units Required *</label>
                <div style={S.unitRow}>
                  <button type="button" style={S.unitBtn} onClick={() => upd('units_required', Math.max(1, form.units_required - 1))}>−</button>
                  <span style={S.unitVal}>{form.units_required}</span>
                  <button type="button" style={S.unitBtn} onClick={() => upd('units_required', form.units_required + 1)}>+</button>
                </div>
                <p style={{fontSize:12, color:'var(--text-3)', marginTop:8}}>1 unit ≈ 350–450 mL</p>
              </div>
            </div>
          </div>

          {/* Patient & Hospital */}
          <div style={S.section}>
            <h3 style={S.sectionTitle}>👤 Patient Details</h3>
            <div style={S.row2}>
              <div style={S.field}>
                <label style={S.label}>Patient Name *</label>
                <input style={S.input} placeholder="Full name of patient" value={form.patient_name} onChange={e => upd('patient_name', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Contact Number *</label>
                <input style={S.input} placeholder="+91 98765 43210" type="tel" value={form.contact_number} onChange={e => upd('contact_number', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Hospital Name *</label>
                <input style={S.input} placeholder="Hospital or clinic name" value={form.hospital_name} onChange={e => upd('hospital_name', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>City</label>
                <input style={S.input} placeholder="e.g. Hyderabad" value={form.city} onChange={e => upd('city', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Required By (date)</label>
                <input style={S.input} type="date" value={form.required_date} onChange={e => upd('required_date', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Location (for nearby alerts)</label>
                <button type="button" style={S.geoBtn} onClick={geoLocate}>
                  {form.latitude ? `📍 ${form.latitude?.toFixed(4)}, ${form.longitude?.toFixed(4)}` : '📍 Use my location'}
                </button>
              </div>
            </div>
          </div>

          {error && <p style={S.err}>{error}</p>}

          <div style={S.btnRow}>
            <button type="button" style={S.cancelBtn} onClick={() => nav(-1)}>Cancel</button>
            <button type="submit" style={S.submitBtn} disabled={loading}>
              {loading ? <span style={S.spin}/> : '🩸'}
              {loading ? 'Creating…' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const S = {
  page: { maxWidth:860, margin:'0 auto', padding:'24px' },
  inner: { background:'white', borderRadius:20, padding:'32px', boxShadow:'var(--shadow)' },
  back: { background:'none', border:'none', color:'var(--text-3)', fontSize:13, cursor:'pointer', marginBottom:12 },
  h1: { fontSize:26, fontWeight:800, color:'var(--text)', marginBottom:6 },
  sub: { fontSize:14, color:'var(--text-3)', marginBottom:28 },
  form: { display:'flex', flexDirection:'column', gap:28 },
  section: { display:'flex', flexDirection:'column', gap:14 },
  sectionTitle: { fontSize:15, fontWeight:700, color:'var(--text)', paddingBottom:10, borderBottom:'2px solid var(--border)' },
  urgRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 },
  urgCard: { display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'16px', border:'2px solid', borderRadius:12, cursor:'pointer', transition:'all .2s', position:'relative' },
  check: { position:'absolute', top:8, right:8, width:20, height:20, borderRadius:'50%', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 },
  row2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  field: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontSize:13, fontWeight:600, color:'var(--text-2)' },
  input: { padding:'10px 14px', border:'2px solid var(--border)', borderRadius:8, fontSize:14, color:'var(--text)', outline:'none', transition:'border .2s' },
  bgGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 },
  bgBtn: { padding:'8px', border:'2px solid var(--border)', borderRadius:8, background:'#f9fafb', fontSize:13, fontWeight:700, cursor:'pointer', color:'var(--text-2)', transition:'all .15s' },
  bgBtnActive: { background:'var(--red-pale)', borderColor:'var(--red)', color:'var(--red)' },
  unitRow: { display:'flex', alignItems:'center', gap:12, padding:'8px 0' },
  unitBtn: { width:36, height:36, border:'2px solid var(--border)', borderRadius:8, background:'white', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text)' },
  unitVal: { fontSize:28, fontWeight:800, color:'var(--text)', minWidth:40, textAlign:'center' },
  geoBtn: { padding:'10px 14px', border:'2px dashed var(--border)', borderRadius:8, background:'#f9fafb', fontSize:13, cursor:'pointer', color:'var(--text-2)', textAlign:'left' },
  err: { color:'#E74C3C', fontSize:13, background:'#fef2f2', padding:'10px 14px', borderRadius:8, borderLeft:'3px solid #E74C3C' },
  btnRow: { display:'flex', gap:12, justifyContent:'flex-end' },
  cancelBtn: { padding:'12px 24px', border:'2px solid var(--border)', borderRadius:8, background:'white', color:'var(--text-2)', fontWeight:600, cursor:'pointer', fontSize:14 },
  submitBtn: { padding:'12px 28px', background:'linear-gradient(135deg,var(--red-light),var(--red))', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 14px rgba(192,57,43,.35)' },
  spin: { display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite' },
  successPage: { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh' },
  successCard: { textAlign:'center', background:'white', borderRadius:20, padding:'48px', boxShadow:'var(--shadow-lg)' },
  confLoader: { width:40, height:4, background:'var(--red)', borderRadius:2, margin:'0 auto', animation:'pulse 1.5s ease infinite' },
}
