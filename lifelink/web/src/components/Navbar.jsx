import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const NAV = [
  { to:'/',         label:'🏠 Home'       },
  { to:'/donors',   label:'🔍 Find Donors' },
  { to:'/requests', label:'🩸 Requests'    },
]

export default function Navbar() {
  const loc = useLocation()
  const nav = useNavigate()
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()
  const [open, setOpen] = useState(false)

  const logout = () => { localStorage.clear(); nav('/login') }

  const getInitial = () => {
    if (user.name?.trim())  return user.name.trim()[0].toUpperCase()
    if (user.email?.trim()) return user.email.trim()[0].toUpperCase()
    if (user.phone?.trim()) return user.phone.replace(/^\+91/, '')[0] || 'U'
    return 'U'
  }

  const getDisplayName = () => user.name?.trim() || user.email?.trim() || user.phone || 'User'

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        <Link to="/" style={S.logo}>
          <span style={{fontSize:22}}>🩸</span>
          <span style={S.logoText}>LifeLink</span>
        </Link>

        <div style={S.links}>
          {NAV.map(n => (
            <Link key={n.to} to={n.to} style={{...S.link, ...(loc.pathname===n.to ? S.active : {})}}>
              {n.label}
            </Link>
          ))}
        </div>

        <div style={S.right}>
          <div style={{position:'relative'}}>
            <button style={S.avatar} onClick={() => setOpen(o => !o)}>
              {getInitial()}
            </button>
            {open && (
              <div style={S.dropdown}>
                <div style={S.ddUser}>
                  <strong>{getDisplayName()}</strong>
                  <span style={{fontSize:12, color:'var(--text-3)'}}>{user.phone || user.email}</span>
                </div>
                <hr style={{border:'none', borderTop:'1px solid var(--border)', margin:'4px 0'}} />
                <button style={S.ddItem} onClick={() => { nav('/'); setOpen(false) }}>🏠 Dashboard</button>
                <button style={S.ddItem} onClick={() => { nav('/profile'); setOpen(false) }}>👤 Edit Profile</button>
                <button style={S.ddItem} onClick={() => { nav('/requests/new');  setOpen(false) }}>🩸 Create Request</button>
                <button style={S.ddItem} onClick={() => { nav('/my-donations'); setOpen(false) }}>💉 My Donations</button>
                <hr style={{border:'none', borderTop:'1px solid var(--border)', margin:'4px 0'}} />
                <button style={{...S.ddItem, color:'var(--red)'}} onClick={logout}>🚪 Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

const S = {
  nav: {
    position:'fixed', top:0, left:0, right:0, zIndex:100,
    background:'rgba(255,255,255,0.95)', backdropFilter:'blur(10px)',
    borderBottom:'1px solid var(--border)', boxShadow:'0 2px 8px rgba(0,0,0,.04)'
  },
  inner: { maxWidth:1200, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', gap:32 },
  logo: { display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 },
  logoText: { fontSize:20, fontWeight:800, color:'var(--red)', letterSpacing:'-0.5px' },
  links: { display:'flex', gap:4, flex:1 },
  link: {
    padding:'6px 14px', borderRadius:8, fontSize:14, fontWeight:500,
    color:'var(--text-2)', textDecoration:'none', transition:'all .15s'
  },
  active: { background:'var(--red-pale)', color:'var(--red)', fontWeight:600 },
  right: { display:'flex', alignItems:'center', gap:12, marginLeft:'auto' },
  ctaBtn: {
    padding:'8px 16px', background:'var(--red)', color:'white', borderRadius:8,
    fontSize:13, fontWeight:600, textDecoration:'none', whiteSpace:'nowrap',
    boxShadow:'0 2px 8px rgba(192,57,43,.3)'
  },
  avatar: {
    width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,var(--red-light),var(--red))',
    color:'white', border:'none', fontSize:15, fontWeight:700, cursor:'pointer', display:'flex',
    alignItems:'center', justifyContent:'center'
  },
  dropdown: {
    position:'absolute', right:0, top:'calc(100% + 8px)', background:'white',
    border:'1px solid var(--border)', borderRadius:12, boxShadow:'var(--shadow-lg)',
    minWidth:200, padding:'8px', zIndex:200
  },
  ddUser: { padding:'8px 12px', display:'flex', flexDirection:'column', gap:2 },
  ddItem: {
    display:'block', width:'100%', padding:'8px 12px', background:'none', border:'none',
    borderRadius:8, fontSize:14, color:'var(--text)', cursor:'pointer', textAlign:'left',
    transition:'background .15s'
  },
}
