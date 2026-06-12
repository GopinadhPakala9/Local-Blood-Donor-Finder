import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { users } from '../api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const GENDERS      = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]

export default function ProfilePage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name:'', email:'', blood_group:'', gender:'', dob:'', city:'', state:'', weight:'' })
  const [stats, setStats]     = useState({ totalDonations: 0, lastDonation: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    Promise.all([users.me(), users.stats()]).then(([me, st]) => {
      const u = me?.data || me || {}
      const s = st?.data || st || {}
      setForm({
        name:        u.name        || '',
        email:       u.email       || '',
        blood_group: u.blood_group || '',
        gender:      u.gender      || '',
        dob:         u.dob ? u.dob.split('T')[0] : '',
        city:        u.city        || '',
        state:       u.state       || '',
        weight:      u.weight      || '',
      })
      setStats({ totalDonations: s.totalDonations || 0, lastDonation: s.lastDonation })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async e => {
    e.preventDefault()
    setError(''); setSuccess(false); setSaving(true)
    try {
      const payload = {
        name:        form.name        || undefined,
        email:       form.email       || undefined,
        blood_group: form.blood_group || undefined,
        gender:      form.gender      || undefined,
        dob:         form.dob         || undefined,
        city:        form.city        || undefined,
        state:       form.state       || undefined,
        weight:      form.weight ? parseFloat(form.weight) : undefined,
      }
      const res = await users.update(payload)
      const updated = res?.data || res || {}
      // sync localStorage
      try {
        const old = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...old, ...updated }))
      } catch {}
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err?.data?.message || err?.error?.message || 'Failed to save profile.')
    } finally { setSaving(false) }
  }

  const getInitial = () => (form.name?.trim()?.[0] || form.email?.[0] || 'U').toUpperCase()

  const nextEligible = () => {
    if (!stats.lastDonation) return null
    const d = new Date(stats.lastDonation)
    d.setDate(d.getDate() + 90)
    return d
  }

  const eligible   = () => { const n = nextEligible(); return !n || n <= new Date() }
  const daysLeft   = () => { const n = nextEligible(); if (!n) return 0; return Math.max(0, Math.ceil((n - new Date()) / 86400000)) }
  const fmtDate    = d  => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'

  if (loading) return <div style={{textAlign:'center', padding:80, color:'var(--text-3)'}}>Loading…</div>

  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* ── Left: Avatar + Donation Status ── */}
        <div style={S.sidebar}>
          <div style={S.avatarWrap}>
            <div style={S.avatar}>{getInitial()}</div>
            <h2 style={S.avatarName}>{form.name || 'Your Name'}</h2>
            <p style={S.avatarSub}>{form.city ? `${form.city}${form.state ? ', '+form.state : ''}` : 'Location not set'}</p>
            {form.blood_group && (
              <span style={S.bgBadge}>{form.blood_group}</span>
            )}
          </div>

          {/* Donation Stats */}
          <div style={S.statBox}>
            <div style={S.statRow}>
              <span style={S.statIcon}>🩸</span>
              <div>
                <div style={S.statVal}>{stats.totalDonations}</div>
                <div style={S.statLbl}>Total Donations</div>
              </div>
            </div>
            <div style={S.statRow}>
              <span style={S.statIcon}>📅</span>
              <div>
                <div style={S.statVal}>{fmtDate(stats.lastDonation)}</div>
                <div style={S.statLbl}>Last Donated</div>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div style={{...S.eligBox, background: eligible() ? '#F0FDF4' : '#FEF3C7', borderColor: eligible() ? '#86EFAC' : '#FCD34D'}}>
            <div style={{fontSize: 28, marginBottom: 6}}>{eligible() ? '✅' : '⏳'}</div>
            {eligible() ? (
              <>
                <div style={{fontWeight:700, color:'#16A34A', fontSize:14}}>Eligible to Donate!</div>
                <div style={{fontSize:12, color:'#166534', marginTop:4}}>
                  {stats.lastDonation ? `Last donated ${fmtDate(stats.lastDonation)}` : 'You have never donated yet'}
                </div>
              </>
            ) : (
              <>
                <div style={{fontWeight:700, color:'#92400E', fontSize:14}}>Cooldown Active</div>
                <div style={{fontSize:12, color:'#78350F', marginTop:4}}>
                  Eligible on {fmtDate(nextEligible())}
                </div>
                <div style={{fontSize:13, fontWeight:700, color:'#B45309', marginTop:6}}>
                  {daysLeft()} days remaining
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Edit Form ── */}
        <div style={S.main}>
          <div style={S.header}>
            <div>
              <h1 style={S.title}>Edit Profile</h1>
              <p style={S.subtitle}>Keep your information up to date so donors and patients can find you</p>
            </div>
            <button style={S.backBtn} onClick={() => navigate('/')}>← Back</button>
          </div>

          <form onSubmit={handleSave} style={S.form}>
            {/* Personal */}
            <div style={S.section}>
              <div style={S.sectionTitle}>👤 Personal Information</div>
              <div style={S.grid2}>
                <Field label="Full Name" required>
                  <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Gopinadh Pakala" />
                </Field>
                <Field label="Email Address">
                  <input style={S.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                </Field>
                <Field label="Gender">
                  <select style={S.input} value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </Field>
                <Field label="Date of Birth">
                  <input style={S.input} type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                </Field>
              </div>
            </div>

            {/* Medical */}
            <div style={S.section}>
              <div style={S.sectionTitle}>🩸 Medical Information</div>
              <div style={S.grid2}>
                <Field label="Blood Group">
                  <div style={S.bgGrid}>
                    {BLOOD_GROUPS.map(bg => (
                      <button key={bg} type="button"
                        style={{...S.bgBtn, ...(form.blood_group === bg ? S.bgBtnActive : {})}}
                        onClick={() => set('blood_group', bg)}>
                        {bg}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Weight (kg)">
                  <input style={S.input} type="number" min="30" max="200" value={form.weight}
                    onChange={e => set('weight', e.target.value)} placeholder="e.g. 70" />
                </Field>
              </div>
            </div>

            {/* Location */}
            <div style={S.section}>
              <div style={S.sectionTitle}>📍 Location</div>
              <div style={S.grid2}>
                <Field label="City" required>
                  <input style={S.input} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Hyderabad" />
                </Field>
                <Field label="State">
                  <input style={S.input} value={form.state} onChange={e => set('state', e.target.value)} placeholder="e.g. Telangana" />
                </Field>
              </div>
            </div>

            {error   && <div style={S.errBox}>{error}</div>}
            {success && <div style={S.successBox}>✅ Profile updated successfully!</div>}

            <button style={S.saveBtn} type="submit" disabled={saving}>
              {saving ? <><span style={S.spinner} /> Saving…</> : '💾 Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:13, fontWeight:600, color:'var(--text-2)' }}>
        {label}{required && <span style={{color:'var(--red)'}}> *</span>}
      </label>
      {children}
    </div>
  )
}

const S = {
  page:      { maxWidth:1100, margin:'0 auto', padding:'28px 24px' },
  container: { display:'grid', gridTemplateColumns:'280px 1fr', gap:24, alignItems:'start' },
  sidebar:   { display:'flex', flexDirection:'column', gap:16 },
  avatarWrap:{ background:'white', borderRadius:16, padding:'28px 20px', textAlign:'center', boxShadow:'var(--shadow-sm)' },
  avatar:    { width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,var(--red-light),var(--red))', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:800, margin:'0 auto 12px' },
  avatarName:{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:4 },
  avatarSub: { fontSize:13, color:'var(--text-3)', marginBottom:10 },
  bgBadge:   { display:'inline-block', background:'var(--red)', color:'white', fontWeight:800, fontSize:14, padding:'4px 14px', borderRadius:20 },
  statBox:   { background:'white', borderRadius:14, padding:'16px 20px', boxShadow:'var(--shadow-sm)', display:'flex', flexDirection:'column', gap:14 },
  statRow:   { display:'flex', alignItems:'center', gap:12 },
  statIcon:  { fontSize:22 },
  statVal:   { fontSize:16, fontWeight:700, color:'var(--text)' },
  statLbl:   { fontSize:12, color:'var(--text-3)' },
  eligBox:   { borderRadius:14, padding:'18px 16px', textAlign:'center', border:'2px solid', boxShadow:'var(--shadow-sm)' },
  main:      { background:'white', borderRadius:16, padding:'28px 32px', boxShadow:'var(--shadow-sm)' },
  header:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
  title:     { fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 },
  subtitle:  { fontSize:13, color:'var(--text-3)' },
  backBtn:   { background:'none', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', fontSize:13, color:'var(--text-2)', cursor:'pointer' },
  form:      { display:'flex', flexDirection:'column', gap:24 },
  section:   { display:'flex', flexDirection:'column', gap:14 },
  sectionTitle: { fontSize:14, fontWeight:700, color:'var(--text-2)', paddingBottom:8, borderBottom:'1px solid var(--border)' },
  grid2:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  input:     { padding:'11px 14px', border:'2px solid var(--border)', borderRadius:8, fontSize:14, color:'var(--text)', background:'white', outline:'none', width:'100%', boxSizing:'border-box' },
  bgGrid:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 },
  bgBtn:     { padding:'8px 4px', border:'2px solid var(--border)', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', background:'white', color:'var(--text)', transition:'all .15s' },
  bgBtnActive:{ background:'var(--red)', borderColor:'var(--red)', color:'white' },
  saveBtn:   { padding:'14px', background:'linear-gradient(135deg,var(--red-light),var(--red))', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 14px rgba(192,57,43,.3)' },
  spinner:   { display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite' },
  errBox:    { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'12px 16px', color:'#B91C1C', fontSize:13 },
  successBox:{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:8, padding:'12px 16px', color:'#166534', fontSize:13, fontWeight:600 },
}
