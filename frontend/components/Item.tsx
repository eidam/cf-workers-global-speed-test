import React from 'react'

import { Box, Paper, Typography } from '@material-ui/core'
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow'
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline'

const Item = ({ region, redirected, location, latency, status, statusText }) => {
  return (
    <Paper variant="outlined">
      <Box padding={2} display="flex" flexDirection="row">
        <Box
          mx={2}
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Box width="250px">
            <Typography variant="subtitle1">{region}</Typography>
            <Typography color="textSecondary" variant="subtitle2">
              {location}
            </Typography>
          </Box>
          <Box>{redirected ? '.. at least one redirect ..' : '.. no redirects ..'}</Box>
          <Box width="200px" flexDirection="row" alignItems="center">
            <Typography variant="subtitle2" align="right">
              {status} - {statusText}
            </Typography>
            {status ? (
              <Typography align="right">{latency ? `${Math.round(latency)} ms` : ''}</Typography>
            ) : (
              <Typography align="right">
                <ErrorOutlineIcon />
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default Item
