/**

 game_state == {};
 system == function(game_state) => game_state
 scene == [system]

 */

const eventBus = [];

function canWalk(entityState, gameState) {
    const change = {};
    gameState.events.forEach(event => {
        if (event.name === 'MOVE NORTH') {
            change.y = (entityState.y || 0) - 1
        }
        if (event.keyCode === 65) {
            change.x = (entityState.x || 0) - 1
        }
        if (event.keyCode === 83) {
            change.y = (entityState.y || 0) + 1
        }
        if (event.keyCode === 68) {
            change.x = (entityState.x || 0) + 1
        }
    });
    return Object.assign({}, entityState, change);
}

function canJump(entityState, gameState) {
    const change = {};
    gameState.events.forEach(event => {
        if (event.keyCode === 32) {
            change.z = (entityState.z || 0) + 1
        }
    });
    return Object.assign({}, entityState, change);
}

const fooEntity = [canWalk, canJump];

/** SYSTEMS */
function eventSystem(state) {
    const events = eventBus
        .splice(0, eventBus.length)
        .map(({keyCode, metaKey, shiftKey, altKey}) => ({keyCode, metaKey, shiftKey, altKey}));
    return Object.assign({}, state, {events});
}

function inputSystem(state) {
    return Object.assign({}, state, {input: ((state.input || 0) + 1) % 1000});
}

function menuSystem(state) {
    const change = {menu: ((state.menu || 0) + 1) % 1000};
    if (change.menu >= 360) {
        change.scene = playScene;
        window.addEventListener('keydown', eventBus.push.bind(eventBus));
    }
    return Object.assign({}, state, change);
}

function renderSystem(state) {
    document.getElementById('display').innerHTML = JSON.stringify(state, null, 2);
    return Object.assign({}, state, {render: ((state.render || 0) + 1) % 1000});
}

function movementSystem(state) {
    const entities = (state.entities || []).map(entity => {
        return [canWalk, canJump].reduce((entity, component) => entity.components.includes(component)
            ? component(entity, state)
            : entity, entity)
    });
    return Object.assign({}, state, {entities, movement: ((state.movement || 0) + 1) % 1000});
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

function run(game) {
    run(game.scene.reduce((game, system) => system(game)));
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
// const flushScene = [eventSystem, menuSystem, inputSystem, movementSystem, renderSystem];

/** MAIN */
let game = {
    updateSpeed: 8,
    renderSpeed: 16,
    scene: menuScene,
    entities: [{id: 'foo1', components: fooEntity}]
};

update();
render();
// flush(Object.assign({}, game, {scene: flushScene}));
