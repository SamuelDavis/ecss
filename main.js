const eventBus = [];
const components = {};
const entities = {};

/** SYSTEMS */
function eventSystem(state) {
    const events = eventBus
        .splice(0, eventBus.length)
        .map(({keyCode, metaKey, shiftKey, altKey}) => ({keyCode, metaKey, shiftKey, altKey}));
    return Object.assign({}, state, {events: (state.events || []).concat(events)});
}

function inputSystem(state) {
    return Object.assign({}, state, {input: ((state.input || 0) + 1) % 1000});
}

function menuSystem(state) {
    const change = {menu: ((state.menu || 0) + 1) % 1000};
    if (change.menu >= 360) {
        change.scene = playScene,
            window.addEventListener('keydown', eventBus.push.bind(eventBus));
    }
    return Object.assign({}, state, change);
}

function renderSystem(state) {
    document.getElementById('display').innerHTML = JSON.stringify(state, null, 2);
    return Object.assign({}, state, {render: ((state.render || 0) + 1) % 1000});
}

function movementSystem(state) {
    return Object.assign({}, state, {movement: ((state.movement || 0) + 1) % 1000});
}

/** TIMING OPERATIONS */
function update(previous = new Date()) {
    const {updateSpeed} = game;
    const now = new Date();
    const delta = Math.min(updateSpeed, updateSpeed - (now.getUTCMilliseconds() - previous.getUTCMilliseconds()));
    game = game.scene.reduce((game, system) => Object.assign({}, game, system(game)), game);
    setTimeout(update.bind(update, now), delta);
}

function render(previous = new Date()) {
    const {renderSpeed} = game;
    const now = new Date();
    const delta = Math.min(renderSpeed, renderSpeed - (now.getUTCMilliseconds() - previous.getUTCMilliseconds()));
    game = Object.assign({}, renderSystem(game));
    setTimeout(render.bind(render, now), delta);
}

function flush(game, previous = new Date()) {
    const {updateSpeed} = game;
    const now = new Date();
    const delta = Math.min(updateSpeed, updateSpeed - (now.getUTCMilliseconds() - previous.getUTCMilliseconds()));
    const nextGameState = game.scene.reduce((game, system) => Object.assign({}, game, system(game)), game);
    setTimeout(flush.bind(flush, nextGameState, now), delta);
}

/** SCENES */
const menuScene = [menuSystem, inputSystem];
const playScene = [eventSystem, inputSystem, movementSystem];
const flushScene = [eventSystem, menuSystem, inputSystem, movementSystem, renderSystem];

/** MAIN */
let game = {
    updateSpeed: 8,
    renderSpeed: 16,
    scene: menuScene,
};

// update();
// render();
// flush(Object.assign({}, game, {scene: flushScene}));
