export { getStaticResponse } from './cloudflare.js'
export { addCookie, removeCookie, getCookie } from './cookie.js'
export { addCookie, removeCookie, getCookie } from './cookie.js'
export { html, stream, awaitHtml } from './html.js'
export { getFromKV, putInKV, getKVResponse, getKV } from './kv.js'
export { getURLPatern } from './urlpattern.js'
export { stream, fetch } from './worker.js'

export {
    getCachePrefix,
    getCacheName,
    installStaticAssets,
    removePreviousCaches,
    cacheFirstThenNetwork,
} from './offline.js'

export {
    getRouter,
    getRoute,
    addRoute,
    removeRoute,

    findPatternFromURL,

    getRedirectResponse,
    getNotFoundResponse,
    getForbiddenResponse,
    getServerOnlyResponse,
} from './router.js'

export {
    getScope,
    getEnv,
    getRegion,
    isDevEnv,
    isProdEnv,
} from './util.js'