import * as WorkerLib from './worker.js'
import * as UtilLib from './util.js'
import * as RouterLib from './router.js'


const html = (s, ...args) => s?.map((ss, i) => `${ss}${args?.at(i) ?? ''}`)?.join('')

const LISTENER_SCRIPT = html`
    <script defer>
        (() => {
            const addListener = ({ srcElement, event, callbacks }) => {
                srcElement?.addEventListener(event, (e) => {
                    executeCallbacks({ e, srcElement, callbacks })
                })
            }

            const executeCallbacks = ({ e, srcElement, callbacks }) => {
                callbacks?.forEach((callback) => {
                    if (callback) callback({ e, srcElement })
                })
            }

            const getCallbackInModule = ({ customModule, event }) => {
                if (!customModule) return null
                if (customModule[event]) return customModule[event]
                const prev = Object.keys(customModule)?.find((key) => customModule[key][event])
                if (!prev) return null
                return customModule[prev][event]
            }

            const getSrcElement = ({ srcElement, event }) => {
                const attribute = 'on-' + event
                const hasActionStarter = srcElement?.hasAttribute(attribute)
                if (hasActionStarter) return srcElement

                const query = ':is(a, button, li)[' + attribute + ']'
                const closestButton = srcElement?.closest(query)
                if (closestButton) return closestButton

                return srcElement
            }

            const fetchListener = async ({ srcElement, event, e }) => {
                const starter = srcElement?.getAttribute('on-' + event)
                if (!starter) return

                if (starter && ['submit'].includes(event)) e.preventDefault()

                const helpers = await Promise.all(
                    starter?.split(',')?.map((helperName) => {
                        const toImport = '/' + helperName?.trim() + '.js'
                        return import(toImport)?.catch((err) => { })
                    })
                )

                const callbacks = helpers?.map((helper) => getCallbackInModule({ customModule: helper, event }))

                if (['load', 'click', 'submit'].includes(event)) executeCallbacks({ e, srcElement, callbacks })
                if (['invalid', 'click', 'submit'].includes(event)) addListener({ srcElement, event, callbacks })
                srcElement?.removeAttribute('on-' + event)
            }

            // load
            const configLoad = () => {
                const event = 'load'
                const srcElements = document?.querySelectorAll('[on-' + event + ']')

                srcElements?.forEach(async (srcElement) => {
                    fetchListener({ srcElement, event, e: null })
                })
            }

            // invalid
            const configInvalid = () => {
                const event = 'invalid'
                const srcElements = document?.querySelectorAll('[on-' + event + ']')

                srcElements?.forEach(async (srcElement) => {
                    fetchListener({ srcElement, event, e: null })
                })
            }

            // event-listeners
            const configEventListeners = () => {
                ['mouseover', 'click', 'submit']?.forEach((event) => document.body['on' + event] = async (e) => {
                    if (['mouseover', 'click'].includes(event)){
                        await addScripts()
                        configLoad()
                        configInvalid()
                        configObservers()
                    }

                    const srcElement = getSrcElement({ srcElement: e.srcElement, event })
                    fetchListener({ srcElement, event, e })
                })
            }

            // observers
            const configObservers = () => {
                const srcElements = [...document.querySelectorAll('[on-observe]')]
                
                const uniqueStarters = [...srcElements?.reduce((acc, srcElement) => {
                    const starters = srcElement?.getAttribute('on-observe')?.split(',')
                    starters?.forEach((starter) => acc?.set(starter, 1))
                    return acc
                }, new Map())?.keys()]

                uniqueStarters?.forEach(async (starter) => {
                    const starterElements = document.querySelectorAll('[on-observe*="' + starter + '"]')

                    const helper = await import('/' + starter?.trim() + '.js')?.catch((err) => { })
                    const callback = getCallbackInModule({ customModule: helper, event: 'observe' })
                    if (!callback) return

                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach((entry) => callback({ entry, observer }))
                    })

                    starterElements?.forEach((starterElement) => {
                        observer.observe(starterElement)

                        const observerAttr = starterElement?.getAttribute('on-observe')
                        const updatedObserverAttr = observerAttr?.replaceAll(starter + ', ', '')?.replaceAll(', ' + starter, '')?.replaceAll(starter, '')
                        
                        if (updatedObserverAttr === '') starterElement.removeAttribute('on-observe')
                        else starterElement.setAttribute('on-observe', updatedObserverAttr)
                    })
                })
            }

            const loadScript = ({ id, attrs, content }) => {
                const script = document?.createElement('script')

                Object.keys(attrs)?.forEach((attrKey) => script?.setAttribute(attrKey, attrs[attrKey]))
                script.id = id

                if (content) script?.insertAdjacentHTML('beforeend', content)

                return new Promise((resolve, reject) => {
                    if (!attrs.src) {
                        resolve()
                        document?.body?.insertAdjacentElement('beforeend', script)
                        return
                    }

                    script.onload = script.onreadystatechange = function () {
                        if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                            resolve()
                            script.onload = script.onreadystatechange = null
                        }
                    }

                    script.onerror = () => {
                        console.error('script failed to load')
                        reject(new Error('Failed to load script with src ' + script.src))
                    }

                    document?.body?.insertAdjacentElement('beforeend', script)
                })
            }

            const addScripts = () => {
                const scriptsToLoad = [...document.querySelectorAll('script[data-script-to-load]')]
                return Promise.all(
                    scriptsToLoad?.map((scriptToLoad) => {
                        const id = scriptToLoad?.getAttribute('data-script-to-load')
                        scriptToLoad.removeAttribute('data-script-to-load')

                        const attrs = scriptToLoad?.getAttributeNames()?.reduce((acc, attrName) => {
                            const attrValue = scriptToLoad.getAttribute(attrName)
                            if (attrValue !== 'text/script-to-load') acc[attrName] = attrValue
                            return acc
                        }, {})

                        const content = scriptToLoad?.textContent

                        scriptToLoad?.remove()

                        return loadScript({ id, attrs, content }).catch((err) => {
                            console.error(err)
                        })
                    })
                )
            }

            configEventListeners()

            window.onload = () => {
                setTimeout(() => {
                    document?.body?.click()
                }, 2_500)
            }
        })()
    </script>
`

const SW_REGISTER_SCRIPT = html`
    <script defer>
        (async () => {
            if (!navigator.serviceWorker) return

            navigator.serviceWorker.register('/sw.worker.js', { scope: '/', type: 'module' })

            let refreshing
            // check to see if there is a current active service worker
            const oldSw = (await navigator.serviceWorker.getRegistration())?.active?.state
            navigator.serviceWorker.addEventListener('controllerchange', async () => {
                if (refreshing) return
                // when the controllerchange event has fired, we get the new service worker
                const newSw = (await navigator.serviceWorker.getRegistration())?.active?.state
                
                // if there was already an old activated service worker, and a new activating service worker, do notify update
                if (oldSw === 'activated' && newSw === 'activating') {
                    refreshing = true
                    // notifyUpdate()
                    location.reload()
                }
            })
        })()
    </script> 
`

const stream = ({ lang, head, body, scripts, env }) => {
    const headers = new Headers()
    headers.append('Content-Type', 'text/html;charset=UTF-8')

    const callbacks = [
        () => html`
            <!DOCTYPE html>
            <html lang="${lang}">
            <head>
        `,
        head,
        () => html`
            </head>
            <body 
                data-scope="${UtilLib.getScope({ env })}" 
                data-env="${UtilLib.getEnv({ env })}" 
                data-region="${UtilLib.getRegion({ env })}"
            >
        `,
        body,
        () => html`
            ${LISTENER_SCRIPT}
            ${UtilLib.isDevEnv({ env }) ? '' : SW_REGISTER_SCRIPT}
        `,
        scripts ?? (() => ''),
        () => html`
            </body>
            </html>
        `
    ]

    return WorkerLib.stream({ callbacks, headers })
}

const awaitHtml = async ({ pending, success, error }) => {
    const id = Math.floor(Math.random()*1_000_000_000)

    const pendingId = `pending_${id}`
    const pendingRoutePathname = `/~/components/${pendingId}`

    const getRoute = async () => {
        const headers = {
            'Content-Type': 'text/html;charset=utf-8',
            'Transfer-Encoding': 'chunked',
        }
        
        const streamResult = WorkerLib.stream({ 
            callbacks: [
                async () => html`
                    ${
                        await success()
                            .then((template) => template)
                            .catch((err) => {
                                console.error(err?.stack)
                                return error ? error({ id, err }) : ''
                            })
                    }
                `
            ], 
            headers, 
        })

        RouterLib.removeRoute({ pathname: pendingRoutePathname })

        return streamResult
    }

    RouterLib.addRoute({
        pathname: pendingRoutePathname,
        route: { getRoute }
    })

    return html`
        ${await pending({ id: pendingId })}
        <script
            data-script-to-load="await-html_script-${id}" 
            type="text/script-to-load"
        >
            (async () => {
                const pendingEl = document?.querySelector('[data-await-pending-template="${pendingId}"]')
                const response = await fetch('${pendingRoutePathname}')
                const templateString = await response.text()
                pendingEl.outerHTML = templateString
            })()
        </script>
    `
}

export {
    html,
    stream,
    awaitHtml,
}