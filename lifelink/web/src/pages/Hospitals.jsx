import { useState, useEffect } from 'react'
import { hospitals as hospitalsApi, bloodBanks as bloodBanksApi } from '../api'
import { isAdmin } from '../auth'

const GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-']

const hover = {
  onMouseEnter: e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.transform='translateY(-2px)' },
  onMouseLeave: e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='translateY(0)' },
}

function HospitalCard({ h }) {
  const admin = isAdmin()
  const [inventory, setInventory] = useState(h.inventory || [])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)

  const unitsFor = g => inventory.find(i => i.blood_group === g)?.available_units || 0
  const totalUnits = inventory.reduce((s, i) => s + (i.available_units || 0), 0)

  const startEdit = () => {
    setDraft(Object.fromEntries(GROUPS.map(g => [g, String(unitsFor(g))])))
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const next = GROUPS.map(g => ({ blood_group: g, available_units: Math.max(0, parseInt(draft[g], 10) || 0) }))
      for (const { blood_group, available_units } of next) {
        if (available_units !== unitsFor(blood_group)) {
          await hospitalsApi.updateInventory(h.id, blood_group, available_units)
        }
      }
      setInventory(next)
      setEditing(false)
    } catch (e) {
      alert(e?.error?.message || e?.message || 'Failed to update stock (are you an admin?).')
    } finally { setSaving(false) }
  }

  return (
    <div style={S.card} className="fade-in" {...hover}>
      <div style={S.cardTop}>
        <div style={S.icon}>🏥</div>
        <div style={{flex:1}}>
          <div style={S.name}>{h.name}</div>
          <div style={S.loc}>📍 {h.city || 'Unknown'}{h.state ? `, ${h.state}` : ''}</div>
          {h.phone && <div style={S.phone}>📞 {h.phone}</div>}
          {h.email && <div style={S.phone}>✉️ {h.email}</div>}
        </div>
      </div>
      {h.license_number && <div style={S.meta}><span style={S.chip}>🪪 {h.license_number}</span></div>}

      <div>
        <div style={S.invLabel}>Blood availability {totalUnits > 0 ? `· ${totalUnits} units` : ''}</div>
        <div style={S.invGrid}>
          {GROUPS.map(g => {
            const units = unitsFor(g)
            return (
              <div key={g} style={{...S.invCell, ...(units > 0 ? S.invYes : S.invNo)}}>
                <span style={S.invBg}>{g}</span>
                {editing
                  ? <input style={S.invEditInput} type="number" min="0" value={draft[g]}
                      onChange={e => setDraft(d => ({ ...d, [g]: e.target.value }))} />
                  : <span style={S.invUnits}>{units}</span>}
              </div>
            )
          })}
        </div>
        {admin && (
          <div style={S.adminBar}>
            {editing ? (
              <>
                <button style={S.saveStockBtn} disabled={saving} onClick={save}>{saving ? 'Saving…' : '✓ Save stock'}</button>
                <button style={S.cancelStockBtn} disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
              </>
            ) : (
              <button style={S.editStockBtn} onClick={startEdit}>✏️ Edit stock</button>
            )}
          </div>
        )}
      </div>

      {h.phone && (
        <div style={S.actions}>
          <button style={S.callBtn} onClick={() => { window.location.href = `tel:${h.phone}` }}>📞 Call Hospital</button>
        </div>
      )}
    </div>
  )
}

function BankCard({ b }) {
  const admin = isAdmin()
  const [inventory, setInventory] = useState(b.inventory || [])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)

  const unitsFor = g => inventory.find(i => i.blood_group === g)?.available_units || 0
  const totalUnits = inventory.reduce((s, i) => s + (i.available_units || 0), 0)

  const startEdit = () => {
    setDraft(Object.fromEntries(GROUPS.map(g => [g, String(unitsFor(g))])))
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const next = GROUPS.map(g => ({ blood_group: g, available_units: Math.max(0, parseInt(draft[g], 10) || 0) }))
      for (const { blood_group, available_units } of next) {
        if (available_units !== unitsFor(blood_group)) {
          await bloodBanksApi.updateInventory(b.id, blood_group, available_units)
        }
      }
      setInventory(next)
      setEditing(false)
    } catch (e) {
      alert(e?.error?.message || e?.message || 'Failed to update stock (are you an admin?).')
    } finally { setSaving(false) }
  }

  return (
    <div style={S.card} className="fade-in" {...hover}>
      <div style={S.cardTop}>
        <div style={S.icon}>🩸</div>
        <div style={{flex:1}}>
          <div style={S.name}>{b.name}</div>
          <div style={S.loc}>📍 {b.city || 'Unknown'}{b.state ? `, ${b.state}` : ''}</div>
          {b.phone && <div style={S.phone}>📞 {b.phone}</div>}
        </div>
      </div>

      <div>
        <div style={S.invLabel}>Blood availability {totalUnits > 0 ? `· ${totalUnits} units` : ''}</div>
        <div style={S.invGrid}>
          {GROUPS.map(g => {
            const units = unitsFor(g)
            return (
              <div key={g} style={{...S.invCell, ...(units > 0 ? S.invYes : S.invNo)}}>
                <span style={S.invBg}>{g}</span>
                {editing
                  ? <input style={S.invEditInput} type="number" min="0" value={draft[g]}
                      onChange={e => setDraft(d => ({ ...d, [g]: e.target.value }))} />
                  : <span style={S.invUnits}>{units}</span>}
              </div>
            )
          })}
        </div>
        {admin && (
          <div style={S.adminBar}>
            {editing ? (
              <>
                <button style={S.saveStockBtn} disabled={saving} onClick={save}>{saving ? 'Saving…' : '✓ Save stock'}</button>
                <button style={S.cancelStockBtn} disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
              </>
            ) : (
              <button style={S.editStockBtn} onClick={startEdit}>✏️ Edit stock</button>
            )}
          </div>
        )}
      </div>

      {b.phone && (
        <div style={S.actions}>
          <button style={S.callBtn} onClick={() => { window.location.href = `tel:${b.phone}` }}>📞 Call Blood Bank</button>
        </div>
      )}
    </div>
  )
}

export default function Hospitals() {
  const [tab, setTab]         = useState('hospitals')
  const [city, setCity]       = useState('')
  const [hospList, setHosp]   = useState([])
  const [bankList, setBank]   = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded]   = useState(false)

  const load = async (which = tab, c = city) => {
    setLoading(true); setLoaded(true)
    try {
      if (which === 'hospitals') {
        const res = await hospitalsApi.list({ city: c || undefined, page: 1, limit: 100 })
        setHosp(res.data?.hospitals || [])
      } else {
        const res = await bloodBanksApi.list({ city: c || undefined, page: 1, limit: 100 })
        setBank(res.data?.banks || [])
      }
    } catch {
      which === 'hospitals' ? setHosp([]) : setBank([])
    } finally { setLoading(false) }
  }

  // reload whenever the tab changes
  useEffect(() => { load(tab, city) }, [tab])   // eslint-disable-line react-hooks/exhaustive-deps

  const list = tab === 'hospitals' ? hospList : bankList

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>🏥 Hospitals & Blood Banks</h1>
        <p style={S.sub}>Find registered hospitals and blood banks with live blood inventory</p>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        <button style={{...S.tab, ...(tab==='hospitals' ? S.tabActive : {})}} onClick={() => setTab('hospitals')}>🏥 Hospitals</button>
        <button style={{...S.tab, ...(tab==='banks'     ? S.tabActive : {})}} onClick={() => setTab('banks')}>🩸 Blood Banks</button>
      </div>

      {/* Filter */}
      <div style={S.filterBar}>
        <div style={S.filterGroup}>
          <label style={S.flabel}>City</label>
          <input style={S.finput} placeholder="e.g. Hyderabad" value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load() }} />
        </div>
        <button style={S.searchBtn} onClick={() => load()}>
          {loading ? <span style={S.spin}/> : '🔍'} Search
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div style={S.loadWrap}>
          <div style={S.loader} />
          <p style={{color:'var(--text-3)', marginTop:12}}>Loading {tab === 'hospitals' ? 'hospitals' : 'blood banks'}…</p>
        </div>
      ) : list.length === 0 && loaded ? (
        <div style={S.empty}>
          <div style={{fontSize:56}}>{tab === 'hospitals' ? '🏥' : '🩸'}</div>
          <h3 style={{color:'var(--text-2)', marginTop:12}}>No {tab === 'hospitals' ? 'hospitals' : 'blood banks'} found</h3>
          <p style={{color:'var(--text-3)', fontSize:14}}>Try a different city, or check back later.</p>
        </div>
      ) : (
        <>
          <div style={S.resultsMeta}>
            <span style={{color:'var(--text-2)', fontSize:14}}>
              {list.length} {tab === 'hospitals' ? 'hospital' : 'blood bank'}{list.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={S.grid}>
            {tab === 'hospitals'
              ? hospList.map(h => <HospitalCard key={h.id} h={h} />)
              : bankList.map(b => <BankCard key={b.id} b={b} />)}
          </div>
        </>
      )}
    </div>
  )
}

const S = {
  page: { maxWidth:1200, margin:'0 auto', padding:'24px' },
  header: { marginBottom:20 },
  h1: { fontSize:26, fontWeight:800, color:'var(--text)' },
  sub: { fontSize:14, color:'var(--text-3)', marginTop:4 },
  tabs: { display:'flex', gap:8, marginBottom:16 },
  tab: { padding:'9px 20px', borderRadius:10, border:'2px solid var(--border)', background:'white', fontSize:14, fontWeight:700, cursor:'pointer', color:'var(--text-2)', transition:'all .15s' },
  tabActive: { borderColor:'var(--red)', background:'var(--red-pale)', color:'var(--red)' },
  filterBar: { background:'white', borderRadius:14, padding:'20px 24px', display:'flex', gap:16, alignItems:'flex-end', boxShadow:'var(--shadow-sm)', marginBottom:20, flexWrap:'wrap' },
  filterGroup: { display:'flex', flexDirection:'column', gap:6, flex:1, minWidth:140 },
  flabel: { fontSize:12, fontWeight:600, color:'var(--text-2)' },
  finput: { padding:'9px 12px', border:'2px solid var(--border)', borderRadius:8, fontSize:14, color:'var(--text)', outline:'none' },
  searchBtn: { padding:'10px 24px', background:'var(--red)', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:6, alignSelf:'flex-end', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(192,57,43,.3)' },
  spin: { display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite' },
  resultsMeta: { marginBottom:12 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 },
  card: { background:'white', borderRadius:14, padding:'18px', boxShadow:'var(--shadow-sm)', display:'flex', flexDirection:'column', gap:14, transition:'box-shadow .2s, transform .15s' },
  cardTop: { display:'flex', gap:12, alignItems:'flex-start' },
  icon: { width:48, height:48, borderRadius:12, background:'var(--red-pale)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 },
  name: { fontSize:15, fontWeight:700, color:'var(--text)' },
  loc: { fontSize:12, color:'var(--text-3)', marginTop:2 },
  phone: { fontSize:12, color:'var(--text-2)', marginTop:2 },
  chip: { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'#F3F4F6', color:'#4B5563', whiteSpace:'nowrap', height:'fit-content' },
  meta: { display:'flex', gap:6, flexWrap:'wrap' },
  invLabel: { fontSize:11, fontWeight:600, color:'var(--text-3)', marginBottom:8 },
  invGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6 },
  invCell: { display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 2px', borderRadius:8, border:'1px solid' },
  invYes: { background:'#DCFCE7', borderColor:'#BBF7D0', color:'#166534' },
  invNo: { background:'#F9FAFB', borderColor:'var(--border)', color:'#9CA3AF' },
  invBg: { fontSize:12, fontWeight:800 },
  invUnits: { fontSize:11, fontWeight:600 },
  invEditInput: { width:'100%', marginTop:3, padding:'2px 0', border:'1px solid #9CA3AF', borderRadius:5, fontSize:12, textAlign:'center', outline:'none', boxSizing:'border-box' },
  adminBar: { display:'flex', gap:8, marginTop:10 },
  editStockBtn: { padding:'6px 14px', background:'#EDE9FE', color:'#6D28D9', border:'2px solid #DDD6FE', borderRadius:8, fontWeight:600, fontSize:12, cursor:'pointer' },
  saveStockBtn: { padding:'6px 14px', background:'#16A34A', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' },
  cancelStockBtn: { padding:'6px 14px', background:'white', color:'var(--text-2)', border:'2px solid var(--border)', borderRadius:8, fontWeight:600, fontSize:12, cursor:'pointer' },
  actions: { display:'flex', gap:8 },
  callBtn: { flex:1, padding:'9px', background:'var(--red-pale)', color:'var(--red)', border:'2px solid #FECACA', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' },
  loadWrap: { display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0' },
  loader: { width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--red)', borderRadius:'50%', animation:'spin .8s linear infinite' },
  empty: { textAlign:'center', padding:'60px 0' },
}
