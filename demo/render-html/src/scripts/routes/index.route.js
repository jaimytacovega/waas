import { html, stream } from '../../../../../html.js'


const getRoute = ({ request, region, env }) => {
    return stream({
        lang: 'es',
        head: () => html`
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>My Page | Index</title>
        `,
        body: () => html`
            <h1>Counter: <span id="count">0</span></h1>
            <button
                on-click="increment-counter-button_click.action"
            >Increment +1</button>
        `,
        scripts: () => html``,
        env,
    })
}

export {
    getRoute,
}