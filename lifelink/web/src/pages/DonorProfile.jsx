import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { donors } from '../api'

const fmtBG = bg => bg ? bg.replace('+', '+ve').replace('-', '-ve') : bg
const BG_MAP = {'A+':'#EBF5FB','A-':'#D6EAF8','B+':'#FDEBD0','B-':'#FAD7A0','O+':'#FDEDEC','O-':'#FADBD8','AB+':'#E8DAEF','AB-':'#D7BDE2'}
const BG_TEXT= {'A+':'#1A5276','A-':'#154360','B+':'#784212','B-':'#6E2F1A','O+':'#7B241C','O-':'#641E16','AB+':'#4A235A','AB-':'#3B1A59'}

export default function DonorProfile() {
  const { id } = useParams()
  const nav = useNavigate()
  const [donor, setDonor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    donors.getById(id).then(res => setDonor(res.data)).catch(() => nav('/donors')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'80px 0'}}><div style={{width:40,height:40,border:'3px solid #eee',borderTopColor:'var(--red)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/></div>
  if (!donor) return null

  const bg = BG_MAP[donor.blood_group] || '#F3F4F6'
  const tx = BG_TEXT[donor.blood_group] || '#374151'

  return (
    <div style={S.page}>
      <button style={S.back} onClick={() => nav(-1)}>← Back to Search</button>
      <div style={S.card} className="fade-in">
        <div style={S.profileTop}>
          <div style={S.avatarBig}>{donor.name?.[0]?.toUpperCase() || '?'}</div>
          <div style={{...S.bgBig, background:bg, color:tx}}>{donor.blood_group}</div>
          <div style={{flex:1}}>
            <h1 style={S.name}>{donor.name || 'Anonymous'}</h1>
            <p style={S.loc}>📍 {donor.city}{donor.state ? `, ${donor.state}` : ''}{donor.distance ? ` · ${donor.distance}` : ''}</p>
            {donor.phone && <p style={{...S.loc, marginBottom:10}}>📞 {donor.phone}</p>}
            <div style={S.badges}>
              {donor.is_available && <span style={S.availBadge}>● Available to donate</span>}
              {donor.is_verified   && <span style={S.vBadge}>✓ Verified Donor</span>}
              {donor.badge         && <span style={S.trophyBadge}>🏆 {donor.badge}</span>}
            </div>
          </div>
        </div>
        <div style={S.stats}>
          {[
            ['💉', donor.total_donations || 0, 'Total Donations'],
            ['🩸', donor.blood_group || '—', 'Blood Group'],
            ['📅', donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : 'Never', 'Last Donated'],
          ].map(([icon, val, label]) => (
            <div key={label} style={S.statBox}>
              <span style={{fontSize:24}}>{icon}</span>
              <strong style={{fontSize:22, color:'var(--text)'}}>{val}</strong>
              <span style={{fontSize:12, color:'var(--text-3)'}}>{label}</span>
            </div>
          ))}
        </div>
        {donor.is_available && (
          <div style={S.actions}>
            <a href={`tel:${donor.phone || ''}`} style={S.callBtn}>📞 Call Donor</a>
            <a href={`https://wa.me/${donor.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi, I need ${fmtBG(donor.blood_group)} blood. Are you available to donate?`)}`} target="_blank" rel="noreferrer" style={S.waBtn}>💬 WhatsApp</a>
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
  page: { maxWidth:700, margin:'0 auto', padding:'24px' },
  back: { background:'none', border:'none', color:'var(--text-3)', fontSize:13, cursor:'pointer', marginBottom:16 },
  card: { background:'white', borderRadius:20, padding:'32px', boxShadow:'var(--shadow-lg)' },
  profileTop: { display:'flex', gap:20, alignItems:'flex-start', marginBottom:28 },
  avatarBig: { width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#C0392B,#7B241C)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, flexShrink:0 },
  bgBig: { width:52, height:52, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16, flexShrink:0, alignSelf:'center' },
  name: { fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:4 },
  loc: { fontSize:14, color:'var(--text-3)', marginBottom:10 },
  badges: { display:'flex', gap:8, flexWrap:'wrap' },
  availBadge: { padding:'4px 12px', background:'#DCFCE7', color:'#166534', borderRadius:20, fontSize:12, fontWeight:700 },
  vBadge: { padding:'4px 12px', background:'#DBEAFE', color:'#1E40AF', borderRadius:20, fontSize:12, fontWeight:700 },
  trophyBadge: { padding:'4px 12px', background:'#FEF9C3', color:'#854D0E', borderRadius:20, fontSize:12, fontWeight:700 },
  stats: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 },
  statBox: { background:'var(--bg)', borderRadius:12, padding:'16px', display:'flex', flexDirection:'column', alignItems:'center', gap:4, textAlign:'center' },
  actions: { display:'flex', gap:12 },
  callBtn: { flex:1, padding:'12px', background:'var(--red-pale)', color:'var(--red)', border:'2px solid #FECACA', borderRadius:10, fontWeight:700, fontSize:14, textDecoration:'none', textAlign:'center' },
  waBtn: { flex:1, padding:'12px', background:'#DCFCE7', color:'#166534', border:'2px solid #BBF7D0', borderRadius:10, fontWeight:700, fontSize:14, textDecoration:'none', textAlign:'center' },
}
