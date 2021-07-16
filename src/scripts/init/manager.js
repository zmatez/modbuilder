const Controller = require('./controller.js');

//--------------------------------------------------------
// DEFAULT SCRIPTS
global.config = require('../mod/resource/config.js');
global.utils = require('../util/utils.js');

//--------------------------------------------------------

class AppManager{
    /**
     * Overridden windows are being removed from here!
     * @type AppWindow[]
     */
    windows = [];

    startLoader(){
        global.loaderWindow = new BrowserWindow({
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false, // is default value after Electron v5
                contextIsolation: true, // protect against prototype pollution
                enableRemoteModule: false
            },
            icon: path.join(__dirname, '../../assets/icons/logo.png'),
            frame: false,
        });
    }

    start(){
        global.mainWindow = new BrowserWindow({
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false, // is default value after Electron v5
                contextIsolation: true, // protect against prototype pollution
                enableRemoteModule: true
            },
            icon: path.join(__dirname, '../../assets/icons/logo.png')
        });
        //mainWindow.setMenu(null)

        mainWindow.on('close',(e) => {
            LOG.log("Exiting...");
            if(global.hasOwnProperty('cfg') && cfg.loaded){
                if(!cfg.saved){
                    LOG.log("Config needs to be saved.");
                    e.preventDefault();
                    cfg.save(() => {
                        app.quit()
                    })
                }else{
                    LOG.log("Config is saved.");
                }
            }else{
                LOG.log("Config is not even loaded yet.");
            }
            LOG.success("Dowidzenia")
        })
    }

    /**
     * After that do .open()
     * @param window {AppWindow}
     * @return AppWindow
     */
    create(window){
        let rem = false;
        for (let i = 0; i < this.windows.length; i++) {
            let w = this.windows[i];
            if(w.id === window.window.id){
                this.windows[i] = window;
                rem = true;
            }
        }
        if(!rem){
            this.windows.push(window);
        }
        return window;
    }

}

class AppWindow{
    /**
     * @type {{Controller}}
     */
    static controllers = {};

    /**
     * @type BrowserWindow
     */
    window = global.mainWindow;

    /**
     * @type string
     */
    title;
    /**
     * @type string
     */
    path;

    /**
     * @type number | null
     */
    width;
    /**
     * @type number | null
     */
    height;
    /**
     * @type boolean
     */
    animate = false;

    /**
     * @type boolean | null
     */
    resizable = true;
    /**
     * @type boolean | null
     */
    alwaysOnTop;
    /**
     * @type boolean | null
     */
    maximized;

    /**
     * @type {function[]}
     */
    onLoad = [];


    /**
     * @param title {string}
     * @param path {string} Relative path from ./src/views
     */
    constructor(title,path) {
        this.title = title;
        this.path = path;
    }

    /**
     * @param name {string}
     * @param data {{} | null}
     * @return {AppWindow}
     */
    open(name, data = null){
        let controller = Controller.byName(name);
        if(AppWindow.controllers[this.window.id] != null){
            AppWindow.controllers[this.window.id].close();
        }
        AppWindow.controllers[this.window.id] = controller;

        LOG.debug("Open " + this.title + " with: " + this.width + "x" + this.height);

        if(this.width != null && this.height != null){
            this.window.setMinimumSize(this.width, this.height);
            this.window.setSize(this.width, this.height, this.animate);
        }
        if(this.resizable != null){
            this.window.setResizable(this.resizable)
        }
        if(this.alwaysOnTop != null){
            this.window.setAlwaysOnTop(this.alwaysOnTop)
        }
        if(this.maximized != null && this.maximized){
            this.window.maximize()
        }

        this.window.setTitle("ModBuilder | " + this.title);

        this.window.center();
        this.window.loadFile("src/views/" + this.path);

        controller.open(data);
        this.window.webContents.send("scripts", this.scripts);

        return this;
    }

    /**
     * @param name {string}
     * @param path {string} relative path from ./src/scripts/
     * @param serverPath {string} relative path from ./src/scripts/
     * @return {AppWindow}
     */
    withScript(name,path,serverPath){
        this.scripts[name] = {
            path: path,
            server_path: serverPath
        };
        return this;
    }

    /**
     * @param name {"width", "height", "animate", "resizable", "alwaysOnTop", "maximized"}
     * @param value {string | boolean | number}
     * @return {AppWindow}
     */
    withProp(name, value){
        this[name] = value;
        return this;
    }

    /**
     * @param event {function}
     * @return {AppWindow}
     */
    addLoadEvent(event){
        this.onLoad.push(event);
        return this;
    }

    /**
     * @return {string}
     */
    serialize(){
        return JSON.stringify({
            title: this.title,
            path: this.path,
            scripts: this.scripts,
            properties: {
                width: this.width,
                height: this.height,
                animate: this.animate,
                alwaysOnTop: this.alwaysOnTop,
                resizable: this.resizable
            }
        })
    }

    /**
     * @param json {string}
     * @return AppWindow
     */
    static deserialize(json){
        let win = new AppWindow(json['title'], json['path']);
        win.width = json['properties']['width'];
        win.height = json['properties']['height'];
        win.animate = json['properties']['animate'];
        win.alwaysOnTop = json['properties']['alwaysOnTop'];
        win.resizable = json['properties']['resizable'];
        win.scripts = json['scripts'];

        return win;
    }
}

exports.manager = new AppManager();
exports.AppWindow = AppWindow;