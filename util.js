const Scope = {
    Cloudflare: 'cloudflare-worker',
    ServiceWorker: 'service-worker',
    Window: 'window',
}

const isWindow = () => typeof window === 'object'
// const isServiceWorker = ({ env }) => !env && typeof ServiceWorkerGlobalScope !== 'undefined'
const isServiceWorker = ({ env }) => env?.IS_SERVICE_WORKER
const isCloudflareWorker = ({ env }) => env?.IS_CLOUDFLARE_WORKER

const getScope = ({ env }) => {
    if (isCloudflareWorker({ env })) return Scope.Cloudflare
    if (isServiceWorker({ env })) return Scope.ServiceWorker
    if (isWindow()) return Scope.Window
}

// TODO: Redefine __ENV__
const getEnv = ({ env } = {}) => {
    if (isCloudflareWorker({ env })) return env.ENV
    // if (isServiceWorker({ env })) return __ENV__
    if (isServiceWorker({ env })) return env.ENV
    if (isWindow()) return document?.body?.getAttribute('data-env')
} 

// TODO: Redefine __REGION__
const getRegion = ({ env } = {}) => {
    if (isCloudflareWorker({ env })) return env.REGION
    // if (isServiceWorker({ env })) return __REGION__
    if (isServiceWorker({ env })) return env.REGION
    if (isWindow()) return document?.body?.getAttribute('data-region')
} 

const isDevEnv = ({ env }) => getEnv({ env }) === 'dev'
const isProdEnv = ({ env }) => getEnv({ env }) === 'prod'


export {
    getScope,
    getEnv,
    getRegion,
    isDevEnv,
    isProdEnv,
}