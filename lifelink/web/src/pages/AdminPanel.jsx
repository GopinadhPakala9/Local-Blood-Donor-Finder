import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hospitals as hospitalsApi, bloodBanks as bloodBanksApi } from '../api'

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

// Build a payload with only the fields the backend DTO accepts.
// (Global ValidationPipe uses forbidNonWhitelisted, so extra keys → 400;
//  empty optional numbers must be omitted, not sent as "".)
function clean(obj, numericKeys = []) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v === null || v === undefined) continue
    out[k] = numericKeys.includes(k) ? Number(v) : v
  }
  return out
}

export default function AdminPanel() {
  const nav = useNavigate()
  const [tab, setTab] = useState('hospital')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null) // { type:'ok'|'err', text }

  // hospital form
  const [h, setH] = useState({ name: '', phone: '', email: '', city: '', state: '', latitude: '', longitude: '', license_number: '' })
  const setHF = (k, v) => setH(s => ({ ...s, [k]: v }))

  // blood bank form
  const [b, setB] = useState({ name: '', phone: '', city: '', state: '', latitude: '', longitude: '' })
  const setBF = (k, v) => setB(s => ({ ...s, [k]: v }))
  const [units, setUnits] = useState(Object.fromEntries(GROUPS.map(g => [g, '']))) // '' = 0

  const submitHospital = async e => {
    e.preventDefault(); setMsg(null)
    if (!h.name || !h.city || !h.state) { setMsg({ type: 'err', text: 'Name, city and state are required.' }); return }
    setLoading(true)
    try {
      const payload = clean(h, ['latitude', 'longitude'])
      await hospitalsApi.create(payload)
      setMsg({ type: 'ok', text: `✓ Hospital "${h.name}" added.` })
      setH({ name: '', phone: '', email: '', city: '', state: '', latitude: '', longitude: '', license_number: '' })
    } catch (err) {
      setMsg({ type: 'err', text: err?.error?.message || err?.message || 'Failed to add hospital (are you an admin?).' })
    } finally { setLoading(false) }
  }

  const submitBank = async e => {
    e.preventDefault(); setMsg(null)
    if (!b.name || !b.city || !b.state) { setMsg({ type: 'err', text: 'Name, city and state are required.' }); return }
    setLoading(true)
    try {
      const payload = clean(b, ['latitude', 'longitude'])
      const res = await bloodBanksApi.create(payload)
      const bankId = res?.data?.id
      // set stock for any group with a positive number entered
      if (bankId) {
        for (const g of GROUPS) {
          const n = Number(units[g])
          if (n > 0) await bloodBanksApi.updateInventory(bankId, g, n)
        }
      }
      setMsg({ type: 'ok', text: `✓ Blood bank "${b.name}" added with inventory.` })
      setB({ name: '', phone: '', city: '', state: '', latitude: '', longitude: '' })
      setUnits(Object.fromEntries(GROUPS.map(g => [g, ''])))
    } catch (err) {
      setMsg({ type: 'err', text: err?.error?.message || err?.message || 'Failed to add blood bank (are you an admin?).' })
    } finally { setLoading(false) }
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>⚙️ Admin Panel</h1>
          <p style={S.sub}>Add and manage hospitals and blood banks</p>
        </div>
        <button style={S.linkBtn} onClick={() => nav('/hospitals')}>View directory →</button>
      </div>

      <div style={S.tabs}>
        <button style={{ ...S.tab, ...(tab === 'hospital' ? S.tabActive : {}) }} onClick={() => { setTab('hospital'); setMsg(null) }}>🏥 Add Hospital</button>
        <button style={{ ...S.tab, ...(tab === 'bank' ? S.tabActive : {}) }} onClick={() => { setTab('bank'); setMsg(null) }}>🩸 Add Blood Bank</button>
      </div>

      {msg && <div style={{ ...S.banner, ...(msg.type === 'ok' ? S.bannerOk : S.bannerErr) }}>{msg.text}</div>}

      {tab === 'hospital' ? (
        <form style={S.card} onSubmit={submitHospital}>
          <div style={S.grid2}>
            <Field label="Name *"><input style={S.input} value={h.name} onChange={e => setHF('name', e.target.value)} placeholder="Apollo Hospitals" /></Field>
            <Field label="Phone"><input style={S.input} value={h.phone} onChange={e => setHF('phone', e.target.value)} placeholder="+9140..." /></Field>
            <Field label="Email"><input style={S.input} value={h.email} onChange={e => setHF('email', e.target.value)} placeholder="info@hospital.com" /></Field>
            <Field label="License number"><input style={S.input} value={h.license_number} onChange={e => setHF('license_number', e.target.value)} placeholder="TS-HOSP-1234" /></Field>
            <Field label="City *"><input style={S.input} value={h.city} onChange={e => setHF('city', e.target.value)} placeholder="Hyderabad" /></Field>
            <Field label="State *"><input style={S.input} value={h.state} onChange={e => setHF('state', e.target.value)} placeholder="Telangana" /></Field>
            <Field label="Latitude"><input style={S.input} type="number" step="any" value={h.latitude} onChange={e => setHF('latitude', e.target.value)} placeholder="17.4239" /></Field>
            <Field label="Longitude"><input style={S.input} type="number" step="any" value={h.longitude} onChange={e => setHF('longitude', e.target.value)} placeholder="78.4738" /></Field>
          </div>
          <button style={S.submit} disabled={loading}>{loading ? 'Saving…' : 'Add Hospital'}</button>
          <p style={S.note}>New hospitals start as unverified; verify them later from the directory/admin tools.</p>
        </form>
      ) : (
        <form style={S.card} onSubmit={submitBank}>
          <div style={S.grid2}>
            <Field label="Name *"><input style={S.input} value={b.name} onChange={e => setBF('name', e.target.value)} placeholder="Red Cross Blood Bank" /></Field>
            <Field label="Phone"><input style={S.input} value={b.phone} onChange={e => setBF('phone', e.target.value)} placeholder="+9140..." /></Field>
            <Field label="City *"><input style={S.input} value={b.city} onChange={e => setBF('city', e.target.value)} placeholder="Hyderabad" /></Field>
            <Field label="State *"><input style={S.input} value={b.state} onChange={e => setBF('state', e.target.value)} placeholder="Telangana" /></Field>
            <Field label="Latitude"><input style={S.input} type="number" step="any" value={b.latitude} onChange={e => setBF('latitude', e.target.value)} placeholder="17.3850" /></Field>
            <Field label="Longitude"><input style={S.input} type="number" step="any" value={b.longitude} onChange={e => setBF('longitude', e.target.value)} placeholder="78.4867" /></Field>
          </div>

          <div style={S.invLabel}>Blood inventory (units) — leave blank for 0</div>
          <div style={S.invGrid}>
            {GROUPS.map(g => (
              <div key={g} style={S.invCell}>
                <span style={S.invBg}>{g}</span>
                <input style={S.invInput} type="number" min="0" value={units[g]} onChange={e => setUnits(u => ({ ...u, [g]: e.target.value }))} placeholder="0" />
              </div>
            ))}
          </div>

          <button style={S.submit} disabled={loading}>{loading ? 'Saving…' : 'Add Blood Bank'}</button>
        </form>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={S.field}>
      <span style={S.flabel}>{label}</span>
      {children}
    </label>
  )
}

const S = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' },
  h1: { fontSize: 26, fontWeight: 800, color: 'var(--text)' },
  sub: { fontSize: 14, color: 'var(--text-3)', marginTop: 4 },
  linkBtn: { padding: '8px 14px', border: '2px solid var(--border)', borderRadius: 8, background: 'white', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: { padding: '9px 20px', borderRadius: 10, border: '2px solid var(--border)', background: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: 'var(--text-2)' },
  tabActive: { borderColor: 'var(--red)', background: 'var(--red-pale)', color: 'var(--red)' },
  banner: { padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, marginBottom: 16 },
  bannerOk: { background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' },
  bannerErr: { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' },
  card: { background: 'white', borderRadius: 14, padding: '24px', boxShadow: 'var(--shadow-sm)' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  flabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-2)' },
  input: { padding: '9px 12px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  invLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text-2)', margin: '20px 0 10px' },
  invGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  invCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px', border: '1px solid var(--border)', borderRadius: 8 },
  invBg: { fontSize: 13, fontWeight: 800, color: 'var(--red)' },
  invInput: { width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, textAlign: 'center', outline: 'none', boxSizing: 'border-box' },
  submit: { marginTop: 20, padding: '11px 28px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(192,57,43,.3)' },
  note: { fontSize: 12, color: 'var(--text-3)', marginTop: 10 },
}
