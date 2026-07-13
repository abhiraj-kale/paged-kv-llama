import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, IconButton, Link, Stack, Typography,
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import MemoryIcon from '@mui/icons-material/Memory'
import SpeedIcon from '@mui/icons-material/Speed'
import VerifiedIcon from '@mui/icons-material/Verified'
import CloseIcon from '@mui/icons-material/Close'

function Line({ icon, children }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <Box sx={{ color: 'primary.main', mt: 0.2, display: 'flex' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary">{children}</Typography>
    </Stack>
  )
}

export default function IntroDialog({ open, onClose, onAbout, profileUrl, peterDbUrl }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { backgroundImage: 'none', border: '1px solid', borderColor: 'divider' } }}>
      <IconButton onClick={onClose} aria-label="close"
        sx={{ position: 'absolute', top: 10, right: 10, color: 'text.secondary' }}>
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ pt: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, pr: 4 }}>
          <GridViewRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6">paged-kv-llama</Typography>
            <Typography variant="body2" color="text.secondary">
              vLLM&apos;s PagedAttention, rebuilt from scratch in C++ by{' '}
              <Link href={profileUrl} target="_blank" rel="noreferrer">Abhiraj Kale</Link>
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          An LLM caches a Key/Value vector for every token it generates. The naive approach
          reserves one giant buffer per conversation, sized for the <em>maximum</em> possible
          length, even for a ten-token reply. I rebuilt the fix production inference servers use:
          fixed-size pages allocated on demand from a shared pool, no ML frameworks, no CUDA
          libraries, just C and C++. The design comes from{' '}
          <Link href={peterDbUrl} target="_blank" rel="noreferrer">my own database engine</Link>,
          built the same way from scratch: records on disk, paging, free lists, a B+-tree index.
        </Typography>

        <Stack spacing={1.25}>
          <Line icon={<VerifiedIcon fontSize="small" />}>
            Same seed, same prompt, byte-identical output on both sides.
          </Line>
          <Line icon={<MemoryIcon fontSize="small" />}>
            Memory meters are measured live by the engine, not estimated.
          </Line>
          <Line icon={<SpeedIcon fontSize="small" />}>
            Honest tradeoff: paging saves memory, not time.
          </Line>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Chip label="C · C++17 · zero ML frameworks" size="small" variant="outlined" sx={{ mr: 'auto', color: 'text.secondary' }} />
        <Button onClick={onAbout} color="inherit">Read more</Button>
        <Button onClick={onClose} variant="contained" startIcon={<RocketLaunchIcon />}>
          Close and Try Demo
        </Button>
      </DialogActions>
    </Dialog>
  )
}
