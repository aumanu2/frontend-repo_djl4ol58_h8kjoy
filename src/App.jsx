import { useEffect, useMemo, useRef, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-2`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md whitespace-pre-wrap ${
          isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}

function TaxQuickCalc({ onCalculated }) {
  const [income, setIncome] = useState('1200000')
  const [regime, setRegime] = useState('new')
  const [d80c, setD80c] = useState('150000')
  const [d80d, setD80d] = useState('0')
  const [other, setOther] = useState('0')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const canCalc = useMemo(() => {
    return income && Number(income) >= 0 && (regime === 'old' || regime === 'new')
  }, [income, regime])

  const calc = async () => {
    if (!canCalc) return
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/calc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annual_income: Number(income),
          regime,
          deductions_80c: Number(d80c || 0),
          deductions_80d: Number(d80d || 0),
          other_deductions: Number(other || 0),
        }),
      })
      const data = await res.json()
      setResult(data)
      onCalculated?.(data)
    } catch (e) {
      console.error(e)
      alert('Failed to calculate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur rounded-xl p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Quick Tax Estimate</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">Annual Income (₹)</label>
          <input value={income} onChange={e=>setIncome(e.target.value)} type="number" className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Regime</label>
          <select value={regime} onChange={e=>setRegime(e.target.value)} className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="new">New</option>
            <option value="old">Old</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">80C Deductions (old)</label>
          <input value={d80c} onChange={e=>setD80c(e.target.value)} type="number" className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-gray-600">80D Deductions (old)</label>
          <input value={d80d} onChange={e=>setD80d(e.target.value)} type="number" className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">Other Deductions (old)</label>
          <input value={other} onChange={e=>setOther(e.target.value)} type="number" className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2" />
        </div>
      </div>
      <button onClick={calc} disabled={!canCalc || loading} className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md">
        {loading ? 'Calculating…' : 'Calculate'}
      </button>
      {result && (
        <div className="mt-3 text-sm text-gray-800">
          <div>Taxable Income: ₹{result.taxable_income?.toLocaleString?.('en-IN')}</div>
          <div>Tax: ₹{result.tax?.toLocaleString?.('en-IN')}</div>
          <div>Cess (4%): ₹{result.cess?.toLocaleString?.('en-IN')}</div>
          <div className="font-semibold">Total Tax: ₹{result.total_tax?.toLocaleString?.('en-IN')}</div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome! I can answer questions on Indian income tax and compute quick estimates. Ask anything or use the calculator below.' },
  ])
  const [input, setInput] = useState('What are the new regime slab rates?')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      console.error(e)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not reach the server. Please check your connection and try again.' },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-semibold">India Tax Chatbot</div>
          <div className="text-xs text-gray-500">Demo – Informational only</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2 bg-white/60 backdrop-blur rounded-2xl p-4 shadow">
          <div className="h-[60vh] overflow-y-auto pr-2">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}
            <div ref={endRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question about Indian income tax…"
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e)=>{ if(e.key==='Enter') send() }}
            />
            <button onClick={send} disabled={sending} className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 disabled:opacity-50">
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </section>

        <aside className="md:col-span-1 space-y-4">
          <TaxQuickCalc onCalculated={(r)=>{
            setMessages(prev=>[...prev, {role:'assistant', content:`Your quick estimate under the ${r.regime.toUpperCase()} regime is Total Tax ₹${r.total_tax.toLocaleString('en-IN')}.`}])
          }} />

          <div className="bg-white/70 backdrop-blur rounded-xl p-4 text-sm text-gray-700">
            <div className="font-semibold mb-2">What can I ask?</div>
            <ul className="list-disc list-inside space-y-1">
              <li>New vs Old regime differences</li>
              <li>Basic slab rates and cess</li>
              <li>Common deductions like 80C and 80D</li>
              <li>Very rough tax estimates</li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className="text-center text-xs text-gray-500 py-6">
        For education only. Consult a professional for advice.
      </footer>
    </div>
  )
}

export default App
