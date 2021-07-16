//---- RENDERER --------------------------------------------------------------------------------------------------------
let {RendererController, RendererAdapter} = require('../../../init/controller_renderer');

let rName = "index";

class Adapter extends RendererAdapter{
    getName() {
        return rName;
    }
}

class Controller extends RendererController{
    listenerDataMods;

    /**
     * @type ModsList
     */
    modsList;

    getName() {
        return rName;
    }

    onOpen(data) {
        this.modsList = new ModsList(utils.byClass('left-box'));

        let createButton = new MenuButton('add.svg',"Create mod", () => {
            api.send('open:create',"");
        });
        let importButton = new MenuButton('import.svg',"Import mod", () => {
            api.send('open:import',"");
        });
        let openButton = new MenuButton('launch.svg',"Open selected mod", () => {
            api.send("func:open",{
                'path': this.modsList.selected.path,
                'name': this.modsList.selected.name,
                'codename': this.modsList.selected.codename
            })
        });
        let openFolderButton = new MenuButton('source.svg',"Open selected mod's folder", () => {
            require('child_process').exec('start "" "' + this.modsList.selected.path + '"');
        });
        let removeButton = new MenuButton('remove.svg',"Remove selected mod", () => {
            api.send('func:remove', this.modsList.selected.path);
        });

        openButton.setDisabled(true)
        openFolderButton.setDisabled(true)
        removeButton.setDisabled(true)

        this.modsList.addSelectEvent((selected) => {
            LOG.log(selected)
            if(selected == null){
                openButton.setDisabled(true)
                openFolderButton.setDisabled(true)
                removeButton.setDisabled(true)
            }else{
                openButton.setDisabled(false)
                openFolderButton.setDisabled(false)
                removeButton.setDisabled(false)
            }
        })

        this.listenerDataMods = (data) => {
            this.modsList.load(data);
        }

        api.receive('data:mods', this.listenerDataMods);

        api.send('load:mods', "");
    }

    onClose() {
        api.removeListener('data:mods', this.listenerDataMods);
    }
}

module.exports.adapter = new Adapter();
module.exports.controller = new Controller();
//----------------------------------------------------------------------------------------------------------------------
class MenuButton{
    /**
     * @type string
     */
    icon;
    /**
     * @type string
     */
    text;
    /**
     * @type function
     */
    callback;

    /**
     * @type HTMLElement
     */
    button;

    disabled = false;

    /**
     * @param icon {string}
     * @param text {string}
     * @param callback {function}
     */
    constructor(icon, text, callback) {
        this.icon = utils.getIcon(icon);
        this.text = text;
        this.callback = callback;

        this.construct()
    }

    construct(){
        let menu = document.getElementsByClassName('button-bar')[0];

        let button = document.createElement('div');
        button.classList.add("menu-button");

        let icon = document.createElement('img');
        icon.src = this.icon;
        utils.addChild(button, icon);

        let text = document.createElement('span');
        text.innerHTML = this.text;
        utils.addChild(button, text);

        this.button = button;
        button.addEventListener('click', () => {
            if(!this.disabled){
                this.callback();
            }
        })

        utils.addChild(menu, button);
    }

    setDisabled(val){
        this.disabled = val;
        if(val){
            this.button.classList.add("disabled");
        }else{
            this.button.classList.remove("disabled");
        }
    }
}

class ModsList{
    /**
     * @type HTMLElement
     */
    parent;

    /**
     * @type {ModsListEntry | null}
     */
    selected = null;

    /**
     * @type {ModsListEntry[]}
     */
    entries = [];

    /**
     * @type {function(ModsListEntry)[]}
     */
    selectEvents = [];

    /**
     * @param parent {HTMLElement}
     */
    constructor(parent) {
        this.parent = parent;
        utils.clear(this.parent);

        let loader = document.createElement('div');
        loader.classList.add('mods-list-loader');
        loader.innerHTML = utils.getLoader(40,true,true);

        utils.addChild(this.parent, loader);
    }

    /**
     * @param data {{}}
     */
    load(data){
        utils.clear(this.parent);
        for (let key in data) {
            let value = data[key];

            let entry = new ModsListEntry(this, value['name'], value['codename'], value['path']);
            utils.addChild(this.parent, entry.element);
            this.entries.push(entry);
        }

        if(this.entries.length <= 0){
            let holder = document.createElement('div');
            holder.classList.add('mods-list-nothing');
            
            let img = document.createElement('img');
            img.src = utils.getIcon('empty.svg');
            
            let h3 = document.createElement('h3');
            h3.innerHTML = "No mods found";
            
            let p = document.createElement('p');
            p.innerHTML = "To start, import or create one!"
            
            utils.addChild(holder, img, h3, p);
            utils.addChild(this.parent, holder);
        }
    }

    /**
     * @param entry {ModsListEntry}
     */
    onSelect(entry){
        if(entry == null){
            if(this.selected != null){
                this.selected.element.classList.remove('selected');
            }
        }else{
            if(this.selected === entry){
                //deselect
                this.selected.element.classList.remove('selected');
                this.selected = null;
            }else{
                //select
                if(this.selected != null){
                    this.selected.element.classList.remove('selected');
                }
                this.selected = entry;
                this.selected.element.classList.add('selected');
            }
        }

        this.selectEvents.forEach((f) => {
            f(this.selected);
        })
    }

    /**
     * @param callback {function(ModsListEntry)}
     */
    addSelectEvent(callback){
        this.selectEvents.push(callback);
    }
}

class ModsListEntry{
    /**
     * @type ModsList
     */
    modsList;

    /**
     * @type string
     */
    name;
    /**
     * @type string
     */
    codename;
    /**
     * @type string
     */
    path;

    /**
     * @type HTMLDivElement
     */
    element;

    /**
     * @param modsList {ModsList}
     * @param name {string}
     * @param codename {string}
     * @param path {string}
     */
    constructor(modsList, name, codename, path) {
        this.modsList = modsList;
        this.name = name;
        this.codename = codename;
        this.path = path;

        this.construct();
    }

    construct(){
        this.element = document.createElement('div');
        this.element.classList.add("mods-list-entry");

        let title = document.createElement('div');
        title.classList.add("mods-list-title");
        title.innerHTML = this.name;

        let code = document.createElement('div');
        code.classList.add("mods-list-code");
        code.innerHTML = this.codename;

        utils.addChild(this.element, title, code);

        utils.onClick(this.element, () => {
            this.select();
        })
    }

    select(){
        this.modsList.onSelect(this);
    }
}