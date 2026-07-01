import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requests, donors, users } from '../api'

function AvailabilityToggle({ initial, onChange }) {
  const [active, setActive] = useState(initial)
  const [saving, setSaving] = useState(false)

  const toggle = async () => {
    setSaving(true)
    try {
      const next = !active
      await donors.setAvailability(next)
      setActive(next)
      onChange?.(next)
      // update localStorage so navbar stays in sync
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...u, is_available: next }))
      } catch {}
    } finally { setSaving(false) }
  }

  return (
    <div style={T.wrap}>
      <span style={T.label}>Donor Status</span>
      <button onClick={toggle} disabled={saving} style={{...T.pill, background: active ? '#16A34A' : '#6B7280'}}>
        <span style={{...T.dot, transform: active ? 'translateX(20px)' : 'translateX(2px)'}} />
      </button>
      <span style={{...T.status, color: active ? '#86EFAC' : 'rgba(255,255,255,0.6)'}}>
        {saving ? 'Saving…' : active ? '● Active' : '○ Inactive'}
      </span>
    </div>
  )
}

const T = {
  wrap:   { display:'flex', alignItems:'center', gap:10 },
  label:  { fontSize:13, color:'rgba(255,255,255,0.8)', fontWeight:500 },
  pill:   { width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', position:'relative', transition:'background .25s', flexShrink:0 },
  dot:    { position:'absolute', top:2, width:20, height:20, borderRadius:'50%', background:'white', transition:'transform .25s', display:'block' },
  status: { fontSize:13, fontWeight:600, minWidth:72 },
}

const BG_COLORS = { Critical:'#FEE2E2', Urgent:'#FEF3C7', Normal:'#F0FDF4' }
const TX_COLORS = { Critical:'#991B1B', Urgent:'#92400E', Normal:'#166534' }
const BG_MAP    = { 'A+':'#EBF5FB','A-':'#D6EAF8','B+':'#FDEBD0','B-':'#FAD7A0','O+':'#FDEDEC','O-':'#FADBD8','AB+':'#E8DAEF','AB-':'#D7BDE2' }

function StatCard({ icon, label, value, sub, color, to }) {
  const nav = useNavigate()
  return (
    <div
      style={{...S.statCard, borderTop:`4px solid ${color}`, ...(to && {cursor:'pointer'})}}
      onClick={to ? () => nav(to) : undefined}
      onMouseEnter={to ? e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.transform='translateY(-2px)' } : undefined}
      onMouseLeave={to ? e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='translateY(0)' } : undefined}
    >
      <div style={{...S.statIcon, background: color+'22', color}}>{icon}</div>
      <div>
        <div style={S.statVal}>{value}</div>
        <div style={S.statLabel}>{label}</div>
        {sub && <div style={S.statSub}>{sub}</div>}
      </div>
    </div>
  )
}

function UrgencyBadge({ u }) {
  return <span style={{padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
    background:BG_COLORS[u]||'#F3F4F6', color:TX_COLORS[u]||'#374151'}}>{u}</span>
}

export default function Dashboard() {
  const nav = useNavigate()
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')||'{}') } catch { return {} }})()
  const [reqs, setReqs]         = useState([])
  const [dons, setDons]         = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [isAvailable, setIsAvailable] = useState(user.is_available !== false)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const refreshDonors = () =>
    donors.search({ limit:4, page:1 }).catch(() => ({}))
      .then(d => setDons(d?.data?.donors || []))

  useEffect(() => {
    Promise.all([
      requests.list({ limit:5, status:'Open' }).catch(() => ({})),
      donors.search({ limit:4, page:1 }).catch(() => ({})),
      users.dashboardStats().catch(() => ({})),
    ]).then(([r, d, s]) => {
      setReqs(r?.data?.requests || [])
      setDons(d?.data?.donors   || [])
      setStats(s?.data || s || null)
    }).finally(() => setLoading(false))
  }, [])

  const urgentCount = reqs.filter(r => r.urgency === 'Critical' || r.urgency === 'Urgent').length

  return (
    <div style={S.page}>
      {/* Hero Banner */}
      <div style={S.hero}>
        <div style={S.heroContent}>
          <div>
            <h1 style={S.heroH}>{greet}, {user.name || 'Friend'} 👋</h1>
            <p style={S.heroP}>
              {user.blood_group
                ? <>Your blood type: <span style={S.bg}>{user.blood_group}</span> · Stay available, save lives.</>
                : 'Welcome to LifeLink. Help save lives by donating blood.'}
            </p>
          </div>
          <AvailabilityToggle initial={isAvailable} onChange={(next) => {
            setIsAvailable(next)
            setStats(prev => prev ? { ...prev, activeDonors: Math.max(0, (prev.activeDonors || 0) + (next ? 1 : -1)) } : prev)
            refreshDonors()
          }} />
        </div>
        <div style={S.heroIll}>
          <svg viewBox="0 0 200 200" width="180" height="180">
            <circle cx="100" cy="100" r="90" fill="rgba(255,255,255,0.1)"/>
            <path d="M100 30 C100 30 50 90 50 125 C50 153 72 175 100 175 C128 175 150 153 150 125 C150 90 100 30 100 30Z" fill="rgba(255,255,255,0.85)"/>
            <path d="M100 60 C100 60 68 108 68 128 C68 146 82 160 100 160 C118 160 132 146 132 128 C132 108 100 60 100 60Z" fill="#C0392B"/>
            <rect x="93" y="108" width="14" height="5" rx="2.5" fill="white"/>
            <rect x="97" y="100" width="6" height="20" rx="3" fill="white"/>
            <path d="M100 185 C100 185 80 172 80 162 C80 155 89 151 95 155 C97 157 99 159 100 162 C101 159 103 157 105 155 C111 151 120 155 120 162 C120 172 100 185 100 185Z" fill="rgba(255,255,255,0.8)"/>
          </svg>
        </div>
      </div>

      <div style={S.content}>
        {/* Stats */}
        <div style={S.statsGrid}>
          <StatCard icon="👥" label="Active Donors"  value={loading ? '…' : (stats?.activeDonors ?? '—')}        sub={isAvailable ? 'Including you ✓' : 'Set yourself Active to appear'} color="#3B82F6" to="/donors" />
          <StatCard icon="🩸" label="Open Requests"  value={loading ? '…' : (stats?.openRequests ?? reqs.length)} sub={urgentCount ? `${urgentCount} urgent` : 'All clear'}             color="#C0392B" to="/requests" />
          <StatCard icon="🏥" label="Hospitals"       value={loading ? '…' : (stats?.totalHospitals ?? '—')}       sub="Registered partners"                                              color="#8B5CF6" />
          <StatCard icon="🏆" label="Lives Saved"     value={loading ? '…' : (stats?.livesSavedThisMonth ?? '—')}  sub="Donations this month"                                             color="#10B981" to="/profile" />
        </div>

        <div style={S.cols}>
          {/* Recent Requests */}
          <div style={S.panel}>
            <div style={S.panelHead}>
              <h3 style={S.panelTitle}>🚨 Urgent Blood Requests</h3>
              <button style={S.viewAll} onClick={() => nav('/requests')}>View All →</button>
            </div>
            {loading ? <p style={S.dim}>Loading…</p> :
              reqs.length === 0 ? <EmptyState icon="✅" msg="No open requests right now" /> :
              reqs.map(r => (
                <div key={r.id} style={S.reqRow} onClick={() => nav('/requests')}>
                  <div style={{...S.bgBadge, background:BG_MAP[r.blood_group]||'#F3F4F6'}}>
                    {r.blood_group}
                  </div>
                  <div style={{flex:1}}>
                    <div style={S.reqName}>{r.patient_name}</div>
                    <div style={S.reqSub}>{r.hospital_name} · {r.city || 'Location N/A'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <UrgencyBadge u={r.urgency} />
                    <div style={{fontSize:12, color:'var(--text-3)', marginTop:3}}>{r.units_required} unit(s)</div>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Nearby Donors */}
          <div style={S.panel}>
            <div style={S.panelHead}>
              <h3 style={S.panelTitle}>📍 Nearby Donors</h3>
              <button style={S.viewAll} onClick={() => nav('/donors')}>Search All →</button>
            </div>
            {loading ? <p style={S.dim}>Loading…</p> :
              dons.length === 0 ? <EmptyState icon="🔍" msg="No donors found nearby" /> :
              dons.map(d => (
                <div key={d.id} style={S.donorRow}>
                  <div style={S.donorAvatar}>{d.name?.[0]?.toUpperCase() || '?'}</div>
                  <div style={{flex:1}}>
                    <div style={S.donorName}>{d.name || 'Anonymous'}</div>
                    <div style={S.reqSub}>{d.city} · {d.distance || 'Nearby'}</div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4}}>
                    <span style={{...S.bgBadge, background:BG_MAP[d.blood_group]||'#F3F4F6', fontSize:12}}>{d.blood_group}</span>
                    {d.is_available
                      ? <span style={{fontSize:11, color:'#16A34A', fontWeight:600}}>● Available</span>
                      : <span style={{fontSize:11, color:'#9CA3AF'}}>○ Unavailable</span>}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Quick Actions */}
        <div style={S.quickGrid}>
          {[
            { icon:'👤', label:'Become a Donor', sub:'Register to help save lives', color:'#3B82F6', to:'/donors' },
            { icon:'🏥', label:'Find Hospitals', sub:'Locate nearby blood banks', color:'#8B5CF6', to:'/hospitals' },
            { icon:'📊', label:'My Donations', sub:'Track your donation history', color:'#10B981', to:'/my-donations' },
          ].map(q => (
            <button key={q.label} style={{...S.qCard, borderLeft:`4px solid ${q.color}`}} onClick={() => nav(q.to)}>
              <span style={{fontSize:28}}>{q.icon}</span>
              <div>
                <div style={{fontWeight:600, fontSize:14, color:'var(--text)'}}>{q.label}</div>
                <div style={{fontSize:12, color:'var(--text-3)', marginTop:2}}>{q.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, msg }) {
  return <div style={{textAlign:'center', padding:'24px', color:'var(--text-3)'}}>
    <div style={{fontSize:36, marginBottom:8}}>{icon}</div>
    <div style={{fontSize:14}}>{msg}</div>
  </div>
}

const S = {
  page: { maxWidth:1200, margin:'0 auto', padding:'24px' },
  hero: {
    background:'linear-gradient(135deg, #C0392B 0%, #922B21 60%, #7B241C 100%)',
    borderRadius:20, padding:'32px 40px', display:'flex', alignItems:'center',
    justifyContent:'space-between', marginBottom:28, overflow:'hidden', position:'relative'
  },
  heroContent: { flex:1, display:'flex', flexDirection:'column', gap:20 },
  heroH: { fontSize:28, fontWeight:800, color:'white', marginBottom:8 },
  heroP: { fontSize:15, color:'rgba(255,255,255,0.85)' },
  bg: { background:'rgba(255,255,255,0.25)', color:'white', padding:'2px 8px', borderRadius:6, fontWeight:700 },
  heroActions: { display:'flex', gap:12 },
  heroBtnP: { padding:'10px 20px', background:'white', color:'var(--red)', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' },
  heroBtnS: { padding:'10px 20px', background:'rgba(255,255,255,0.2)', color:'white', border:'2px solid rgba(255,255,255,0.5)', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer' },
  heroIll: { opacity:.9 },
  content: { display:'flex', flexDirection:'column', gap:24 },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
  statCard: { background:'white', borderRadius:12, padding:'20px', display:'flex', gap:16, alignItems:'center', boxShadow:'var(--shadow-sm)', transition:'box-shadow .2s, transform .15s' },
  statIcon: { width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 },
  statVal: { fontSize:24, fontWeight:800, color:'var(--text)' },
  statLabel: { fontSize:13, color:'var(--text-2)', fontWeight:500 },
  statSub: { fontSize:11, color:'var(--text-3)', marginTop:2 },
  cols: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 },
  panel: { background:'white', borderRadius:14, padding:'20px', boxShadow:'var(--shadow-sm)' },
  panelHead: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  panelTitle: { fontSize:15, fontWeight:700, color:'var(--text)' },
  viewAll: { background:'none', border:'none', color:'var(--red)', fontSize:13, fontWeight:600, cursor:'pointer' },
  reqRow: { display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' },
  donorRow: { display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' },
  bgBadge: { width:36, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 },
  reqName: { fontSize:14, fontWeight:600, color:'var(--text)' },
  reqSub: { fontSize:12, color:'var(--text-3)', marginTop:1 },
  donorAvatar: { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,var(--red-light),var(--red))', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 },
  donorName: { fontSize:14, fontWeight:600, color:'var(--text)' },
  dim: { color:'var(--text-3)', fontSize:14, padding:'16px 0' },
  quickGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 },
  qCard: { display:'flex', alignItems:'center', gap:14, padding:'16px', background:'white', border:'1px solid var(--border)', borderRadius:12, cursor:'pointer', textAlign:'left', transition:'box-shadow .2s, transform .15s', boxShadow:'var(--shadow-sm)' },
}
