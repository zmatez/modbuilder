global.utils = require('../util/utils.js').utils;
global.dragAndDrop = require('../util/utils.js').dragAndDrop;
global.LOG = require('./logger.js').LOG;
global.ComponentUtils = require('../process/renderer/components/components.js').ComponentUtils;
const {Form, el} = require('../process/renderer/components/forms.js');
global.Form = Form;
global.forms = el;

const {IModal} = require('../gui/modal.js');
global.IModal = IModal;

const {IMod} = require('../mod/mod.js');
global.IMod = IMod;

const {tooltips} = require('../gui/tooltips');
global.tooltips = tooltips;

global.isMain = false;

const path = require('path');
global.path = path;


const {
    contextBridge,
    ipcRenderer,
    remote
} = require("electron");

global.remote = remote;

global.api = {
    send: (channel, data) => {
        // whitelist channels
        ipcRenderer.send(channel, data);
    },
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel, listener) => {
        if(listener != null) {
            ipcRenderer.removeListener(channel, listener)
        }
    }
}