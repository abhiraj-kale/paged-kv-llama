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
    memLabel: 'KV-cache reserved up front',
  },
  paged: {
    label: 'THIS PROJECT',
    title: 'Paged KV-cache',
    subtitle: 'fixed-size pages allocated on demand from a shared pool',
    accent: '#3fb950',
    icon: <GridViewRoundedIcon fontSize="small" />,
    memLabel: 'KV-cache actually used (measured)',
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

export default function EnginePanel({ variant, state, config, steps }) {
  const v = VARIANTS[variant]
  const running = state.status === 'running'
  const maxBytes = config?.naive_bytes_kv ?? 1

  // memory shown: naive = full reservation the moment it starts; paged = grows per page
  const memBytes = state.status === 'idle' ? 0 : (variant === 'naive' ? maxBytes : state.kvBytes)
  const memPct = Math.max(0.5, Math.min(100, (memBytes / maxBytes) * 100))
  const ratio = variant === 'paged' && state.kvBytes > 0 ? maxBytes / state.kvBytes : null

  return (
    <Paper sx={{ p: 2.5, borderTop: `3px solid ${v.accent}`, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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

      <Box sx={{
        minHeight: 170, maxHeight: 260, overflowY: 'auto',
        fontFamily: '"Lora", Georgia, serif', fontSize: '1.02rem', lineHeight: 1.75,
        color: 'text.primary', whiteSpace: 'pre-wrap', px: 0.5,
      }}>
        {state.status === 'idle' && (
          <Typography component="span" sx={{ color: 'text.secondary', fontStyle: 'italic', fontFamily: 'inherit' }}>
            The story will stream here, token by token…
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

      <Stack direction="row" divider={<Box sx={{ borderLeft: '1px solid', borderColor: 'divider' }} />}
        sx={{ py: 1, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stat label="tokens" value={state.tokens || '—'} />
        <Stat label="time" value={fmtSeconds(state.ms)} />
        <Stat label="tok/s" value={state.tokPerS ? state.tokPerS.toFixed(1) : '—'} />
      </Stack>

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">{v.memLabel}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {ratio && ratio > 1.05 && (
              <Tooltip title="How many times smaller this sequence's measured KV-cache is than the naive worst-case reservation. A shared pool turns this directly into 'how many more conversations fit in the same memory'.">
                <Chip label={`×${ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)} less`} size="small"
                  sx={{ height: 20, fontSize: 11, bgcolor: '#3fb95022', color: '#3fb950', fontWeight: 700 }} />
              </Tooltip>
            )}
            <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: 'text.primary' }}>
              {state.status === 'idle' ? '—' : fmtBytes(memBytes)}
              {config && state.status !== 'idle' && (
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {' '}({variant === 'naive' ? config.naive_pages : state.kvPages || 0} pages)
                </Box>
              )}
            </Typography>
          </Stack>
        </Stack>
        <Box sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(139,148,158,0.15)', overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', width: `${state.status === 'idle' ? 0 : memPct}%`,
            bgcolor: v.accent, borderRadius: 5,
            transition: 'width 300ms ease',
          }} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {variant === 'naive'
            ? `scale: full bar = ${fmtBytes(maxBytes)} (max-context reservation)`
            : 'same scale as the left panel — watch it grow one page at a time'}
        </Typography>
      </Box>
    </Paper>
  )
}
