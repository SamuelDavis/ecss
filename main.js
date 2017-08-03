class Clock {
    constructor(timing, cb) {
        this._timing = timing;
        this._lag = this._timing;
        this._cb = cb;
        this._timeout = null;
    }

    static getTimestamp() {
        return window.performance
            ? window.performance.now()
            : new Date().getTime();
    }

    start() {
        if (!this._timeout) {
            this._tick();
        }
        return this;
    }

    stop() {
        if (this._timeout) {
            this._timeout = window.clearTimeout(this._timeout);
        }
        return this;
    }

    _tick(last = Clock.getTimestamp()) {
        const current = Clock.getTimestamp();
        this._lag += current - last - this._timing;
        const pacing = this._timing - Math.max(0, this._lag);
        this._cb();
        this._timeout = window.setTimeout(this._tick.bind(this, current), pacing);
    }
}

class Renderer {
    constructor(screen, speed = 16) {
        this.speed = speed;
        this._screen = screen;
    }

    draw(state) {
        this._screen.innerHTML = JSON.stringify(state, null, 2);
    }
}

function timeSystem(state) {
    return Object.assign({}, state, {now: Clock.getTimestamp()});
}

function eventSystem({events = []}) {
    const newEvents = eventBus.splice(0, eventBus.length);
    events = events
        .filter(oldEvent => !newEvents.reduce((found, {input, action, state}) => (
            found || oldEvent.input === input && oldEvent.action === action && oldEvent.state !== state
        ), false))
        .filter(({state}) => !(state === 'stop'))
        .concat(newEvents);
    return Object.assign({}, arguments[0], {events});
}

const defaultScene = [timeSystem, eventSystem];

class Game {
    constructor({speed = 8, scene = defaultScene} = {}) {
        this._state = {speed, scene};
    }

    update() {
        this._state = this._state.scene.reduce((state, system) => system(state), this._state);
    }

    getState() {
        return this._state;
    }
}

const eventBus = [];

class KeyBoardInput {
    constructor() {
        this.down = {};
        this.id = Clock.getTimestamp();
        window.addEventListener('keydown', ({keyCode}) => {
            if (!Boolean(this.down[keyCode])) {
                this.pressed(keyCode);
            }
            this.down[keyCode] = true;
        });
        window.addEventListener('keyup', ({keyCode}) => {
            if (Boolean(this.down[keyCode])) {
                this.released(keyCode);
            }
            this.down[keyCode] = false;
        });
    }

    pressed(keyCode) {
        eventBus.push({
            input: this.id,
            state: 'start',
            action: keyCode,
            timestamp: Clock.getTimestamp()
        });
    }

    released(keyCode) {
        eventBus.push({
            input: this.id,
            state: 'stop',
            action: keyCode,
            timestamp: Clock.getTimestamp()
        });
    }
}

const game = new Game();
const renderer = new Renderer(document.getElementById('display'));
const input = new KeyBoardInput();
const gameClock = new Clock(game.getState().speed, game.update.bind(game)).start();
const renderClock = new Clock(renderer.speed, () => renderer.draw(game.getState())).start();
