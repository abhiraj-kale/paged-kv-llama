import { useEffect, useState } from 'react'
import {
  Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Link, Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchReadme } from '../api'

const mdSx = {
  color: 'text.primary',
  '& h1, & h2, & h3': { fontWeight: 700, letterSpacing: '-0.01em', mt: 3, mb: 1 },
  '& h1': { fontSize: '1.7rem', borderBottom: '1px solid', borderColor: 'divider', pb: 1 },
  '& h2': { fontSize: '1.35rem', borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 },
  '& p, & li': { color: 'text.secondary', lineHeight: 1.7, fontSize: '0.95rem' },
  '& strong': { color: 'text.primary' },
  '& code': {
    fontFamily: '"JetBrains Mono", monospace', fontSize: '0.83em',
    background: 'rgba(110,118,129,0.18)', px: 0.6, py: 0.2, borderRadius: 1,
  },
  '& pre': {
    background: '#0d1117', border: '1px solid', borderColor: 'divider',
    borderRadius: 2, p: 2, overflow: 'auto',
  },
  '& pre code': { background: 'none', p: 0 },
  '& img': { maxWidth: '100%', borderRadius: 8, my: 1 },
  '& table': { borderCollapse: 'collapse', my: 2, display: 'block', overflowX: 'auto' },
  '& th, & td': { border: '1px solid', borderColor: 'divider', px: 1.5, py: 0.75, fontSize: '0.88rem' },
  '& th': { background: 'rgba(110,118,129,0.1)' },
  '& blockquote': {
    borderLeft: '3px solid', borderColor: 'primary.main', ml: 0, pl: 2,
    color: 'text.secondary',
  },
  '& hr': { border: 'none', borderTop: '1px solid', borderColor: 'divider', my: 3 },
}

export default function AboutDialog({ open, onClose, repoUrl }) {
  const [md, setMd] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open && md == null && error == null) {
      fetchReadme().then(setMd).catch((e) => setError(String(e.message || e)))
    }
  }, [open, md, error])

  const blobBase = `${repoUrl}/blob/master/`

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper"
      PaperProps={{ sx: { backgroundImage: 'none', border: '1px solid', borderColor: 'divider', height: '88vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography component="span" variant="h6">About - README.md</Typography>
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={onClose} aria-label="close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            Could not load README: {error}. Read it on{' '}
            <Link href={repoUrl} target="_blank" rel="noreferrer">GitHub</Link> instead.
          </Typography>
        )}
        {!md && !error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
        )}
        {md && (
          <Box sx={mdSx}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href = '', children }) => (
                  <Link
                    href={/^https?:/.test(href) ? href : blobBase + href.replace(/^\.\//, '')}
                    target="_blank" rel="noreferrer"
                  >
                    {children}
                  </Link>
                ),
                img: ({ src = '', alt }) => (
                  <img src={/^https?:/.test(src) ? src : '/' + src.replace(/^\.\//, '')} alt={alt || ''} />
                ),
              }}
            >
              {md}
            </ReactMarkdown>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
