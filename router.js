import * as WorkerLib from './worker.js'
import * as URLPatternLib from './urlpattern.js'


const router = new Map()

const getRouter = () => router
const getRoute = ({ pathname }) => router.get(pathname)
const addRoute = ({ pathname, route }) => router.set(pathname, route)
const removeRoute = ({ pathname }) => router.delete(pathname)

const findPatternFromURL = ({ url }) => {
    const patternPathname = [...new Set(getRouter()?.keys())]
        .find((patternPathname) => {
            const pattern = URLPatternLib.getURLPatern({ pathname: patternPathname })
            return pattern.test(url.href)
        })

    return patternPathname ? URLPatternLib.getURLPatern({ pathname: patternPathname }) : null
}

const getRedirectResponse = ({ origin, pathname }) => {
    if (origin !== self?.origin) return
    const isRedirectable = pathname !== '/' && pathname.endsWith('/')
    const response = isRedirectable ? Response.redirect(pathname.slice(0, -1), 301) : null
    return { response }
}

const getNotFoundResponse = async ({ request }) => {
    const pageCallback = getRouter()?.get('/404')?.getRoute
    const response = pageCallback ? (await pageCallback({ request }))?.response : new Response('404', { status: 404 })
    return { response }
}

const getForbiddenResponse = ({ origin, request, forbiddenURLs }) => {  
    if (origin !== self?.origin) return  
    const isForbidden = forbiddenURLs?.find((filename) => request?.url?.endsWith(filename))    
    if (!isForbidden) return
    return { response: new Response(`${request?.url} is forbidden`, { status: 503 }) }
}

const getServerOnlyResponse = ({ origin, request, serverOnlyURLs }) => {
    if (origin !== self?.origin) return
    const isServerOnly = serverOnlyURLs?.find((filename) => request?.url?.endsWith(filename))
    if (!isServerOnly) return
    return WorkerLib.fetch({ request })
}

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
}