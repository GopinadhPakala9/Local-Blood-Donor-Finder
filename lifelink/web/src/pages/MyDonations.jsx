import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { donations, requests } from '../api'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const BG_MAP = {'A+':'#EBF5FB','A-':'#D6EAF8','B+':'#FDEBD0','B-':'#FAD7A0','O+':'#FDEDEC','O-':'#FADBD8','AB+':'#E8DAEF','AB-':'#D7BDE2'}
const BG_TEXT= {'A+':'#1A5276','A-':'#154360','B+':'#784212','B-':'#6E2F1A','O+':'#7B241C','O-':'#641E16','AB+':'#4A235A','AB-':'#3B1A59'}

function getBadge(count) {
  if (count >= 20) return '🌟 Hero'
  if (count >= 10) return '🥇 Gold'
  if (count >= 5)  return '🥈 Silver'
  if (count >= 1)  return '🥉 Bronze'
  return '🆕 New'
}

export default function MyDonations() {
  const nav = useNavigate()
  const [myDonations,  setMyDonations]  = useState([])
  const [fulfilledReqs, setFulfilledReqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      donations.mine().catch(() => ({})),
      requests.mine({ status: 'Fulfilled' }).catch(() => ({})),
    ]).then(([d, r]) => {
      setMyDonations(d?.data || d || [])
      setFulfilledReqs(r?.data?.requests || [])
    }).finally(() => setLoading(false))
  }, [])

  const totalDonated  = myDonations.reduce((s, d) => s + (d.units || 1), 0)
  const totalFulfilled = fulfilledReqs.length
  const livesSaved    = totalDonated + totalFulfilled

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>💉 My Donations</h1>
          <p style={S.sub}>Your blood donation history and impact</p>
        </div>
        <button style={S.backBtn} onClick={() => nav('/')}>← Back to Home</button>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        <div style={S.statBox}>
          <span style={{fontSize:32}}>💉</span>
          <strong style={S.statVal}>{myDonations.length}</strong>
          <span style={S.statLabel}>Times Donated</span>
        </div>
        <div style={S.statBox}>
          <span style={{fontSize:32}}>✅</span>
          <strong style={S.statVal}>{totalFulfilled}</strong>
          <span style={S.statLabel}>Requests Fulfilled</span>
        </div>
        <div style={S.statBox}>
          <span style={{fontSize:32}}>❤️</span>
          <strong style={S.statVal}>{livesSaved}</strong>
          <span style={S.statLabel}>Lives Saved</span>
        </div>
        <div style={S.statBox}>
          <span style={{fontSize:32}}>🏆</span>
          <strong style={S.statVal}>{getBadge(myDonations.length)}</strong>
          <span style={S.statLabel}>Donor Badge</span>
        </div>
      </div>

      {loading ? (
        <div style={S.loadWrap}><div style={S.loader}/></div>
      ) : (
        <>
          {/* Donations I Made (as a donor) */}
          <div style={S.section}>
            <h2 style={S.sectionTitle}>💉 Donations I Made</h2>
            {myDonations.length === 0 ? (
              <div style={S.emptySmall}>
                <p style={{color:'var(--text-3)', fontSize:14}}>No donations recorded yet. Click "I Donated" on a blood request to record one.</p>
                <button style={S.browseBtn} onClick={() => nav('/requests')}>Browse Blood Requests</button>
              </div>
            ) : (
              myDonations.map((d, i) => (
                <div key={d.id} style={S.card} className="fade-in">
                  <div style={S.cardNum}>#{myDonations.length - i}</div>
                  <div style={{fontSize:28, flexShrink:0}}>💉</div>
                  <div style={{flex:1}}>
                    <div style={S.cardTitle}>Blood Donation</div>
                    <div style={S.cardSub}>📅 {fmtDate(d.donated_on)}</div>
                    {d.blood_request_id && <div style={S.cardSub}>🔗 Linked to a blood request</div>}
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={S.units}>{d.units || 1} unit{(d.units||1)!==1?'s':''}</div>
                    <div style={{...S.badge, background:'#EDE9FE', color:'#6D28D9'}}>+100 pts</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Requests I Fulfilled (as a requester) */}
          <div style={S.section}>
            <h2 style={S.sectionTitle}>✅ Requests I Marked Fulfilled</h2>
            {fulfilledReqs.length === 0 ? (
              <div style={S.emptySmall}>
                <p style={{color:'var(--text-3)', fontSize:14}}>No fulfilled requests yet. When you mark one of your blood requests as fulfilled, it will appear here.</p>
              </div>
            ) : (
              fulfilledReqs.map(r => {
                const bgC = BG_MAP[r.blood_group] || '#F3F4F6'
                const txC = BG_TEXT[r.blood_group] || '#374151'
                return (
                  <div key={r.id} style={S.card} className="fade-in">
                    <div style={{...S.bgChip, background:bgC, color:txC}}>{r.blood_group}</div>
                    <div style={{flex:1}}>
                      <div style={S.cardTitle}>{r.patient_name}</div>
                      <div style={S.cardSub}>🏥 {r.hospital_name} · 📍 {r.city || 'N/A'}</div>
                      <div style={S.cardSub}>📅 Fulfilled on {fmtDate(r.updated_at)}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={S.units}>{r.units_required} unit{r.units_required!==1?'s':''}</div>
                      <div style={{...S.badge, background:'#DCFCE7', color:'#166534'}}>✅ Fulfilled</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}

const S = {
  page:        { maxWidth:900, margin:'0 auto', padding:'24px' },
  header:      { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 },
  h1:          { fontSize:26, fontWeight:800, color:'var(--text)' },
  sub:         { fontSize:14, color:'var(--text-3)', marginTop:4 },
  backBtn:     { background:'none', border:'2px solid var(--border)', color:'var(--text-2)', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 },
  statBox:     { background:'white', borderRadius:14, padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, boxShadow:'var(--shadow-sm)', textAlign:'center' },
  statVal:     { fontSize:24, fontWeight:800, color:'var(--text)' },
  statLabel:   { fontSize:12, color:'var(--text-3)', fontWeight:500 },
  section:     { background:'white', borderRadius:14, padding:'20px', boxShadow:'var(--shadow-sm)', marginBottom:20 },
  sectionTitle:{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:16 },
  card:        { display:'flex', alignItems:'center', gap:16, padding:'14px 0', borderBottom:'1px solid var(--border)' },
  cardNum:     { fontSize:12, color:'var(--text-3)', fontWeight:600, minWidth:24, textAlign:'center' },
  cardTitle:   { fontSize:14, fontWeight:700, color:'var(--text)' },
  cardSub:     { fontSize:12, color:'var(--text-3)', marginTop:2 },
  units:       { fontSize:14, fontWeight:700, color:'var(--red)' },
  badge:       { fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, marginTop:4, display:'inline-block' },
  bgChip:      { width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, flexShrink:0 },
  emptySmall:  { padding:'16px 0', display:'flex', flexDirection:'column', gap:10 },
  browseBtn:   { padding:'8px 20px', background:'var(--red)', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13, width:'fit-content' },
  loadWrap:    { display:'flex', justifyContent:'center', padding:'60px 0' },
  loader:      { width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--red)', borderRadius:'50%', animation:'spin .8s linear infinite' },
}
