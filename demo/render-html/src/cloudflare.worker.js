import * as RouterLib from '../../../router.js'
import * as CloudflareLib from '../../../cloudflare.js'
import * as UtilLib from '../../../util.js'

import { forbiddenURLs } from './config.js'


const handleFetch = async ({ request, env, ctx }) => {
	const url = new URL(request.url)
	const { pathname } = url

	const pattern = RouterLib.findPatternFromURL({ url })
	const region = UtilLib.getRegion({ env })

	const redirectResult = RouterLib.getRedirectResponse({ pathname })
	if (redirectResult?.response) return redirectResult.response

	const forbiddenResult = RouterLib.getForbiddenResponse({ request, forbiddenURLs })
	if (forbiddenResult?.response) return forbiddenResult.response

	const pageCallback = RouterLib.getRoute({ pathname: pattern?.pathname })?.getRoute
	const pageResult = pageCallback ? await pageCallback({ request, pattern, region, env }) : null
	if (pageResult?.response) return pageResult.response

	const staticResult = await CloudflareLib.getStaticResponse({ request, waitUntil: ctx.waitUntil.bind(ctx), env })
	if (staticResult?.response) return staticResult?.response

	const notFoundResult = await RouterLib.getNotFoundResponse({ request })
	return notFoundResult?.response
}

export default {
	fetch: (request, env, ctx) => handleFetch({ request, env, ctx })
}