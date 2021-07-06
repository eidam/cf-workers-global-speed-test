import { GridList, GridListTile } from '@material-ui/core'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import useWebSocket, { ReadyState } from 'react-use-websocket'
import Item from './Item'

const WebSocketResults = ({ id }) => {
  const [results, setResults] = useState([])

  const [socketUrl, setSocketUrl] = useState(`wss://global-speed-test.eidam.dev/api/tests/${id}`)
  const messageHistory = useRef([])

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl)

  useEffect(() => {
    sendMessage('please give results')
  }, [id])

  messageHistory.current = useMemo(() => messageHistory.current.concat(lastMessage), [lastMessage])

  return (
    <GridList
      cellHeight="auto"
      cols={1}
      spacing={8}
      style={{ width: '100%', marginBottom: '1rem' }}
    >
      {messageHistory.current
        .filter(Boolean)
        .reverse()
        .map((rawMessage, idx) => {
          const message = JSON.parse(rawMessage.data)
          return message ? (
            <GridListTile key={idx} cols={1}>
              <Item
                region={message.region}
                location={message.location}
                status={message.status}
                statusText={message.statusText}
                latency={message.time}
                redirected={message.redirected}
              />
            </GridListTile>
          ) : null
        })}
    </GridList>
  )
}

export default WebSocketResults
