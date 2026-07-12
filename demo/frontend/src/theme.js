import { createTheme } from '@mui/material/styles'

// GitHub-dark inspired palette, matching the repo's architecture diagrams
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0a0e14', paper: '#11161f' },
    primary: { main: '#58a6ff' },
    success: { main: '#3fb950' },
    warning: { main: '#f0883e' },
    text: { primary: '#e6edf3', secondary: '#8b949e' },
    divider: 'rgba(139, 148, 158, 0.16)',
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(139, 148, 158, 0.16)',
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: 12.5, backgroundColor: '#1c2330', border: '1px solid rgba(139,148,158,0.25)' },
      },
    },
  },
})

export default theme
