import {
  Box, Button, Chip, Paper, Slider, Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'

export default function PromptBar({
  prompt, setPrompt, steps, setSteps, seed, running, onGenerate, onStop, maxSteps,
}) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          fullWidth
          autoFocus
          label="Start a story"
          placeholder='e.g. "One day, a robot" then press Enter to race both engines'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onGenerate()
            }
          }}
          disabled={running}
          inputProps={{ maxLength: 300 }}
        />
        <Box sx={{ minWidth: 190, px: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Story length: {steps} tokens
          </Typography>
          <Slider
            size="small" value={steps} min={24} max={maxSteps} step={8}
            onChange={(_, v) => setSteps(v)} disabled={running}
          />
        </Box>
        {running ? (
          <Button variant="outlined" color="warning" size="large" startIcon={<StopCircleOutlinedIcon />} onClick={onStop} sx={{ whiteSpace: 'nowrap' }}>
            Stop
          </Button>
        ) : (
          <Button variant="contained" size="large" startIcon={<AutoAwesomeIcon />} onClick={onGenerate} sx={{ whiteSpace: 'nowrap' }}>
            Generate
          </Button>
        )}
      </Stack>
      {seed != null && (
        <Tooltip title="Both engines receive this exact seed, so their sampling decisions, and therefore their stories, are identical.">
          <Chip
            icon={<CasinoOutlinedIcon />}
            label={`seed ${seed}, shared by both engines`}
            size="small" variant="outlined"
            sx={{ mt: 1.5, color: 'text.secondary' }}
          />
        </Tooltip>
      )}
    </Paper>
  )
}
