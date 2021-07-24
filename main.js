const {app, dialog, ipcMain, BrowserWindow} = require('electron');
global.app = app;
const fs = require('fs');
global.BrowserWindow = BrowserWindow;
global.fs = fs;
global.dialog = dialog;
global.ipc = ipcMain;

//app.disableHardwareAcceleration();

global.startTimeout = 100; //<------------------------------------------------------------------ CHANGE THIS IN PRODUCTION
includeAll();

const path = require('path');
global.path = path;

app.whenReady().then(() => {
    createMainWindow()
})

//---------------------------------------------

function createMainWindow() {
    manager.startLoader();

    let window = new AppWindow("Loading","loader.html")
        .withProp('resizable',false)
        .withProp('width',750)
        .withProp('height',500);
    window.window = loaderWindow;
    manager.create(window).open("loader");
}

function includeAll(){
    global.$ = require('jquery');
    global.utils = require('./src/scripts/util/utils.js').utils;
    const {LOG} = require('./src/scripts/init/logger.js');
    global.LOG = LOG;
    global.cfg = require('./src/scripts/mod/resource/config.js').config;
    const {manager, AppWindow} = require('./src/scripts/init/manager.js');
    global.manager = manager;
    global.AppWindow = AppWindow;
    const {Mod} = require('./src/scripts/mod/mod.js');
    global.Mod = Mod;
    global.fsutils = require("./src/scripts/util/fileutils");
    global.isMain = true;

    const {ModalController} = require('./src/scripts/gui/modal.js');
    global.ModalController = ModalController;
    ModalController.start();
}