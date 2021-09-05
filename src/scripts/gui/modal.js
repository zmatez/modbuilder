/**
 * Works in RENDERER
 */
class IModal{
    width = 350;//min width
    height = 250;//min height
    name;
    data;

    /**
     * @type {string[]}
     */
    responseEvents = [];

    constructor(name, data) {
        this.name = name;
        this.data = data;
    }

    open(){
        api.send('modal:open',{
            width: this.width,
            height: this.height,
            name: this.name,
            data: this.data
        })
    }

    /**
     * @param name {string} channel name - modals:action:<this>
     * @param action {function(data)} action
     */
    onResponse(name, action){

    }
}

module.exports.IModal = IModal;

/**
 * Works in MAIN
 */
class ModalController{
    /**
     * @type {{}}
     */
    static controllers = {};

    static ids = 0;

    /**
     * @type {{}}
     */
    actions = {};

    /**
     * @type {function[]}
     */
    closeEvents = [];

    /**
     * @type BrowserWindow
     */
    window;

    width;
    height;
    id;
    name;
    data;

    constructor(width, height, name, id, data) {
        this.width = width;
        this.height = height;
        this.id = id;
        this.name = name;
        this.data = data;
    }

    static start(){
        ipc.on("modal:open",(event, data) => {
            data['data']['id'] = ++this.ids;
            let controller = new ModalController(data['width'],data['height'],data['name'],data['data']['id'],data['data']);
            this.controllers[data['data']['id']] = controller;
            controller.open();

            this.ids++;
        })

        ipc.on("modal:close",(event, data) => {
            let id = data['id'];
            this.controllers[id].close();
            delete this.controllers[id]
        })

        ipc.on("modal:action",(event, data) => {
            let id = data['id'];
            let name = data['name'];
            this.controllers[id].trigger(name, data['data'])
        })

        //todo action sending to renderer
    }

    /**
     * @param name {string}
     * @param data {{}}
     * @param width {number}
     * @param height {number}
     * @return {ModalController}
     */
    static create(name, data, width = 350, height = 250){
        let dat = {
            id: this.ids++,
            data: data
        };
        let controller = new ModalController(width, height, name,dat['id'], dat);
        this.controllers[dat['id']] = controller;
        controller.open();

        this.ids++;

        return controller;
    }

    open(){
        let preload = path.join(__dirname, '../process/renderer/modals/modal_preload.js');
        this.window = new BrowserWindow({
            webPreferences: {
                preload: preload,
                nodeIntegration: true,
                contextIsolation: true, // protect against prototype pollution
                enableRemoteModule: false
            },
            icon: path.join(__dirname, '../../assets/icons/logo.png'),
            frame: false,
            width: this.width,
            height: this.height,
            resizable: false,
            alwaysOnTop: true,
            transparent: true,
            parent: mainWindow
        });

        this.window.center();
        this.window.loadFile('src/scripts/process/renderer/modals/modal.html');
        this.window.show()

        this.window.webContents.on('did-finish-load', () => {
            this.window.webContents.send('modal:render', {
                name: this.name,
                data: this.data
            })
        })
    }

    close(){
        this.window.getParentWindow().focus();
        this.window.close();
        for (let closeEvent of this.closeEvents) {
            closeEvent();
        }
    }

    /**
     * @param actionName {string}
     * @param data {{} | null}
     * @private
     */
    trigger(actionName, data){
        this.actions[actionName](data);
    }

    /**
     * @param name {string}
     * @param callback {function(*)}
     */
    onAction(name, callback){
        this.actions[name] = callback;
    }

    sendAction(name, data){
        this.window.webContents.send('modal:action',{
            id: this.id,
            name: name,
            data: data
        })
    }

    onClose(callback){
        this.closeEvents.push(callback);
    }
}

module.exports.ModalController = ModalController;

/**
 * Works in MODAL PRELOAD
 * @interface
 */
class ModalRenderer{
    static modals = {};

    name;

    constructor(name) {
        this.name = name;
    }

    static start(){
        this.registerModals();

        api.receive("modal:render",(data) => {
            this.modals[data['name']].open(document.body, data['data']);
        })
    }

    /**
     * @private
     */
    static registerModals(){
        //!-------------------------- register modals here -----------
        this.register(new InfoModal());
        this.register(new ActionModal());
        this.register(new ResourcesModal());
        this.register(new TextModal());
        //!-----------------------------------------------------------
    }

    /**
     * @param renderer {ModalRenderer}
     * @private
     */
    static register(renderer){
        this.modals[renderer.name] = renderer;
    }

    /**
     * @param parent {HTMLBodyElement}
     * @param data {{}}
     * @private
     */
    open(parent, data){
        let modal = document.createElement('div');
        modal.classList.add("modal");
        modal.classList.add("modal-show");

        utils.addChild(document.body, modal);

        this.draw(modal, data['id'], data['data']);
    }

    /**
     * @param parent {HTMLDivElement}
     * @param id {number}
     */
    close(parent, id){
        parent.classList.remove("modal-show");
        parent.classList.add("modal-hide");
        setTimeout(() => {
            api.send('modal:close', {'id': id});
        }, 250);
    }

    /**
     * @abstract
     * @param parent {HTMLDivElement}
     * @param id {number}
     * @param data {{}}
     */
    draw(parent, id, data){

    }

    /**
     * @param id {number}
     * @param name {string}
     * @param data {{} | null}
     */
    sendAction(id, name, data= null){
        api.send("modal:action",{
            id: id,
            name: name,
            data: data
        })
    }

    /**
     * @param id {number}
     * @param name {string}
     * @param callback {function({})}
     */
    onAction(id, name, callback){
        api.receive('modal:action', (data) => {
            if(data.id === id && data.name === name){
                callback(data.data);
            }
        })
    }
}

module.exports.ModalRenderer = ModalRenderer;

//#----------------------------------------------------------------------------------------------------------------------
//!----------------------------------------------------------------------------------------------------------------------
//#----------------------------------------------------------------------------------------------------------------------
class InfoModal extends ModalRenderer{
    constructor() {
        super("info");
    }

    draw(parent, id, data) {
        let icon = document.createElement('img');
        icon.classList.add("modal-icon");
        icon.src = "../../../assets/icons/" + data['icon'];
        utils.addChild(parent, icon);

        let title = document.createElement('div');
        title.classList.add("modal-title");

        let titleText = document.createElement('h3');
        titleText.innerHTML = data['title'];
        utils.addChild(title, titleText);

        let titleData = document.createElement('div');
        titleData.classList.add("text");
        titleData.innerHTML = data['text'];
        utils.addChild(title, titleData);

        utils.addChild(parent, title);

        //--------
        let buttons = document.createElement('div');
        buttons.classList.add("modal-buttons");
        utils.addChild(parent, buttons);

        let okButton = new forms.Button("Okay",() => {
            this.close(parent, id);
        })
        okButton.addTo(buttons)
    }
}

class ActionModal extends ModalRenderer{
    constructor() {
        super("action");
    }

    draw(parent, id, data) {
        let icon = document.createElement('img');
        icon.classList.add("modal-icon");
        icon.src = "../../../../assets/icons/" + data['icon'];
        utils.addChild(parent, icon);

        let title = document.createElement('div');
        title.classList.add("modal-title");

        let titleText = document.createElement('h3');
        titleText.innerHTML = data['title'];
        utils.addChild(title, titleText);

        let titleData = document.createElement('div');
        titleData.classList.add("text");
        titleData.innerHTML = data['text'];
        utils.addChild(title, titleData);

        utils.addChild(parent, title);

        //--------
        let buttons = document.createElement('div');
        buttons.classList.add("modal-buttons");
        utils.addChild(parent, buttons);

        let okText = data['text1'];
        if(okText == null){
            okText = "Okay";
        }
        let okAction = data['action1'];

        let okButton = new forms.Button(okText, () => {
            if(okAction != null){
                this.sendAction(id, okAction)
            }
            this.close(parent, id);
        });

        let cancelText = data['text2'];
        if(cancelText == null){
            cancelText = "Cancel";
        }
        let cancelAction = data['action2'];

        let cancelButton = new forms.Button(cancelText, () => {
            if(cancelText != null){
                this.sendAction(id, cancelAction)
            }
            this.close(parent, id);
        });

        okButton.addTo(buttons);
        cancelButton.addTo(buttons);
    }
}
class ResourcesModal extends ModalRenderer{

    constructor() {
        super('resources');
    }

    /**
     * @param parent
     * @param id
     * @param data {Object.<string, ModResource>}
     */
    draw(parent, id, data) {
        parent.classList.add("modal-resources");

        let title = document.createElement('h1');
        title.classList.add('title');
        title.innerHTML = "Resources";

        let description = document.createElement('p');
        description.classList.add("description");
        description.innerHTML = "Import resources you want to use here. Search for folder 'resources' with 'assets' and 'data'";

        let list = document.createElement('div');
        list.classList.add("resource-list");

        this.drawList(list, id, data);
        this.onAction(id, 'update', (data) => {
            this.drawList(list, id, data);
        });

        let close = document.createElement('img');
        close.classList.add("close");
        close.src = utils.getIconModal('remove.svg');
        utils.onClick(close, () => {
            this.close(parent, id);
        })

        utils.addChild(parent, title, description, list, close);

        let button = new forms.Button('Import',() => {
            this.sendAction(id, 'import');
        });
        button.addTo(parent);
    }

    /**
     * @param list {HTMLDivElement}
     * @param id {number}
     * @param data {Object.<string, ModResource>}
     */
    drawList(list, id, data){
        utils.clear(list);
        for (let key in data) {
            this.drawResource(list, data[key], () => {
                this.sendAction(id, 'remove', key)
            });
        }
    }

    /**
     * @param list {HTMLDivElement}
     * @param resource {ModResource}
     * @param removeCallback {function}
     */
    drawResource(list, resource, removeCallback){
        let element = document.createElement('div');
        element.classList.add("resource");

        let title = document.createElement('h3');
        title.classList.add('title');
        title.innerHTML = resource.codename;

        let path = document.createElement('span');
        path.classList.add('path');
        path.innerHTML = resource.path;

        utils.addChild(element, title,path);

        let button = new forms.IconButton('Remove',utils.getIconModal('remove.svg'),() => {
            removeCallback();
        });
        button.realpath = true;
        button.addTo(element);

        if(!resource.valid){
            let invalid = document.createElement('img');
            invalid.classList.add("invalid");
            invalid.src = utils.getIconModal('error-mark.svg');
            utils.addChild(element, invalid);
        }

        utils.addChild(list, element);
        return element;
    }
}

class TextModal extends ModalRenderer{
    constructor() {
        super("text");
    }

    draw(parent, id, data) {
        let icon = document.createElement('img');
        icon.classList.add("modal-icon");
        icon.src = "../../../../assets/icons/" + data['icon'];
        utils.addChild(parent, icon);

        let title = document.createElement('div');
        title.classList.add("modal-title");

        let titleText = document.createElement('h3');
        titleText.innerHTML = data['title'];
        utils.addChild(title, titleText);

        let titleData = document.createElement('div');
        titleData.classList.add("text");
        titleData.innerHTML = data['text'];
        utils.addChild(title, titleData);

        utils.addChild(parent, title);

        //--------
        let form = new Form(parent);
        form.push();
        let input = new forms.FormField('input','');
        let value = data['value'];
        if(value != null){
            input.value = value;
        }
        form.addEntry(input);
        form.pop();

        //--------
        let buttons = document.createElement('div');
        buttons.classList.add("modal-buttons");
        utils.addChild(parent, buttons);

        let okText = data['text1'];
        if(okText == null){
            okText = "Submit";
        }
        let okAction = data['action1'];

        let okButton = new forms.Button(okText, () => {
            if(okAction != null){
                this.sendAction(id, okAction,input.getValue())
            }
            this.close(parent, id);
        });
        okButton.disabled = true;

        input.addChangeListener((f) => {
            okButton.setDisable(f.getValue() === "")
        })

        let cancelText = data['text2'];
        if(cancelText == null){
            cancelText = "Cancel";
        }
        let cancelAction = data['action2'];

        let cancelButton = new forms.Button(cancelText, () => {
            if(cancelText != null){
                this.sendAction(id, cancelAction)
            }
            this.close(parent, id);
        });//file:///E:/Programowanie/NodeJS%20Projects/modbuilder/src/scripts/process/assets/icons/create_folder.svg

        okButton.addTo(buttons);
        cancelButton.addTo(buttons);
    }
}