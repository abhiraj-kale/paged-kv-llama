import { Box, Paper, Stack, Typography } from '@mui/material'
import MemoryIcon from '@mui/icons-material/Memory'
import { fmtBytes } from '../api'

// The headline metric, big and live: how many times less memory the paged
// engine is holding right now compared to the original's fixed reservation.
export default function LiveSavingsBanner({ naive, paged, config }) {
  const active = paged.status !== 'idle' || naive.status !== 'idle'
  if (!active || !config) return null

  const haveNumber = paged.kvBytes > 0
  const ratio = haveNumber ? config.naive_bytes_kv / paged.kvBytes : null
  const ratioText = ratio ? `${ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)}×` : '…'

  return (
    <Paper sx={{
      mt: 2, px: 2.5, py: 1.25, textAlign: 'center',
      border: '1px solid', borderColor: 'rgba(63,185,80,0.45)',
      background: 'linear-gradient(180deg, rgba(63,185,80,0.10), rgba(63,185,80,0.02))',
    }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2.5 }}
        alignItems="center" justifyContent="center">
        <Stack direction="row" spacing={1.25} alignItems="center">
          <MemoryIcon sx={{ fontSize: 32, color: 'success.main' }} />
          <Typography key={ratioText} sx={{
            fontFamily: '"JetBrains Mono", monospace', fontWeight: 800,
            fontSize: { xs: '2.1rem', sm: '2.6rem' }, lineHeight: 1,
            color: 'success.main', animation: 'popIn 0.35s ease-out',
          }}>
            {ratioText}
          </Typography>
        </Stack>
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
            less memory used by the paged engine, live
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {haveNumber
              ? `${fmtBytes(paged.kvBytes)} in pages vs ${fmtBytes(config.naive_bytes_kv)} reserved up front`
              : 'measuring as the first tokens stream in...'}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}
