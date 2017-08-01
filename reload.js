const fs = require('fs');
const mainFile = `${__dirname}/main.js`;
let mainScript = require(mainFile);

function loadScript() {
    if (mainScript.teardown instanceof Function) {
        mainScript.teardown();
    }
    delete require.cache[mainFile];
    mainScript = require(mainFile);
}

setInterval(function () {
    mainScript.tick();
}, 1000);

fs.watchFile(mainFile, loadScript);
