global.MainController = require('./controller_main');
global.RendererController = require('./controller_renderer').RendererController;
global.RendererAdapter = require('./controller_renderer').RendererAdapter;

let glob = require('glob');
const path = require('path');
global.path = path;
/**
 * @type {MainController[]}
 */
let mainControllers = [];

let normalizedPath = path.join(__dirname, "../process/main/func/");
fs.readdirSync(normalizedPath).forEach(function(file) {
    mainControllers.push(require("./../process/main/func/" + file));
});

/**
 * @type {RendererAdapter[]}
 */
let rendererAdapters = [];

normalizedPath = path.join(__dirname, "../process/renderer/func/");
fs.readdirSync(normalizedPath).forEach(function(file) {
    let p = "./../process/renderer/func/" + file;
    let adapter = require(p).adapter;
    adapter.path = p;
    rendererAdapters.push(adapter);
});

class Controller{
    /**
     * @type Controller[]
     */
    static controllers = [];

    /**
     * @type {Controller, any}[]
     */
    static toOpen = [];
    /**
     * @type Controller[]
     */
    static toClose = [];

    /**
     * @type string
     */
    name;

    /**
     * @type {MainController}
     */
    mainController;
    /**
     * @type {RendererAdapter}
     */
    rendererAdapter;

    constructor(name) {
        this.name = name;
        for (let mc of mainControllers) {
            if(mc.getName() === name){
                this.mainController = mc;
                break;
            }
        }
        for (let rc of rendererAdapters) {
            if(rc.getName() === name){
                this.rendererAdapter = rc;
                break;
            }
        }

        if(this.mainController == null || this.rendererAdapter == null){
            throw new Error("Controller not found: " + name);
        }

        Controller.controllers.push(this);
    }

    /**
     * @param data {any | null}
     */
    open(data){
        this.mainController.open(data);
        Controller.toOpen.push({
            controller: this,
            data: data
        });
    }

    close(){
        this.mainController.close();
        Controller.toClose.push(this);
    }

    serialize(){
        return {
            'name': this.name,
            'path': this.rendererAdapter.path
        }
    }

    static byName(name){
        for (let controller of Controller.controllers) {
            if(controller.name === name){
                return controller;
            }
        }
        return null;
    }

    static pop(){
        ipc.on('request_adapters',(event, args) => {
            let adapters = [];
            for (let controller of Controller.controllers) {
                adapters.push(controller.serialize());
            }
            event.sender.send('adapters',adapters);
        });

        ipc.on('loaded',(event,args) => {
            LOG.debug("Sending info: " + Controller.toOpen.length + ":" + Controller.toClose.length)
            //open
            for (let controller of Controller.toOpen) {
                event.sender.send('controller_open',{
                    controller: controller.controller.serialize(),
                    data: controller.data
                });
            }
            Controller.toOpen = [];
            for (let controller of Controller.toClose) {
                event.sender.send('controller_close',controller.serialize());
            }
            Controller.toClose = [];
        })
    }
}

//-----------------------------------------------------------------
const cLoader = new Controller('loader');
const cIndex = new Controller('index');
const cImport = new Controller('import');
const cCreate = new Controller('create');
const cCreator = new Controller('creator');

Controller.pop();
//-----------------------------------------------------------------

module.exports = Controller;