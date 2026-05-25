import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../api'

const BloodDropIllustration = () => (
  <svg viewBox="0 0 400 420" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:380}}>
    {/* Background circle */}
    <circle cx="200" cy="210" r="180" fill="rgba(255,255,255,0.08)" />
    {/* Main blood drop */}
    <path d="M200 60 C200 60 120 160 120 230 C120 274 156 310 200 310 C244 310 280 274 280 230 C280 160 200 60 200 60Z"
      fill="rgba(255,255,255,0.9)" />
    {/* Inner drop highlight */}
    <path d="M200 100 C200 100 148 178 148 228 C148 257 171 280 200 280 C229 280 252 257 252 228 C252 178 200 100 200 100Z"
      fill="#E74C3C" />
    {/* Plus cross inside */}
    <rect x="187" y="190" width="26" height="8" rx="4" fill="white" />
    <rect x="196" y="181" width="8" height="26" rx="4" fill="white" />

    {/* Floating mini drops */}
    <g className="drop-anim" style={{animationDelay:'0s'}}>
      <path d="M80 150 C80 150 68 166 68 174 C68 182 73 188 80 188 C87 188 92 182 92 174 C92 166 80 150 80 150Z"
        fill="rgba(255,255,255,0.6)" />
    </g>
    <g className="drop-anim" style={{animationDelay:'.8s'}}>
      <path d="M320 120 C320 120 308 136 308 144 C308 152 313 158 320 158 C327 158 332 152 332 144 C332 136 320 120 320 120Z"
        fill="rgba(255,255,255,0.5)" />
    </g>
    <g className="drop-anim" style={{animationDelay:'1.6s'}}>
      <path d="M340 280 C340 280 332 291 332 297 C332 303 335 308 340 308 C345 308 348 303 348 297 C348 291 340 280 340 280Z"
        fill="rgba(255,255,255,0.4)" />
    </g>

    {/* Heart at bottom */}
    <path d="M200 360 C200 360 160 335 160 315 C160 302 170 295 180 295 C188 295 195 300 200 307 C205 300 212 295 220 295 C230 295 240 302 240 315 C240 335 200 360 200 360Z"
      fill="rgba(255,255,255,0.85)" />

    {/* Decorative rings */}
    <circle cx="200" cy="210" r="155" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
    <circle cx="200" cy="210" r="135" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />

    {/* Stats text */}
    <text x="200" y="398" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="13" fontWeight="600" fontFamily="Inter,sans-serif">
      Every drop counts. Save a life today.
    </text>
  </svg>
)

const OTP_LENGTH = 6

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode]         = useState('otp')    // 'otp' | 'password'
  const [step, setStep]         = useState('phone')  // 'phone' | 'otp' | 'set-password'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [otp, setOtp]           = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [countdown, setCountdown] = useState(0)
  const [devOtp, setDevOtp]         = useState('')
  const [otpChannel, setOtpChannel] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const otpRefs = useRef([])

  const startCountdown = () => {
    setCountdown(300)
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    }, 1000)
  }

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const isPhone = v => /^\+?[0-9]{10,13}$/.test(v)
  const normalise = v => isEmail(v) ? v.trim().toLowerCase() : (v.startsWith('+') ? v : `+91${v}`)

  const handleSendOtp = async e => {
    e.preventDefault()
    setError('')
    if (!isEmail(identifier) && !isPhone(identifier)) {
      setError('Enter a valid phone number or email address'); return
    }
    setLoading(true)
    try {
      const res = await auth.sendOtp(normalise(identifier))
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp)
        setOtp(res.data.devOtp.split(''))
      }
      const msg = res.data?.message || ''
      if (msg.includes('SMS')) setOtpChannel('SMS')
      else if (msg.includes('email')) setOtpChannel('email')
      else setOtpChannel('')
      setStep('otp')
      startCountdown()
    } catch (err) {
      setError(err?.error?.message || 'Failed to send OTP. Try again.')
    } finally { setLoading(false) }
  }

  const handleOtpChange = (val, idx) => {
    if (!/^[0-9]?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next)
    if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus()
  }

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  const saveSession = (res, skipPasswordPrompt = false) => {
    localStorage.setItem('accessToken',  res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    if (!skipPasswordPrompt && res.data.has_password === false) {
      setStep('set-password')  // prompt first-time users to set a password
    } else {
      navigate('/')
    }
  }

  const handlePasswordLogin = async e => {
    e.preventDefault(); setError('')
    if (!isEmail(identifier) && !isPhone(identifier)) { setError('Enter a valid phone or email'); return }
    if (!password) { setError('Enter your password'); return }
    setLoading(true)
    try {
      const res = await auth.login(normalise(identifier), password)
      saveSession(res)
    } catch (err) {
      setError(err?.message || err?.error?.message || 'Invalid credentials.')
    } finally { setLoading(false) }
  }

  const handleSetPassword = async e => {
    e.preventDefault(); setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await auth.setPassword(password)
      navigate('/')
    } catch (err) {
      setError(err?.message || err?.error?.message || 'Failed to set password.')
    } finally { setLoading(false) }
  }

  const handleVerify = async e => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < OTP_LENGTH) { setError('Enter the complete 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      const res = await auth.verifyOtp(normalise(identifier), code)
      saveSession(res)
    } catch (err) {
      setError(err?.error?.message || 'Invalid OTP. Please try again.')
      setOtp(Array(OTP_LENGTH).fill(''))
      otpRefs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  return (
    <div style={S.page}>
      {/* Left Panel */}
      <div style={S.left}>
        <div style={S.logo}>
          <span style={S.logoIcon}>🩸</span>
          <span style={S.logoText}>LifeLink</span>
        </div>
        <BloodDropIllustration />
        <div style={S.tagline}>
          <h2 style={S.tagH}>Find Blood Donors Near You</h2>
          <p style={S.tagP}>Connecting patients with life-saving donors in real time. Every second matters.</p>
        </div>
        <div style={S.stats}>
          {[['10K+','Donors'],['500+','Requests Fulfilled'],['50+','Cities']].map(([n,l]) => (
            <div key={l} style={S.stat}>
              <span style={S.statN}>{n}</span>
              <span style={S.statL}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={S.right}>
        <div style={S.card} className="fade-in">
          {/* Mode tabs — only on first step */}
          {step === 'phone' && (
            <div style={S.modeTabs}>
              <button style={{...S.modeTab, ...(mode==='otp'      ? S.modeTabActive : {})}} onClick={() => { setMode('otp');      setError('') }}>📱 OTP Login</button>
              <button style={{...S.modeTab, ...(mode==='password' ? S.modeTabActive : {})}} onClick={() => { setMode('password'); setError('') }}>🔐 Password</button>
            </div>
          )}

          {/* ── PASSWORD MODE ───────────────────────────────────── */}
          {step === 'phone' && mode === 'password' && (
            <>
              <div style={S.cardTop}>
                <div style={S.avatar}>🔐</div>
                <h1 style={S.h1}>Sign In</h1>
                <p style={S.sub}>Enter your phone or email and password</p>
              </div>
              <form onSubmit={handlePasswordLogin} style={S.form}>
                <label style={S.label}>Phone Number or Email</label>
                <div style={S.inputWrap}>
                  <span style={S.prefix}>{isEmail(identifier) ? '✉️' : '📱'}</span>
                  <input style={S.input} type="text" placeholder="9876543210 or name@email.com"
                    value={identifier} onChange={e => setIdentifier(e.target.value)} autoFocus />
                </div>
                <label style={S.label}>Password</label>
                <div style={S.inputWrap}>
                  <span style={S.prefix}>🔑</span>
                  <input style={S.input} type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowPass(p => !p)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {error && <p style={S.err}>{error}</p>}
                <button style={S.btn} type="submit" disabled={loading}>
                  {loading ? <span style={S.spinner}/> : '🔐'}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <p style={{...S.terms, marginTop:8}}>
                  Don't have a password?{' '}
                  <button type="button" style={S.resendBtn} onClick={() => { setMode('otp'); setError('') }}>Login with OTP first</button>
                </p>
              </form>
            </>
          )}

          {/* ── OTP MODE ────────────────────────────────────────── */}
          {step === 'phone' && mode === 'otp' && (
            <>
              <div style={S.cardTop}>
                <div style={S.avatar}>🩸</div>
                <h1 style={S.h1}>Welcome to LifeLink</h1>
                <p style={S.sub}>Sign in with your mobile number or email</p>
              </div>
              <form onSubmit={handleSendOtp} style={S.form}>
                <label style={S.label}>Phone Number or Email</label>
                <div style={S.inputWrap}>
                  <span style={S.prefix}>{isEmail(identifier) ? '✉️' : '📱'}</span>
                  <input
                    style={S.input}
                    type="text"
                    placeholder="9876543210 or name@email.com"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    autoFocus
                  />
                </div>
                <p style={{fontSize:12,color:'var(--text-3)',marginTop:-6}}>
                  {isEmail(identifier)
                    ? '✅ OTP will be sent to this email'
                    : identifier.length >= 10 && isPhone(identifier)
                      ? '✅ OTP will be sent to your registered email'
                      : 'Enter your 10-digit mobile number or email address'}
                </p>
                {error && <p style={S.err}>{error}</p>}
                <button style={S.btn} type="submit" disabled={loading}>
                  {loading ? <span style={S.spinner} /> : null}
                  {loading ? 'Sending…' : 'Send OTP →'}
                </button>
              </form>
              <div style={S.divider}><span>or</span></div>
              <button style={S.gBtn} onClick={() => alert('Google Sign-In requires Firebase setup')}>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{marginRight:8}}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <p style={S.terms}>By continuing, you agree to our <a href="#" style={S.link}>Terms</a> and <a href="#" style={S.link}>Privacy Policy</a></p>
            </>
          )}

          {/* ── SET PASSWORD STEP ───────────────────────────────── */}
          {step === 'set-password' && (
            <>
              <div style={S.cardTop}>
                <div style={S.avatar}>🔐</div>
                <h1 style={S.h1}>Set Your Password</h1>
                <p style={S.sub}>Create a password for faster login next time</p>
              </div>
              <form onSubmit={handleSetPassword} style={S.form}>
                <label style={S.label}>New Password</label>
                <div style={S.inputWrap}>
                  <span style={S.prefix}>🔑</span>
                  <input style={S.input} type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)} autoFocus />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowPass(p => !p)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                <label style={S.label}>Confirm Password</label>
                <div style={S.inputWrap}>
                  <span style={S.prefix}>🔑</span>
                  <input style={S.input} type={showPass ? 'text' : 'password'} placeholder="Re-enter your password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                {error && <p style={S.err}>{error}</p>}
                <button style={S.btn} type="submit" disabled={loading}>
                  {loading ? <span style={S.spinner} /> : null}
                  {loading ? 'Saving…' : 'Set Password & Continue →'}
                </button>
                <button type="button"
                  style={{...S.resendBtn, padding:'10px 0', width:'100%', textAlign:'center'}}
                  onClick={() => navigate('/')}>
                  Skip for now
                </button>
              </form>
            </>
          )}

          {/* ── OTP VERIFY STEP ─────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <div style={S.cardTop}>
                <button onClick={() => { setStep('phone'); setError(''); setOtp(Array(OTP_LENGTH).fill('')); setDevOtp(''); setOtpChannel('') }} style={S.back}>← Back</button>
                <div style={S.avatar}>📱</div>
                <h1 style={S.h1}>Verify Your Number</h1>
                <p style={S.sub}>
                  {otpChannel === 'SMS'   && <>OTP sent via SMS to <strong>{identifier}</strong></>}
                  {otpChannel === 'email' && <>OTP sent to your <strong>registered email</strong></>}
                  {!otpChannel            && <>Enter the 6-digit code for <strong>{identifier}</strong></>}
                </p>
              </div>
              {devOtp && (
                <div style={S.devBanner}>
                  <span style={{fontSize:16}}>🛠️</span>
                  <div>
                    <div style={{fontWeight:700, fontSize:13}}>Dev Mode — OTP auto-filled</div>
                    <div style={{fontSize:12, marginTop:2}}>Your OTP is <strong style={{letterSpacing:3}}>{devOtp}</strong></div>
                  </div>
                </div>
              )}
              <form onSubmit={handleVerify} style={S.form}>
                <label style={S.label}>Enter OTP</label>
                <div style={S.otpRow}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      style={{...S.otpBox, ...(d ? S.otpFilled : {})}}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleOtpChange(e.target.value, i)}
                      onKeyDown={e => handleOtpKey(e, i)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                {error && <p style={S.err}>{error}</p>}
                <button style={S.btn} type="submit" disabled={loading}>
                  {loading ? <span style={S.spinner} /> : null}
                  {loading ? 'Verifying…' : 'Verify & Sign In ✓'}
                </button>
                <div style={S.resend}>
                  {countdown > 0
                    ? <span style={{color:'var(--text-3)'}}>Resend OTP in <strong style={{color:'var(--red)'}}>{fmt(countdown)}</strong></span>
                    : <button type="button" style={S.resendBtn} onClick={e => { startCountdown(); handleSendOtp(e) }}>Resend OTP</button>
                  }
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const S = {
  page: { display:'flex', minHeight:'100vh', background:'var(--bg)' },
  left: {
    flex:'0 0 45%', background:'linear-gradient(135deg, #C0392B 0%, #922B21 50%, #7B241C 100%)',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    padding:'48px 40px', gap:24, position:'relative', overflow:'hidden',
    '@media(max-width:768px)': { display:'none' }
  },
  logo: { display:'flex', alignItems:'center', gap:10, alignSelf:'flex-start' },
  logoIcon: { fontSize:28 },
  logoText: { fontSize:26, fontWeight:800, color:'white', letterSpacing:'-0.5px' },
  tagline: { textAlign:'center', maxWidth:320 },
  tagH: { fontSize:24, fontWeight:700, color:'white', marginBottom:10 },
  tagP: { fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.7 },
  stats: { display:'flex', gap:32, marginTop:8 },
  stat: { display:'flex', flexDirection:'column', alignItems:'center', gap:2 },
  statN: { fontSize:22, fontWeight:800, color:'white' },
  statL: { fontSize:11, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1 },
  right: {
    flex:1, display:'flex', alignItems:'center', justifyContent:'center',
    padding:'32px 24px', background:'var(--bg)'
  },
  card: {
    width:'100%', maxWidth:420, background:'var(--card)', borderRadius:var_radius_lg(),
    padding:'40px 36px', boxShadow:'0 20px 60px rgba(0,0,0,.1), 0 4px 16px rgba(0,0,0,.06)'
  },
  cardTop: { textAlign:'center', marginBottom:28 },
  avatar: { fontSize:40, marginBottom:12, display:'block' },
  h1: { fontSize:24, fontWeight:700, color:'var(--text)', marginBottom:6 },
  sub: { fontSize:14, color:'var(--text-3)', lineHeight:1.6 },
  form: { display:'flex', flexDirection:'column', gap:14 },
  label: { fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:2 },
  inputWrap: {
    display:'flex', alignItems:'center', border:'2px solid var(--border)',
    borderRadius:'var(--radius-sm)', overflow:'hidden', transition:'border .2s',
    ':focus-within': { borderColor:'var(--red)' }
  },
  prefix: { padding:'12px 14px', background:'#f8f9fa', fontSize:14, color:'var(--text-2)', borderRight:'1px solid var(--border)', whiteSpace:'nowrap' },
  input: {
    flex:1, padding:'12px 14px', border:'none', outline:'none', fontSize:15,
    color:'var(--text)', background:'transparent'
  },
  btn: {
    padding:'14px', background:'linear-gradient(135deg, var(--red-light), var(--red))',
    color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:15,
    fontWeight:700, letterSpacing:.3, boxShadow:'0 4px 14px rgba(192,57,43,.35)',
    transition:'transform .15s, box-shadow .15s', display:'flex', alignItems:'center',
    justifyContent:'center', gap:8, marginTop:6,
  },
  spinner: {
    display:'inline-block', width:16, height:16,
    border:'2px solid rgba(255,255,255,.4)', borderTopColor:'white',
    borderRadius:'50%', animation:'spin .7s linear infinite'
  },
  gBtn: {
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:'12px', border:'2px solid var(--border)', borderRadius:'var(--radius-sm)',
    background:'white', fontSize:14, fontWeight:500, color:'var(--text)',
    transition:'border-color .2s, background .2s', cursor:'pointer',
  },
  divider: {
    display:'flex', alignItems:'center', gap:12, color:'var(--text-3)', fontSize:13,
    margin:'4px 0',
    '& span': { padding:'0 8px', background:'var(--card)' },
    '&::before,&::after': { content:'""', flex:1, height:1, background:'var(--border)' }
  },
  err: { color:'#E74C3C', fontSize:13, background:'#fef2f2', padding:'8px 12px', borderRadius:6, borderLeft:'3px solid #E74C3C' },
  terms: { textAlign:'center', fontSize:12, color:'var(--text-3)', marginTop:4 },
  link: { color:'var(--red)', fontWeight:500 },
  otpRow: { display:'flex', gap:8, justifyContent:'center' },
  otpBox: {
    width:46, height:52, textAlign:'center', fontSize:22, fontWeight:700,
    border:'2px solid var(--border)', borderRadius:8, outline:'none',
    color:'var(--text)', transition:'border .2s, background .2s', background:'#fafafa'
  },
  otpFilled: { borderColor:'var(--red)', background:'var(--red-pale)', color:'var(--red-dark)' },
  resend: { textAlign:'center', fontSize:13, marginTop:4 },
  resendBtn: { background:'none', border:'none', color:'var(--red)', fontWeight:600, cursor:'pointer', fontSize:13 },
  back: { background:'none', border:'none', color:'var(--text-3)', fontSize:13, cursor:'pointer', marginBottom:8, display:'block' },
  devBanner: { display:'flex', gap:10, alignItems:'flex-start', background:'#FFFBEB', border:'2px solid #FCD34D', borderRadius:8, padding:'10px 14px', marginBottom:8, color:'#92400E' },
  modeTabs: { display:'flex', gap:4, background:'#F3F4F6', borderRadius:10, padding:4, marginBottom:20 },
  modeTab: { flex:1, padding:'9px', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', background:'none', color:'var(--text-2)', transition:'all .15s' },
  modeTabActive: { background:'white', color:'var(--red)', boxShadow:'0 1px 4px rgba(0,0,0,.12)' },
  eyeBtn: { background:'none', border:'none', cursor:'pointer', padding:'0 10px', fontSize:16, color:'var(--text-3)' },
}

function var_radius_lg() { return 20 }
