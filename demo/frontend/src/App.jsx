import { useEffect, useRef, useState } from 'react'
import {
  Alert, AppBar, Box, Button, Chip, Container, IconButton, Link, Menu, MenuItem,
  ListItemIcon, ListItemText, Toolbar, Typography, Divider,
} from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import StorageIcon from '@mui/icons-material/Storage'

import { fetchConfig } from './api'
import useEngineStream from './useEngineStream'
import IntroDialog from './components/IntroDialog'
import AboutDialog from './components/AboutDialog'
import PromptBar from './components/PromptBar'
import EnginePanel from './components/EnginePanel'
import ComparisonStrip from './components/ComparisonStrip'

const REPO_URL = 'https://github.com/abhiraj-kale/paged-kv-llama'
const PETERDB_URL = 'https://github.com/abhiraj-kale/Database-Storage-Engine'
const PROFILE_URL = 'https://github.com/abhiraj-kale'
const UPSTREAM_URL = 'https://github.com/karpathy/llama2.c'
const PAPER_URL = 'https://arxiv.org/abs/2309.06180'

export default function App() {
  const [config, setConfig] = useState(null)
  const [configError, setConfigError] = useState(null)
  const [introOpen, setIntroOpen] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [ghAnchor, setGhAnchor] = useState(null)

  const [prompt, setPrompt] = useState('One day, a robot')
  const [steps, setSteps] = useState(80)
  const [seed, setSeed] = useState(null)
  const [running, setRunning] = useState(false)

  const abortRef = useRef(null)
  const [naive, startNaive] = useEngineStream('naive')
  const [paged, startPaged] = useEngineStream('paged')

  useEffect(() => {
    fetchConfig().then(setConfig).catch((e) => setConfigError(String(e.message || e)))
  }, [])

  const onGenerate = () => {
    const p = prompt.trim()
    if (!p || running) return
    const newSeed = 1 + Math.floor(Math.random() * 999999)
    setSeed(newSeed)
    setRunning(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const params = { prompt: p, steps, seed: newSeed, signal: ctrl.signal }
    // both engines race in parallel — same prompt, same seed
    Promise.allSettled([startNaive(params), startPaged(params)]).then(() => setRunning(false))
  }

  const onStop = () => abortRef.current?.abort()

  return (
    <Box sx={{ minHeight: '100vh', pb: 8, background: 'radial-gradient(1200px 500px at 50% -100px, rgba(31,111,235,0.13), transparent), #0a0e14' }}>
      <AppBar position="sticky" elevation={0}
        sx={{ background: 'rgba(10,14,20,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1 }}>
          <GridViewRoundedIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ letterSpacing: '-0.01em' }}>paged-kv-llama</Typography>
          <Chip size="small" label="PagedAttention, from scratch" variant="outlined"
            sx={{ ml: 1, display: { xs: 'none', sm: 'inline-flex' }, color: 'text.secondary' }} />
          <Box sx={{ flex: 1 }} />
          <Button color="inherit" startIcon={<InfoOutlinedIcon />} onClick={() => setAboutOpen(true)}>
            About
          </Button>
          <Button color="inherit" startIcon={<GitHubIcon />} onClick={(e) => setGhAnchor(e.currentTarget)}>
            GitHub
          </Button>
          <Menu anchorEl={ghAnchor} open={!!ghAnchor} onClose={() => setGhAnchor(null)}>
            <MenuItem component="a" href={REPO_URL} target="_blank" rel="noreferrer" onClick={() => setGhAnchor(null)}>
              <ListItemIcon><GitHubIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="This project" secondary="abhiraj-kale/paged-kv-llama" />
            </MenuItem>
            <MenuItem component="a" href={PETERDB_URL} target="_blank" rel="noreferrer" onClick={() => setGhAnchor(null)}>
              <ListItemIcon><StorageIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="PeterDB — my storage engine" secondary="where this design came from" />
            </MenuItem>
            <MenuItem component="a" href={UPSTREAM_URL} target="_blank" rel="noreferrer" onClick={() => setGhAnchor(null)}>
              <ListItemIcon><CallSplitIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Built on" secondary="karpathy/llama2.c" />
            </MenuItem>
            <Divider />
            <MenuItem component="a" href={PAPER_URL} target="_blank" rel="noreferrer" onClick={() => setGhAnchor(null)}>
              <ListItemIcon><SchoolOutlinedIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="PagedAttention paper" secondary="Kwon et al., vLLM (arXiv)" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 5 } }}>
        {configError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Backend unreachable ({configError}). Start it with{' '}
            <code>uvicorn main:app --port 8000</code> in <code>demo/backend</code>.
          </Alert>
        )}

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            One story. Two engines.{' '}
            <Box component="span" sx={{ color: 'success.main' }}>A fraction of the memory.</Box>
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 720, mx: 'auto' }}>
            Both panels run a real C inference engine on the same prompt with the same random seed —
            so they produce the <em>identical</em> story. The difference is how they manage the KV-cache:
            one reserves worst-case memory up front, the other pages it in on demand.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            A from-scratch systems project by{' '}
            <Link href={PROFILE_URL} target="_blank" rel="noreferrer">Abhiraj Kale</Link>
            {' '}— the paging design comes from{' '}
            <Link href={PETERDB_URL} target="_blank" rel="noreferrer">PeterDB</Link>,
            the C++ database storage engine I built before this.
          </Typography>
        </Box>

        <PromptBar
          prompt={prompt} setPrompt={setPrompt}
          steps={steps} setSteps={setSteps}
          seed={seed} running={running}
          onGenerate={onGenerate} onStop={onStop}
          maxSteps={config ? Math.min(300, config.seq_len) : 300}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
          <EnginePanel variant="naive" state={naive} config={config} steps={steps} />
          <EnginePanel variant="paged" state={paged} config={config} steps={steps} />
        </Box>

        <ComparisonStrip naive={naive} paged={paged} config={config} />

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Built from scratch by{' '}
            <Link href={PROFILE_URL} target="_blank" rel="noreferrer">Abhiraj Kale</Link>
            {' '}on{' '}
            <Link href={UPSTREAM_URL} target="_blank" rel="noreferrer">karpathy/llama2.c</Link>
            {' '}· PagedAttention (<Link href={PAPER_URL} target="_blank" rel="noreferrer">Kwon et al.</Link>)
            reimplemented in C++ · paging design from{' '}
            <Link href={PETERDB_URL} target="_blank" rel="noreferrer">PeterDB</Link>
            {' '}·{' '}
            <Link href={REPO_URL} target="_blank" rel="noreferrer">source & benchmarks</Link>
          </Typography>
          {config && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              model: {config.model_name} · {config.n_layers} layers · max context {config.seq_len} tokens ·
              page = {config.page_size} tokens ({Math.round(config.page_bytes_kv / 1024)} KiB K+V)
            </Typography>
          )}
        </Box>
      </Container>

      <IntroDialog open={introOpen} onClose={() => setIntroOpen(false)}
        onAbout={() => { setIntroOpen(false); setAboutOpen(true) }}
        profileUrl={PROFILE_URL} peterDbUrl={PETERDB_URL} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} repoUrl={REPO_URL} />
    </Box>
  )
}
