import { ThemeProvider } from '@material-ui/core'
import React from 'react'
import { lightTheme, darkTheme } from './Theme'
import useDarkMode from 'use-dark-mode'

const Providers = ({ children }) => {
  const { value } = useDarkMode(false, { storageKey: null, onChange: null })
  const theme = value ? darkTheme : lightTheme

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const body = <ThemeProvider theme={theme}>{children}</ThemeProvider>

  // prevents ssr flash for mismatched dark mode
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{body}</div>
  }

  return body
}

export default Providers
