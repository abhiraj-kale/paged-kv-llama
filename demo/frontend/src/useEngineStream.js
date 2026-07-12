import { useCallback, useState } from 'react'
import { streamGenerate } from './api'

const initial = {
  status: 'idle', // idle | running | done | error
  text: '',
  tokens: 0,
  ms: null,
  firstMs: null, // time of first token — excludes model-load latency from tok/s
  tokPerS: null,
  kvBytes: 0,
  kvPages: 0,
  final: null, // done event payload (includes measured peak pages)
  error: null,
}

function applyEvent(state, ev) {
  switch (ev.type) {
    case 'start':
      return { ...state, status: 'running' }
    case 'token': {
      const firstMs = state.firstMs ?? ev.ms
      const decodeS = (ev.ms - firstMs) / 1000
      return {
        ...state,
        text: state.text + ev.text,
        tokens: ev.n,
        ms: ev.ms,
        firstMs,
        tokPerS: ev.n > 1 && decodeS > 0 ? (ev.n - 1) / decodeS : null,
        kvBytes: ev.kv_bytes,
        kvPages: ev.kv_pages,
      }
    }
    case 'done':
      return {
        ...state,
        status: 'done',
        tokens: ev.tokens,
        ms: ev.ms,
        tokPerS: ev.tok_per_s,
        kvBytes: ev.kv_bytes,
        kvPages: ev.pages_used,
        final: ev,
      }
    default:
      return state
  }
}

// Drives one engine panel: streams events into local state.
export default function useEngineStream(engine) {
  const [state, setState] = useState(initial)

  const start = useCallback(
    async ({ prompt, steps, seed, signal }) => {
      setState({ ...initial, status: 'running' })
      try {
        await streamGenerate({
          prompt,
          engine,
          steps,
          seed,
          signal,
          onEvent: (ev) => setState((s) => applyEvent(s, ev)),
        })
        // if the stream closed without a done event, still settle
        setState((s) => (s.status === 'running' ? { ...s, status: 'done' } : s))
      } catch (e) {
        if (e.name === 'AbortError') {
          setState((s) => ({ ...s, status: s.tokens > 0 ? 'done' : 'idle' }))
        } else {
          setState((s) => ({ ...s, status: 'error', error: String(e.message || e) }))
        }
      }
    },
    [engine],
  )

  const reset = useCallback(() => setState(initial), [])

  return [state, start, reset]
}
