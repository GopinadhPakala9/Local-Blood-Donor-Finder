import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { requests } from '../api'

const URGENCY_COLOR = { Critical:['#FEE2E2','#991B1B'], Urgent:['#FEF3C7','#92400E'], Normal:['#F0FDF4','#166534'] }
const URGENCY_ICON  = { Critical:'🚨', Urgent:'⚠️', Normal:'✅' }
const BG_MAP = {'A+':'#EBF5FB','A-':'#D6EAF8','B+':'#FDEBD0','B-':'#FAD7A0','O+':'#FDEDEC','O-':'#FADBD8','AB+':'#E8DAEF','AB-':'#D7BDE2'}
const BG_TEXT= {'A+':'#1A5276','A-':'#154360','B+':'#784212','B-':'#6E2F1A','O+':'#7B241C','O-':'#641E16','AB+':'#4A235A','AB-':'#3B1A59'}
const GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-']

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function BloodRequests() {
  const nav = useNavigate()
  const [filters, setFilters]   = useState({ status:'Open', blood_group:'', urgency:'', page:1, limit:10 })
  const [result, setResult]     = useState({ requests:[], total:0 })
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('Open')

  const load = async (f = filters) => {
    setLoading(true)
    try {
      const res = await requests.list({ ...f, blood_group: f.blood_group||undefined, urgency: f.urgency||undefined })
      setResult(res.data || { requests:[], total:0 })
    } catch { setResult({ requests:[], total:0 }) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const switchTab = t => { const f = {...filters, status:t, page:1}; setFilters(f); setActiveTab(t); load(f) }
  const upd = (k, v) => { const f = {...filters, [k]:v, page:1}; setFilters(f); load(f) }

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')||'{}') } catch { return {} }})()

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>🩸 Blood Requests</h1>
          <p style={S.sub}>Active blood donation requests in your area</p>
        </div>
        <button style={S.newBtn} onClick={() => nav('/requests/new')}>+ New Request</button>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {['Open','Fulfilled','Cancelled'].map(t => (
          <button key={t} style={{...S.tab, ...(activeTab===t ? S.tabActive : {})}} onClick={() => switchTab(t)}>
            {t === 'Open' ? '🔴' : t === 'Fulfilled' ? '✅' : '❌'} {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={S.filterBar}>
        <div style={S.filterGroup}>
          <label style={S.flabel}>Blood Group</label>
          <select style={S.sel} value={filters.blood_group} onChange={e => upd('blood_group', e.target.value)}>
            <option value="">All</option>
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={S.filterGroup}>
          <label style={S.flabel}>Urgency</label>
          <select style={S.sel} value={filters.urgency} onChange={e => upd('urgency', e.target.value)}>
            <option value="">All</option>
            <option value="Critical">🚨 Critical</option>
            <option value="Urgent">⚠️ Urgent</option>
            <option value="Normal">✅ Normal</option>
          </select>
        </div>
        <span style={{fontSize:14, color:'var(--text-3)', alignSelf:'center', marginLeft:'auto'}}>
          {result.total} request{result.total!==1?'s':''}
        </span>
      </div>

      {/* Request Cards */}
      {loading ? (
        <div style={S.loadWrap}><div style={S.loader}/></div>
      ) : result.requests.length === 0 ? (
        <div style={S.empty}>
          <div style={{fontSize:56}}>{activeTab==='Open' ? '🎉' : '📭'}</div>
          <h3 style={{color:'var(--text-2)', marginTop:12}}>
            {activeTab==='Open' ? 'No open requests right now' : `No ${activeTab.toLowerCase()} requests`}
          </h3>
          {activeTab==='Open' && <button style={S.newBtn2} onClick={() => nav('/requests/new')}>Create a Request</button>}
        </div>
      ) : (
        <div style={S.list}>
          {result.requests.map(r => {
            const [bg, tx] = URGENCY_COLOR[r.urgency] || ['#F3F4F6','#374151']
            const bgC = BG_MAP[r.blood_group] || '#F3F4F6'
            const txC = BG_TEXT[r.blood_group] || '#374151'
            return (
              <div key={r.id} style={S.card} className="fade-in">
                <div style={S.cardLeft}>
                  <div style={{...S.urgBadge, background:bg, color:tx}}>
                    {URGENCY_ICON[r.urgency]} {r.urgency}
                  </div>
                  <div style={{...S.bgBig, background:bgC, color:txC}}>{r.blood_group}</div>
                </div>
                <div style={S.cardBody}>
                  <div style={S.patName}>{r.patient_name}</div>
                  <div style={S.patSub}>🏥 {r.hospital_name}</div>
                  <div style={S.patSub}>📍 {r.city || 'Location not specified'}</div>
                  <div style={S.chips}>
                    <span style={S.chip}>💧 {r.units_required} unit{r.units_required!==1?'s':''}</span>
                    {r.required_date && <span style={S.chip}>📅 By {new Date(r.required_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</span>}
                    <span style={S.chip}>🕐 {timeAgo(r.created_at)}</span>
                  </div>
                </div>
                <div style={S.cardRight}>
                  {r.requester_id === user.id && (
                    <span style={{fontSize:12, color:'var(--text-3)', background:'#F3F4F6', padding:'3px 10px', borderRadius:20}}>My Request</span>
                  )}
                  <button style={S.contactBtn} onClick={() => window.location.href = `tel:${r.contact_number}`}>
                    📞 {r.contact_number}
                  </button>
                  <button style={S.waBtn} onClick={() => window.open(`https://wa.me/${r.contact_number?.replace(/\D/g,'')}?text=Hi, I can donate ${r.blood_group} blood for ${r.patient_name}`)}>
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const S = {
  page: { maxWidth:1100, margin:'0 auto', padding:'24px' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 },
  h1: { fontSize:26, fontWeight:800, color:'var(--text)' },
  sub: { fontSize:14, color:'var(--text-3)', marginTop:4 },
  newBtn: { padding:'10px 20px', background:'var(--red)', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(192,57,43,.3)' },
  newBtn2: { marginTop:16, padding:'10px 24px', background:'var(--red)', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 },
  tabs: { display:'flex', gap:4, marginBottom:16, background:'white', padding:4, borderRadius:10, boxShadow:'var(--shadow-sm)', width:'fit-content' },
  tab: { padding:'8px 20px', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', background:'none', color:'var(--text-2)', transition:'all .15s' },
  tabActive: { background:'var(--red)', color:'white', boxShadow:'0 2px 8px rgba(192,57,43,.3)' },
  filterBar: { background:'white', borderRadius:12, padding:'16px 20px', display:'flex', gap:20, alignItems:'flex-end', boxShadow:'var(--shadow-sm)', marginBottom:20, flexWrap:'wrap' },
  filterGroup: { display:'flex', flexDirection:'column', gap:5 },
  flabel: { fontSize:12, fontWeight:600, color:'var(--text-2)' },
  sel: { padding:'8px 12px', border:'2px solid var(--border)', borderRadius:8, fontSize:14, color:'var(--text)', outline:'none', background:'white' },
  list: { display:'flex', flexDirection:'column', gap:12 },
  card: { background:'white', borderRadius:14, padding:'20px', display:'flex', gap:20, alignItems:'center', boxShadow:'var(--shadow-sm)', transition:'box-shadow .2s' },
  cardLeft: { display:'flex', flexDirection:'column', alignItems:'center', gap:8, flexShrink:0 },
  urgBadge: { padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap' },
  bgBig: { width:52, height:52, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16 },
  cardBody: { flex:1, minWidth:0 },
  patName: { fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:4 },
  patSub: { fontSize:13, color:'var(--text-3)', marginBottom:2 },
  chips: { display:'flex', gap:6, flexWrap:'wrap', marginTop:8 },
  chip: { padding:'3px 10px', background:'#F3F4F6', borderRadius:20, fontSize:12, color:'var(--text-2)', fontWeight:500 },
  cardRight: { display:'flex', flexDirection:'column', gap:8, flexShrink:0 },
  contactBtn: { padding:'8px 16px', background:'var(--red-pale)', color:'var(--red)', border:'2px solid #FECACA', borderRadius:8, fontWeight:600, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' },
  waBtn: { padding:'8px 16px', background:'#DCFCE7', color:'#166534', border:'2px solid #BBF7D0', borderRadius:8, fontWeight:600, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' },
  loadWrap: { display:'flex', justifyContent:'center', padding:'60px 0' },
  loader: { width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--red)', borderRadius:'50%', animation:'spin .8s linear infinite' },
  empty: { textAlign:'center', padding:'60px 0' },
}
