import * as OfflineLib from '../../../offline.js'
import * as RouterLib from '../../../router.js'
import * as UtilLib from '../../../util.js'

import { forbiddenURLs, serverOnlyURLs } from './config.js'


addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        const { request } = e
        const url = new URL(request.url)
	    const { pathname, origin } = url

        const serverOnlyResult = await RouterLib.getServerOnlyResponse({ origin, request, serverOnlyURLs })
        if (serverOnlyResult?.response) return serverOnlyResult.response

        const pattern = RouterLib.findPatternFromURL({ url })

        const redirectResult = RouterLib.getRedirectResponse({ origin, pathname })
	    if (redirectResult?.response) return redirectResult.response

        const forbiddenResult = RouterLib.getForbiddenResponse({ origin, request, forbiddenURLs })
	    if (forbiddenResult?.response) return forbiddenResult.response
        
        const region = UtilLib.getRegion({ env })

        const pageCallback = RouterLib.getRoute({ pathname: pattern?.pathname })?.getRoute

        const pageResult = pageCallback ? await pageCallback({ request, pattern, region, env }) : null
        if (pageResult?.response){
            e.waitUntil(pageResult?.done)
            return pageResult.response
        }

        const cacheFirstThenNetworkResult = await OfflineLib.cacheFirstThenNetwork({ request, region: self?.SW_REGION, version: self?.SW_VERSION })
        if (cacheFirstThenNetworkResult?.response) return cacheFirstThenNetworkResult.response

        return new Response('Upss, something went wrong!', { status: 500 })
    })()) 
})

addEventListener('install', (e) => {
    e.waitUntil((async () => {
        console.log(`SW v.${self?.SW_VERSION} installing...`)

        await OfflineLib.installStaticAssets({ name: self?.SW_APP_NAME, region: self?.SW_REGION, version: self?.SW_VERSION })
        skipWaiting()
    
        console.log(`SW v.${self?.SW_VERSION} installed`)
    })())
})

addEventListener('activate', (e) => {
    e.waitUntil((async () => {
        console.log(`SW v.${self?.SW_VERSION} activating...`)

        await OfflineLib.removePreviousCaches({ name: self?.SW_APP_NAME, region: self?.SW_REGION, version: self?.SW_VERSION })
        await clients.claim()

        console.log(`SW v.${self?.SW_VERSION} activated`)
    })())
})

self.SW_VERSION = __BUILD_TIME__
self.SW_APP_NAME = __APP_NAME__

const env = { ENV: __ENV__, REGION: __REGION__, IS_SERVICE_WORKER: true }
