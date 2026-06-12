import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { donors } from '../api'

const fmtBG = bg => bg ? bg.replace('+', '+ve').replace('-', '-ve') : bg
const BG_MAP = {'A+':'#EBF5FB','A-':'#D6EAF8','B+':'#FDEBD0','B-':'#FAD7A0','O+':'#FDEDEC','O-':'#FADBD8','AB+':'#E8DAEF','AB-':'#D7BDE2'}
const BG_TEXT= {'A+':'#1A5276','A-':'#154360','B+':'#784212','B-':'#6E2F1A','O+':'#7B241C','O-':'#641E16','AB+':'#4A235A','AB-':'#3B1A59'}
const GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-']

function DonorCard({ donor, onCall, onWhatsApp, onView }) {
  const bg   = BG_MAP[donor.blood_group] || '#F3F4F6'
  const tx   = BG_TEXT[donor.blood_group] || '#374151'
  const init = donor.name?.[0]?.toUpperCase() || '?'

  return (
    <div style={{...S.card, cursor:'pointer'}} className="fade-in" onClick={onView}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='translateY(0)' }}
    >
      <div style={S.cardTop}>
        <div style={S.avatarWrap}>
          <div style={S.avatar}>{init}</div>
          <div style={{...S.bgChip, background:bg, color:tx}}>{donor.blood_group}</div>
        </div>
        <div style={{flex:1}}>
          <div style={S.name}>{donor.name || 'Anonymous Donor'}</div>
          <div style={S.loc}>📍 {donor.city || 'Unknown'}{donor.state ? `, ${donor.state}` : ''}</div>
          {donor.phone && <div style={S.phone}>📞 {donor.phone}</div>}
          {donor.distance && <div style={S.dist}>🗺 {donor.distance}</div>}
        </div>
        <div style={{...S.avail, ...(donor.is_available ? S.availY : S.availN)}}>
          {donor.is_available ? '● Available' : '○ Unavailable'}
        </div>
      </div>

      <div style={S.meta}>
        {donor.total_donations > 0 && <span style={S.chip}>💉 {donor.total_donations} donation{donor.total_donations !== 1 ? 's' : ''}</span>}
        {donor.badge && <span style={{...S.chip, background:'#FEF9C3', color:'#854D0E'}}>🏆 {donor.badge}</span>}
        {donor.is_verified && <span style={{...S.chip, background:'#DCFCE7', color:'#166534'}}>✓ Verified</span>}
      </div>

      {donor.is_available && (
        <div style={S.actions}>
          <button style={S.callBtn} onClick={e => { e.stopPropagation(); onCall(donor.phone) }}>📞 Call</button>
          <button style={S.waBtn} onClick={e => { e.stopPropagation(); onWhatsApp(donor.phone, donor.blood_group) }}>💬 WhatsApp</button>
        </div>
      )}
    </div>
  )
}

export default function DonorSearch() {
  const nav = useNavigate()
  const [filters, setFilters] = useState({ blood_group:'', city:'', radius:10, page:1, limit:12 })
  const [result, setResult]   = useState({ donors:[], total:0 })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const upd = (k, v) => setFilters(f => ({ ...f, [k]:v, page:1 }))

  const search = async (f = filters) => {
    setLoading(true); setSearched(true)
    try {
      const res = await donors.search({ ...f, blood_group: f.blood_group || undefined, city: f.city || undefined })
      setResult(res.data || { donors:[], total:0 })
    } catch { setResult({ donors:[], total:0 }) }
    finally { setLoading(false) }
  }

  useEffect(() => { search() }, [])

  const nextPage = () => { const f = { ...filters, page: filters.page + 1 }; setFilters(f); search(f) }
  const prevPage = () => { const f = { ...filters, page: Math.max(1, filters.page - 1) }; setFilters(f); search(f) }

  const callDonor = phone => { if (phone) window.location.href = `tel:${phone}` }
  const waDonor   = (phone, bg) => { if (phone) window.open(`https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi, I need blood group ${fmtBG(bg)}. Are you available to donate?`)}`) }

  const totalPages = Math.ceil((result.total || 0) / filters.limit)

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>🔍 Find Blood Donors</h1>
          <p style={S.sub}>Search for available donors near you by blood group or city</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={S.filterBar}>
        <div style={S.filterGroup}>
          <label style={S.flabel}>Blood Group</label>
          <select style={S.select} value={filters.blood_group} onChange={e => upd('blood_group', e.target.value)}>
            <option value="">All Groups</option>
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={S.filterGroup}>
          <label style={S.flabel}>City</label>
          <input style={S.finput} placeholder="e.g. Hyderabad" value={filters.city} onChange={e => upd('city', e.target.value)} />
        </div>
        <div style={S.filterGroup}>
          <label style={S.flabel}>Radius (km)</label>
          <select style={S.select} value={filters.radius} onChange={e => upd('radius', +e.target.value)}>
            {[5,10,20,50,100].map(r => <option key={r} value={r}>{r} km</option>)}
          </select>
        </div>
        <button style={S.searchBtn} onClick={() => search()}>
          {loading ? <span style={S.spin}/> : '🔍'} Search
        </button>
      </div>

      {/* Blood Group Quick Pills */}
      <div style={S.pills}>
        <button style={{...S.pill, ...(filters.blood_group==='' ? S.pillActive : {})}} onClick={() => { upd('blood_group',''); setTimeout(search, 100) }}>All</button>
        {GROUPS.map(g => (
          <button key={g} style={{...S.pill, ...(filters.blood_group===g ? S.pillActive : {}), background: filters.blood_group===g ? BG_MAP[g] : undefined, color: filters.blood_group===g ? BG_TEXT[g] : undefined}}
            onClick={() => { upd('blood_group', g); setTimeout(() => search({...filters, blood_group:g, page:1}), 50) }}>
            {g}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div style={S.loadWrap}>
          <div style={S.loader} />
          <p style={{color:'var(--text-3)', marginTop:12}}>Searching donors…</p>
        </div>
      ) : result.donors.length === 0 && searched ? (
        <div style={S.empty}>
          <div style={{fontSize:56}}>🩺</div>
          <h3 style={{color:'var(--text-2)', marginTop:12}}>No donors found</h3>
          <p style={{color:'var(--text-3)', fontSize:14}}>Try adjusting your filters or increasing the radius.</p>
        </div>
      ) : (
        <>
          <div style={S.resultsMeta}>
            <span style={{color:'var(--text-2)', fontSize:14}}>
              {result.total > 0 ? `${result.total} donor${result.total!==1?'s':''} found` : `${result.donors.length} donors`}
            </span>
          </div>
          <div style={S.grid}>
            {result.donors.map(d => (
              <DonorCard key={d.id} donor={d} onCall={callDonor} onWhatsApp={waDonor} onView={() => nav(`/donors/${d.id}`)} />
            ))}
          </div>
          {totalPages > 1 && (
            <div style={S.pagination}>
              <button style={S.pgBtn} disabled={filters.page <= 1} onClick={prevPage}>← Prev</button>
              <span style={{fontSize:14, color:'var(--text-2)'}}>Page {filters.page} of {totalPages}</span>
              <button style={S.pgBtn} disabled={filters.page >= totalPages} onClick={nextPage}>Next →</button>
            </div>
          )}
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
  filterBar: { background:'white', borderRadius:14, padding:'20px 24px', display:'flex', gap:16, alignItems:'flex-end', boxShadow:'var(--shadow-sm)', marginBottom:16, flexWrap:'wrap' },
  filterGroup: { display:'flex', flexDirection:'column', gap:6, flex:1, minWidth:140 },
  flabel: { fontSize:12, fontWeight:600, color:'var(--text-2)' },
  select: { padding:'9px 12px', border:'2px solid var(--border)', borderRadius:8, fontSize:14, color:'var(--text)', outline:'none', background:'white' },
  finput: { padding:'9px 12px', border:'2px solid var(--border)', borderRadius:8, fontSize:14, color:'var(--text)', outline:'none' },
  searchBtn: { padding:'10px 24px', background:'var(--red)', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:6, alignSelf:'flex-end', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(192,57,43,.3)' },
  spin: { display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite' },
  pills: { display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 },
  pill: { padding:'6px 14px', borderRadius:20, border:'2px solid var(--border)', background:'white', fontSize:13, fontWeight:600, cursor:'pointer', color:'var(--text-2)', transition:'all .15s' },
  pillActive: { borderColor:'var(--red)', background:'var(--red-pale)', color:'var(--red)' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 },
  card: { background:'white', borderRadius:14, padding:'18px', boxShadow:'var(--shadow-sm)', display:'flex', flexDirection:'column', gap:12, transition:'box-shadow .2s, transform .15s' },
  cardTop: { display:'flex', gap:12, alignItems:'flex-start' },
  avatarWrap: { position:'relative', flexShrink:0 },
  avatar: { width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#C0392B,#922B21)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18 },
  bgChip: { position:'absolute', bottom:-6, right:-6, padding:'2px 7px', borderRadius:10, fontSize:11, fontWeight:800, border:'2px solid white' },
  name: { fontSize:15, fontWeight:700, color:'var(--text)' },
  loc: { fontSize:12, color:'var(--text-3)', marginTop:2 },
  phone: { fontSize:12, color:'var(--text-2)', marginTop:2 },
  dist: { fontSize:12, color:'var(--red)', fontWeight:500, marginTop:1 },
  avail: { fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 },
  availY: { background:'#DCFCE7', color:'#166534' },
  availN: { background:'#F3F4F6', color:'#6B7280' },
  meta: { display:'flex', gap:6, flexWrap:'wrap' },
  chip: { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'#F3F4F6', color:'#4B5563' },
  actions: { display:'flex', gap:8 },
  callBtn: { flex:1, padding:'9px', background:'var(--red-pale)', color:'var(--red)', border:'2px solid #FECACA', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' },
  waBtn: { flex:1, padding:'9px', background:'#DCFCE7', color:'#166534', border:'2px solid #BBF7D0', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' },
  loadWrap: { display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0' },
  loader: { width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--red)', borderRadius:'50%', animation:'spin .8s linear infinite' },
  empty: { textAlign:'center', padding:'60px 0' },
  resultsMeta: { marginBottom:12 },
  pagination: { display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginTop:24 },
  pgBtn: { padding:'8px 20px', border:'2px solid var(--border)', borderRadius:8, background:'white', color:'var(--text)', fontSize:14, fontWeight:500, cursor:'pointer' },
}
