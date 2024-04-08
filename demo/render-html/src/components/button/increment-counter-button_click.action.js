const click = ({ e, srcElement }) => {
    e.preventDefault()

    const count = document?.querySelector('#count')
    if (!count) return

    count.textContent = parseInt(count.textContent) + 1
}

export{
    click,
}