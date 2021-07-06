import Layout from '../../components/Layout'
import WebSocketResults from '../../components/WebSocketResults'
import React, { useEffect } from 'react'
import { GridList, GridListTile } from '@material-ui/core'
import { useRouter } from 'next/router'

export default function Test() {
  const router = useRouter()
  let { id } = router.query

  return <Layout>{id && <WebSocketResults id={id} />}</Layout>
}
