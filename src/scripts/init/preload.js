require('./global');


/**
 * All renderer controllers
 * @type {RendererController[]}
 */
let rendererControllers = [];

api.receive('adapters', (data) => {
    for (let adapter of data) {
        rendererControllers.push(require(adapter.path).controller);
    }
})

api.receive('controller_open', (data) => {
    for (let rendererController of rendererControllers) {
        if(data.controller.name === rendererController.getName()){
            rendererController.open(data.data);
            break;
        }
    }
})

api.receive('controller_close', (data) => {
    for (let rendererController of rendererControllers) {
        if(data.name === rendererController.getName()){
            rendererController.close();
            break;
        }
    }
})

window.addEventListener('DOMContentLoaded', () => {
    LOG.log("Created jquery")

    if(rendererControllers.length <= 0){
        api.send('request_adapters',"");
    }
    api.send('loaded',"");

    /*let titleBar = document.createElement('div');
    titleBar.classList.add('electron-titlebar');
    document.body.insertAdjacentElement('afterbegin',titleBar);
    require('electron-titlebar');
    */
});