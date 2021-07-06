import * as React from 'react'
import Head from 'next/head'
import CssBaseline from '@material-ui/core/CssBaseline'
import { Typography } from '@material-ui/core'
import { Box, Button, GridList, GridListTile, Input, LinearProgress } from '@material-ui/core'
import Item from '../components/Item'
import WhatshotIcon from '@material-ui/icons/Whatshot'
import { useState } from 'react'
import { useRouter } from 'next/router'

interface IProps {
  title?: string
}

const Layout: React.FunctionComponent<IProps> = ({ children, title = '' }) => {
  const router = useRouter()
  let { id } = router.query
  const fullTitle = `Global Speed Test${title ? ` - ${title}` : ''}`
  const [testUrl, setTestUrl] = useState('')

  React.useEffect(() => {
    if (id) {
      fetch(`https://global-speed-test.eidam.dev/api/registry/${id}`)
        .then((res) => {
          return res.json()
        })
        .then((res) => {
          setTestUrl(res.url)
        })
    } else if (typeof id == null) {
      setTestUrl('https://eidam.dev')
    }
  }, [id])

  const handleNewTest = (id) => {
    // router.push(`/test/${id}`)
    // simple force of a new state
    location.href = `/test/${id}`
  }

  return (
    <React.Fragment>
      <CssBaseline />
      {/* @ts-ignore */}
      <Head>
        <title>{fullTitle}</title>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </Head>

      <div
        style={{
          background: `#E06D10`,
          marginBottom: `1.45rem`,
        }}
      >
        <div
          style={{
            margin: `0 auto`,
            maxWidth: 960,
            padding: `1.45rem 1.0875rem`,
          }}
        >
          <h1 style={{ margin: 0, color: 'white', textDecoration: 'none' }}>Global speed test</h1>
          <Typography variant="subtitle2" style={{ color: 'white' }}>
            Requests are proxied through all Cloud Run supported Google Cloud Platform regions.
          </Typography>
        </div>
      </div>
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
        }}
      >
        <div style={{ paddingBottom: '5rem' }}>
          <GridList
            cellHeight="auto"
            cols={1}
            spacing={8}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            <Box padding={2} display="flex" flexDirection="row" justifyContent="space-between">
              <Box width="100%">
                <Input
                  placeholder="https://eidam.dev"
                  value={testUrl}
                  onChange={(event) => setTestUrl(event.target.value)}
                  style={{ width: '100%', marginBottom: '1rem' }}
                />
              </Box>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ marginLeft: '10px' }}
                  startIcon={<WhatshotIcon />}
                  //disabled={isLoading}
                  onClick={() => {
                    fetch(
                      `https://global-speed-test.eidam.dev/api/tests?url=${encodeURIComponent(
                        testUrl,
                      )}`,
                      {
                        method: 'POST',
                      },
                    )
                      .then((res) => {
                        return res.json()
                      })
                      .then((res) => {
                        handleNewTest(res.id)
                      })
                  }}
                >
                  Trigger&nbsp;New&nbsp;Test&nbsp;
                </Button>
              </Box>
            </Box>
          </GridList>
          {children}
        </div>
      </div>
    </React.Fragment>
  )
}

export default Layout
