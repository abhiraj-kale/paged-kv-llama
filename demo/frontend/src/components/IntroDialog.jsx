import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, Link, Stack, Typography,
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import MemoryIcon from '@mui/icons-material/Memory'
import SpeedIcon from '@mui/icons-material/Speed'
import VerifiedIcon from '@mui/icons-material/Verified'
import StorageIcon from '@mui/icons-material/Storage'

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

export default function IntroDialog({ open, onClose, onAbout, profileUrl, peterDbUrl }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { backgroundImage: 'none', border: '1px solid', borderColor: 'divider' } }}>
      <DialogContent sx={{ pt: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <GridViewRoundedIcon sx={{ fontSize: 34, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6">paged-kv-llama</Typography>
            <Typography variant="body2" color="text.secondary">
              vLLM&apos;s PagedAttention memory system, rebuilt from scratch in C++ by{' '}
              <Link href={profileUrl} target="_blank" rel="noreferrer">Abhiraj Kale</Link>
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          When an LLM generates text it caches a Key/Value vector for every token it has seen.
          The naive approach reserves one giant buffer per conversation, sized for the <em>maximum</em>{' '}
          possible length — even for a ten-token reply. I rebuilt the fix production inference
          servers use: chop that cache into fixed-size <strong>pages</strong>, allocated on demand
          from a shared pool — no ML frameworks, no CUDA libraries, just C and C++ from first principles.
        </Typography>

        <Stack spacing={2} sx={{ mb: 1 }}>
          <Point icon={<StorageIcon fontSize="small" />} title="The design comes from my database engine">
            Before this, I built{' '}
            <Link href={peterDbUrl} target="_blank" rel="noreferrer">PeterDB</Link>
            {' '}— a disk-based storage engine in C++, also from scratch: slotted pages with offset
            directories, a persistent B+-tree index, and an iterator-based query engine. A paged
            KV-cache is the <em>same pattern</em> — fixed-size pages, a free list, an id&#8594;page
            directory — pointed at memory instead of disk.
          </Point>
          <Point icon={<VerifiedIcon fontSize="small" />} title="Same story, twice">
            Both panels run real C binaries I compiled from this repo, with the same prompt and
            random seed — outputs are byte-identical, proving my paged rewrite changes memory
            layout, not results.
          </Point>
          <Point icon={<MemoryIcon fontSize="small" />} title="Watch the memory meters">
            The original engine&apos;s KV-cache is full-size before the first token. Mine grows
            one 16-token page at a time — measured by the engine, not estimated.
          </Point>
          <Point icon={<SpeedIcon fontSize="small" />} title="Honest numbers">
            Paging saves memory, not time — per-token speed is the same class. The win is fitting
            many conversations into one fixed memory budget (benchmarks in the repo).
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
