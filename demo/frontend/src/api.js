// Streaming client for the demo backend's NDJSON /api/generate endpoint.

export async function fetchConfig() {
  const res = await fetch('/api/config')
  if (!res.ok) throw new Error(`config: HTTP ${res.status}`)
  return res.json()
}

export async function fetchReadme() {
  const res = await fetch('/api/readme')
  if (!res.ok) throw new Error(`readme: HTTP ${res.status}`)
  return res.text()
}

// POSTs a generation request and invokes onEvent for every NDJSON event
// ({type:"start"|"token"|"done", ...}). Resolves when the stream closes.
export async function streamGenerate({ prompt, engine, steps, seed, signal, onEvent }) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, engine, steps, seed }),
    signal,
  })
  if (!res.ok) throw new Error(`generate(${engine}): HTTP ${res.status} — ${await res.text()}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let nl
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      if (line) onEvent(JSON.parse(line))
    }
  }
}

export function fmtBytes(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}

export function fmtSeconds(ms) {
  if (ms == null) return '—'
  return `${(ms / 1000).toFixed(1)}s`
}
