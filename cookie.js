const addCookie = ({ key, value, config }) => cookieStore?.set(key, value, config)
const removeCookie = ({ key }) => cookieStore?.delete({ name: key })
const getCookie = async ({ key }) => (await cookieStore?.get(key))?.value

export {
    addCookie,
    removeCookie,
    getCookie,
}
