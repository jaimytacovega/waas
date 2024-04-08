import * as WorkerLib from './worker.js'


const getCachePrefix = ({ name, region } = {}) => `${name}${region ? `-${region}` : ''}-static` 
const getCacheName = ({ name, region, version }) => `${getCachePrefix({ name, region })}-${version}`

const cacheAssets = async ({ name, region, version }) => {
    try {
        const assetsResult = await WorkerLib.fetch({ url: '/dist.json' })
        const assetsJSON = assetsResult?.err ? {} : await assetsResult?.response?.json()

        const cacheName = getCacheName({ name, region, version })
        const cache = await caches.open(cacheName)

        return assetsJSON?.map(async (path) => {
            try {
                const url = path?.replace('dist/', '/')
                await cache.add(url)
            } catch (err) {
                console.log(`${err}`)
            }
        })

    } catch (err) {
        console.error(err)
    }
}

const installStaticAssets = async ({ name, region, version }) => {
    cacheAssets({ name, region, version })
}

const removePreviousCaches = async ({ name, region, version }) => {
    const cacheNames = await caches.keys()
    return Promise.all(
        cacheNames?.filter((cacheName) => {
            const startsWithPrefixRegion = cacheName?.startsWith(getCachePrefix({ name, region }))
            const startsWithPrefix = cacheName?.startsWith(getCachePrefix({ name }))
            const endsWithVersion = cacheName?.endsWith(version)
            const cacheToDelete = (startsWithPrefixRegion || startsWithPrefix) && !endsWithVersion
            return cacheToDelete
        })?.map((cacheName) => caches?.delete(cacheName))
    )
}

const serveFromCache = async ({ request, region, version }) => {
    try {
        const cacheName = getCacheName({ region, version })
        const cache = await caches.open(cacheName)
        const response = await cache.match(request, { ignoreSearch: true })
        return { response }
    } catch (err) {
        console.error(err)
        return { err }
    }
}

const cacheFirstThenNetwork = async ({ request, region, version }) => {
    const cacheResult = await serveFromCache({ request, region, version })
    if (cacheResult?.response) return cacheResult

    try {
        const fetchResult = await WorkerLib.fetch({ request })
        return fetchResult
    } catch (err) {
        return { err }
    }
}

export {
    getCachePrefix,
    getCacheName,
    installStaticAssets,
    removePreviousCaches,
    cacheFirstThenNetwork,
}