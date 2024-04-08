import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import manifestJSON from '__STATIC_CONTENT_MANIFEST'

import * as UtilLib from './util.js'


const getStaticResponse = async ({ request, waitUntil, env }) => {
    try {
        const ASSET_MANIFEST = JSON.parse(manifestJSON)
        const response = await getAssetFromKV({
            request,
            waitUntil
        }, {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST,
        })

        
        if (UtilLib.isProdEnv({ env })) response.headers.set('Cache-Control', 'public, max-age=10')

        return { response }
    } catch (err) {
        return { err }
    }
}

export {
    getStaticResponse,
}