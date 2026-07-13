import { useEffect, useRef, useState } from 'react'
import { Box, Chip, LinearProgress, Paper, Stack, Tooltip, Typography } from '@mui/material'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import { fmtBytes, fmtSeconds } from '../api'

const VARIANTS = {
  naive: {
    label: 'ORIGINAL',
    title: 'Flat KV-cache buffer',
    subtitle: 'one contiguous block, sized for max context, reserved before token #1',
    accent: '#f0883e',
    icon: <Inventory2OutlinedIcon fontSize="small" />,
    memLabel: 'KV-cache memory this conversation is holding',
  },
  paged: {
    label: 'THIS PROJECT',
    title: 'Paged KV-cache',
    subtitle: 'fixed-size pages allocated on demand from a shared pool',
    accent: '#3fb950',
    icon: <GridViewRoundedIcon fontSize="small" />,
    memLabel: 'KV-cache memory this conversation is holding',
  },
}

function Stat({ label, value }) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography variant="h6" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.05rem' }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  )
}

// transient floating annotations shown over the story while generating,
// e.g. "page 3 allocated (+512 KiB)" on the paged side
function useFloaters(variant, state, config) {
  const [floaters, setFloaters] = useState([])
  const prevPages = useRef(0)
  const prevStatus = useRef('idle')
  const idRef = useRef(0)

  const push = (text, warn) => {
    const id = ++idRef.current
    setFloaters((f) => [...f.slice(-3), { id, text, warn }])
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 2600)
  }

  useEffect(() => {
    if (variant === 'paged' && state.status === 'running'
        && state.kvPages > prevPages.current && config) {
      push(`page ${state.kvPages} allocated  +${fmtBytes(config.page_bytes_kv)}`)
    }
    prevPages.current = state.kvPages
  }, [state.kvPages, state.status, variant, config]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (variant === 'naive' && state.status === 'running'
        && prevStatus.current !== 'running' && config) {
      push(`${fmtBytes(config.naive_bytes_kv)} reserved before token #1`, true)
    }
    if (variant === 'paged' && state.status === 'done' && prevStatus.current === 'running' && config) {
      push(`done: ${state.kvPages} pages was all it needed`)
    }
    prevStatus.current = state.status
  }, [state.status, variant, config]) // eslint-disable-line react-hooks/exhaustive-deps

  return floaters
}

export default function EnginePanel({ variant, state, config, steps }) {
  const v = VARIANTS[variant]
  const running = state.status === 'running'
  const maxBytes = config?.naive_bytes_kv ?? 1
  const floaters = useFloaters(variant, state, config)

  // memory shown: naive = full reservation the moment it starts; paged = grows per page
  const memBytes = state.status === 'idle' ? 0 : (variant === 'naive' ? maxBytes : state.kvBytes)
  const memPct = Math.max(0.5, Math.min(100, (memBytes / maxBytes) * 100))
  const ratio = variant === 'paged' && state.kvBytes > 0 ? maxBytes / state.kvBytes : null

  return (
    <Paper sx={{ p: 2, borderTop: `3px solid ${v.accent}`, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ color: v.accent, display: 'flex' }}>{v.icon}</Box>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{v.title}</Typography>
            <Chip label={v.label} size="small"
              sx={{ height: 20, fontSize: 10.5, bgcolor: `${v.accent}22`, color: v.accent }} />
          </Stack>
          <Typography variant="caption" color="text.secondary">{v.subtitle}</Typography>
        </Box>
        {state.status === 'done' && <Chip label="done" size="small" color="success" variant="outlined" />}
        {state.status === 'error' && <Chip label="error" size="small" color="error" variant="outlined" />}
      </Stack>

      <LinearProgress
        variant="determinate"
        value={Math.min(100, (state.tokens / steps) * 100)}
        sx={{
          height: 3, borderRadius: 2, bgcolor: 'rgba(139,148,158,0.15)',
          '& .MuiLinearProgress-bar': { bgcolor: v.accent },
        }}
      />

      <Box sx={{ position: 'relative' }}>
        <Box sx={{
          minHeight: 110, maxHeight: 170, overflowY: 'auto',
          fontFamily: '"Lora", Georgia, serif', fontSize: '0.98rem', lineHeight: 1.6,
          color: 'text.primary', whiteSpace: 'pre-wrap', px: 0.5,
        }}>
          {state.status === 'idle' && (
            <Typography component="span" sx={{ color: 'text.secondary', fontStyle: 'italic', fontFamily: 'inherit' }}>
              The story will stream here, token by token...
            </Typography>
          )}
          {state.error && (
            <Typography component="span" color="error" sx={{ fontFamily: 'inherit' }}>{state.error}</Typography>
          )}
          {state.text}
          {running && (
            <Box component="span" sx={{
              display: 'inline-block', width: '0.55em', height: '1.1em',
              bgcolor: v.accent, ml: 0.3, verticalAlign: 'text-bottom',
              animation: 'blink 1s step-end infinite',
            }} />
          )}
        </Box>
        {/* floating allocation events */}
        <Stack spacing={0.5} sx={{ position: 'absolute', top: 6, right: 6, alignItems: 'flex-end', pointerEvents: 'none' }}>
          {floaters.map((f) => (
            <Chip key={f.id} size="small" label={f.text}
              sx={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, fontWeight: 600,
                bgcolor: f.warn ? '#f0883e2e' : '#3fb9502e',
                color: f.warn ? '#f0883e' : '#3fb950',
                border: '1px solid', borderColor: f.warn ? '#f0883e55' : '#3fb95055',
                backdropFilter: 'blur(4px)',
                animation: 'floatUp 2.6s ease-out forwards',
              }} />
          ))}
        </Stack>
      </Box>

      <Stack direction="row" divider={<Box sx={{ borderLeft: '1px solid', borderColor: 'divider' }} />}
        sx={{ py: 0.5, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stat label="tokens" value={state.tokens || '-'} />
        <Stat label="time" value={fmtSeconds(state.ms)} />
        <Stat label="tok/s" value={state.tokPerS ? state.tokPerS.toFixed(1) : '-'} />
      </Stack>

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.75 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{v.memLabel}</Typography>
          <Typography sx={{
            fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '1.15rem',
            color: state.status === 'idle' ? 'text.secondary' : v.accent,
          }}>
            {state.status === 'idle' ? 'waiting' : fmtBytes(memBytes)}
            {config && state.status !== 'idle' && (
              <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 400 }}>
                {'  '}{variant === 'naive' ? config.naive_pages : state.kvPages || 0} pages
              </Box>
            )}
          </Typography>
        </Stack>
        <Box sx={{ height: 14, borderRadius: 7, bgcolor: 'rgba(139,148,158,0.15)', overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', width: `${state.status === 'idle' ? 0 : memPct}%`,
            bgcolor: v.accent, borderRadius: 7,
            transition: 'width 300ms ease',
            boxShadow: state.status !== 'idle' ? `0 0 12px ${v.accent}88` : 'none',
          }} />
        </Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {variant === 'naive'
              ? `full bar = ${fmtBytes(maxBytes)} reserved up front`
              : 'same scale; grows only as the story needs'}
          </Typography>
          {ratio && ratio > 1.05 && (
            <Tooltip title="How many times smaller this sequence's measured KV-cache is than the naive worst-case reservation. A shared pool turns this directly into how many more conversations fit in the same memory.">
              <Chip label={`×${ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)} smaller`} size="small"
                sx={{ height: 22, fontSize: 12, bgcolor: '#3fb95022', color: '#3fb950', fontWeight: 700 }} />
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Paper>
  )
}
