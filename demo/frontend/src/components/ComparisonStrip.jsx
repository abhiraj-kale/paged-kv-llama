import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import VerifiedIcon from '@mui/icons-material/Verified'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import MemoryIcon from '@mui/icons-material/Memory'
import { fmtBytes } from '../api'

// Shown once both engines finish: correctness check + the memory verdict.
export default function ComparisonStrip({ naive, paged, config }) {
  if (naive.status !== 'done' || paged.status !== 'done' || !config) return null

  const identical = naive.text === paged.text && naive.text.length > 0
  const ratio = paged.kvBytes > 0 ? config.naive_bytes_kv / paged.kvBytes : null

  return (
    <Paper sx={{ mt: 2, p: 1.75, borderColor: identical ? 'success.main' : 'warning.main' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
          {identical
            ? <VerifiedIcon color="success" />
            : <ErrorOutlineIcon color="warning" />}
          <Box>
            <Typography variant="subtitle2">
              {identical
                ? 'Byte-identical output'
                : 'Outputs differ (unexpected, please file an issue)'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {identical
                ? 'Same seed, same story, token for token.'
                : 'The two engines should always produce the same text for the same seed.'}
            </Typography>
          </Box>
        </Stack>

        {ratio && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <MemoryIcon sx={{ color: 'success.main' }} />
            <Box>
              <Typography variant="subtitle2">
                {fmtBytes(paged.kvBytes)} vs {fmtBytes(config.naive_bytes_kv)}
                <Chip label={`×${ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)} less memory`} size="small" color="success"
                  sx={{ ml: 1, fontWeight: 700 }} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {paged.final?.peak_pages_measured ?? paged.kvPages} pages measured vs{' '}
                {config.naive_pages} reserved: this is what lets many chats share one pool
              </Typography>
            </Box>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
