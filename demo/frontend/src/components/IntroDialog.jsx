import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, Stack, Typography,
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import MemoryIcon from '@mui/icons-material/Memory'
import SpeedIcon from '@mui/icons-material/Speed'
import VerifiedIcon from '@mui/icons-material/Verified'

function Point({ icon, title, children }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box sx={{ color: 'primary.main', mt: 0.3 }}>{icon}</Box>
      <Box>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="body2" color="text.secondary">{children}</Typography>
      </Box>
    </Stack>
  )
}

export default function IntroDialog({ open, onClose, onAbout }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { backgroundImage: 'none', border: '1px solid', borderColor: 'divider' } }}>
      <DialogContent sx={{ pt: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <GridViewRoundedIcon sx={{ fontSize: 34, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6">paged-kv-llama</Typography>
            <Typography variant="body2" color="text.secondary">
              vLLM&apos;s PagedAttention memory system, rebuilt from scratch in C++
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          When an LLM generates text it caches a Key/Value vector for every token it has seen.
          The naive approach reserves one giant buffer per conversation, sized for the <em>maximum</em>{' '}
          possible length — even for a ten-token reply. This project chops that cache into fixed-size{' '}
          <strong>pages</strong>, allocated on demand from a shared pool — the same trick your OS uses
          for virtual memory, and the same design as a database storage engine&apos;s slotted pages.
        </Typography>

        <Stack spacing={2} sx={{ mb: 1 }}>
          <Point icon={<VerifiedIcon fontSize="small" />} title="Same story, twice">
            Both panels run real C binaries with the same prompt and random seed — outputs are
            byte-identical, proving the paged rewrite changes memory layout, not results.
          </Point>
          <Point icon={<MemoryIcon fontSize="small" />} title="Watch the memory meters">
            The original engine&apos;s KV-cache is full-size before the first token. The paged
            engine&apos;s grows one 16-token page at a time — measured, not estimated.
          </Point>
          <Point icon={<SpeedIcon fontSize="small" />} title="Honest numbers">
            Paging saves memory, not time — per-token speed is the same class. The win is fitting
            many conversations into one fixed memory budget (see the repo benchmarks).
          </Point>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Chip label="C · C++17 · zero ML frameworks" size="small" variant="outlined" sx={{ mr: 'auto', color: 'text.secondary' }} />
        <Button onClick={onAbout} color="inherit">Read more</Button>
        <Button onClick={onClose} variant="contained" startIcon={<RocketLaunchIcon />}>
          Try the demo
        </Button>
      </DialogActions>
    </Dialog>
  )
}
