const fileOperators = require('../operation/file-operator');
const fsutils = require('../util/fileutils');

class AbstractFileExplorer{

    /**
     * @type ?string
     */
    parentPath;

    /**
     * @type ExplorerParent[]
     */
    childs = [];
    /**
     * @type ExplorerParent[]
     */
    allChilds = [];

    /**
     * Used if folder structure is "abstract", and folders are saved only to JSON (blockstates)
     * @type {boolean}
     */
    abstractExplorer = false;

    /**
     * @type FileOperator | FileOperatorRemote
     */
    fileOperator;

    /**
     * @return ExplorerParent
     * @param element {ExplorerParent}
     */
    addChild(element){
        this.childs.push(element);
        this.allChilds.push(element);
        element.parent = null;
        element.fileExplorer = this;
        return element;
    }
    /**
     * Add if you want to MOVE from ROOT to any other folder
     * @return ExplorerParent
     * @param element {ExplorerParent}
     */
    addChildSilent(element){
        this.childs.push(element);
        element.parent = null;
        element.fileExplorer = this;
        return element;
    }

    /**
     * @param element {ExplorerParent}
     */
    removeChild(element){
        const {utils} = require('./../util/utils.js');
        utils.removeFromArray(this.childs, element);
        utils.removeFromArray(this.allChilds, element);
    }
    /**
     * Remove if you want to MOVE from ROOT to any other folder
     * @param element {ExplorerParent}
     */
    removeChildSilent(element){
        const {utils} = require('./../util/utils.js');
        utils.removeFromArray(this.childs, element);
    }

    /**
     * @param callback {function(File | ExplorerParent, ?Folder)}
     * @param folder {?Folder}
     * @param withFolders {boolean}
     */
    iterate(callback, folder = null, withFolders = false){
        for (let child of this.childs) {
            if(child instanceof File || child.type === 'file'){
                callback(child, folder);
            }else{
                if(withFolders){
                    callback(child, folder);
                }
                setImmediate(() => {
                    this.iterate(callback, child, withFolders);
                })
            }
        }
    }

    /**
     * @param name {string}
     * @param path {?string}
     * @param parent {?Folder}
     * @return Folder
     */
    createFolder(name, path,parent = null){
        if(path == null && parent == null){
            path = this.parentPath + "/" + name;
        }
        if(path == null && parent == null){
            return null;
        }
        console.log("Folder pathx: " + (parent.path + "/" + name));
        let folder = new Folder(name, path == null ? parent.path + "/" + name : path);
        console.log("Folder path: " + folder.path);


        if(!this.abstractExplorer){
            this.fileOperator.create(folder.path,null,false, (data) => {
                if(data.success){
                    //success
                    if(parent != null){
                        parent.addChild(folder);
                    }else {
                        this.addChild(folder);
                    }
                }else{
                    //fail

                }
            });
        }else{
            if(parent != null){
                parent.addChild(folder);
            }else {
                this.addChild(folder);
            }
        }
        return folder;
    }

    /**
     * @return {{}}
     */
    serialize(){
        let childs = [];
        for (let child of this.childs) {
            childs.push(child.serialize());
        }
        return {
            abstractExplorer: this.abstractExplorer,
            childs: childs
        }
    }

    /**
     * Create folders that does not exist for current path
     * @param parent {string}
     * @param parentFolder {?Folder}
     * @param path {string} relative to parent
     * @param newFolderCallback {?function(string, string): Folder}
     * @return Folder
     */
    mkdirs(parent, parentFolder, path, newFolderCallback = null){
        let struct = parent;
        let pFolder = parentFolder;
        for (let string of path.split('/')) {
            struct += "/" + string;
            let folder = this.getFolder(struct);
            if(folder == null){
                if(newFolderCallback == null){
                    folder = new Folder(string, struct);
                }else{
                    folder = newFolderCallback(string, struct);
                }
                if(pFolder == null){
                    this.addChild(folder);
                }else{
                    pFolder.addChild(folder);
                }
            }

            pFolder = folder;
        }

        return pFolder;
    }

    /**
     * @param path
     * @return {?Folder}
     */
    getFolder(path){
        for (let allChild of this.allChilds) {
            if(allChild instanceof Folder && allChild.path === path){
                return allChild;
            }
        }
        return null;
    }

    /**
     * @param controller {RendererController}
     * @param data {{}}
     * @param parent {?HTMLElement}
     * @param callbacks {?{}}
     * @return {AbstractFileExplorer | FileExplorer}
     */
    static deserialize(controller, data, parent, callbacks){
        let explorer = null;
        if(parent == null || callbacks == null){
            explorer = new AbstractFileExplorer();
        }else{
            explorer = new FileExplorer(parent, callbacks);
        }
        if(controller != null) {
            explorer.fileOperator = new fileOperators.FileOperatorRemote(explorer, controller);
        }

        let childs = [];
        let allChilds = [];
        for (let child of data.childs){
            if(child.type === 'folder'){
                let folder = Folder.deserialize(child, explorer, allChilds);
                allChilds.push(folder);
                childs.push(folder);
            }else{
                let file = File.deserialize(child, explorer);
                allChilds.push(file)
                childs.push(file);
            }
        }

        if(parent == null){
            explorer.parentPath = data.parentPath;
            explorer.childs = childs;
            explorer.allChilds = allChilds;
            explorer.abstractExplorer = data.requireUnique;
            return explorer;
        }else{
            explorer.parentPath = data.parentPath;
            explorer.childs = childs;
            explorer.allChilds = allChilds;
            explorer.parent = parent;
            explorer.abstractExplorer = data.requireUnique;
            return explorer;
        }
    }
}

module.exports.AbstractFileExplorer = AbstractFileExplorer;

class FileExplorer extends AbstractFileExplorer{
    /**
     * @type HTMLElement
     */
    parent;

    /**
     * @type {{}}
     */
    callbacks;

    /**
     * @type {ExplorerParent[]}
     */
    searchMatches = [];

    /**
     * @type {ExplorerParent[]}
     */
    selected = [];

    controlClicked = false;
    shiftClicked = false;

    interval;

    /**
     * @param parent {HTMLElement}
     * @param callbacks {{}}
     */
    constructor(parent, callbacks) {
        super();
        this.parent = parent;
        this.callbacks = callbacks;
        this.parent.classList.add("file-explorer");
        this.parent.tabIndex = 0;

        document.body.addEventListener('keydown', (e) => {
            this.controlClicked = e.ctrlKey;
            this.shiftClicked = e.shiftKey;
        })
        document.body.addEventListener('keyup', (e) => {
            this.controlClicked = e.ctrlKey;
            this.shiftClicked = e.shiftKey;
        });

        this.createUpdater();
    }

    createUpdater(){
        let ms = 0;
        this.interval = setInterval(() => {
            if(document.activeElement === this.parent) {
                for (let allChild of this.allChilds) {
                    if (allChild instanceof OpenableFile) {
                        allChild.update(ms);
                    }
                }
            }
            ms += 100;
        }, 100);
    }

    render(){
        utils.clear(this.parent);
        this.sort();
        for (let child of this.childs) {
            utils.addChild(this.parent,child.render());
        }
    }

    renderAsync(callback){
        utils.clear(this.parent);
        this.sort();
        setTimeout(() => {
            let i = 0;
            for (let child of this.childs) {
                setTimeout(() => {
                    utils.addChild(this.parent,child.render());
                }, ++i);
            }
            setTimeout(() => {
                callback();
            }, ++i);
        }, 0)
    }

    addChild(element) {
        return super.addChild(element);
    }

    createFolder(name, path, parent = null, callback = null) {
        let folder = super.createFolder(name, path, parent);
        /*this.renderAsync(() => {
            utils.scrollToElement(this.parent, folder.element);
            this.onClick(folder, null);
            if(callback != null){
                callback()
            }
        });*/
        this.renderElement(folder);
        return folder;
    }

    /**
     * Render added element without re-rendering whole explorer
     * @param element {ExplorerParent}
     */
    renderElement(element){
        if(element.element != null){
            element.element.remove()
        }
        this.sort();
        let parent = element.parent == null ? this : element.parent;
        let index = parent.childs.indexOf(element);
        let beforeElement = index + 1 < parent.childs.length ? parent.childs[index+1] : null;
        if(parent === this) {
            if (beforeElement != null) {
                this.parent.insertBefore(element.render(), beforeElement.element);
            } else {
                this.parent.insertAdjacentElement('beforeend', element.render());
            }
        }else{
            if (beforeElement != null) {
                parent.folderContent.insertBefore(element.render(), beforeElement.element);
            } else {
                parent.folderContent.insertAdjacentElement('beforeend', element.render());
            }
        }
    }

    sort(){
        for (let child of this.childs) {
            if(child instanceof Folder){
                child.sort();
            }
        }

        /**
         * @type {function(ExplorerParent, ExplorerParent): number}
         */
        const sort = ((a, b) => {
            return a.order === b.order ? (a.getName() < b.getName() ? -1 : 1) : (a.order < b.order ? 1 : -1);
        })

        this.childs.sort(sort);
        this.allChilds.sort(sort);
    }

    search(text){
        /*let highlight = "<span class='search-highlight'>" + text + "</span>"
        for (let searchMatch of this.searchMatches) {
            searchMatch.render();
        }
        this.searchMatches = [];*/

        if(text == null || text === ""){
            //nothing here
        }else {
            let matching = [];
            for (let child of this.childs) {
                if (child.getName().includes(text)) {
                    matching.push(child);
                } else if (child instanceof Folder) {
                    let mtc = child.search(text);
                    if (mtc.length > 0) {
                        matching.push(child);
                        matching.push(...mtc);
                    }
                }
            }

            for (let parent of this.allChilds) {
                if (matching.includes(parent)) {
                    this.searchMatches.push(parent);
                    parent.element.style.display = "inherit";
                    //highlight
                    //todo fix highlight
                    //console.log(parent.text.innerHTML.replace(text, highlight));
                    //parent.text.innerHTML = parent.text.innerHTML.replace(text, highlight)
                } else {
                    parent.element.style.display = "none";
                }
            }
        }
    }

    // * -------------------------------------------------------------------
    /**
     * @param element {ExplorerParent}
     * @param event {Event}
     */
    onClick(element, event){
        console.log("Click on " + element.getName() + ": " + element.path)
        if(this.shiftClicked && this.selected.length > 0){
            let firstClick = this.selected[0];
            let firstClickIndex = firstClick.element.offsetTop;
            //element is second click
            let secondClickIndex = element.element.offsetTop;

            for (let explorerParent of this.selected) {
                explorerParent.deselect();
            }

            let min = Math.min(firstClickIndex, secondClickIndex);
            let max = Math.max(firstClickIndex, secondClickIndex);

            for (let file of this.allChilds) {
                let index = file.element.offsetTop;
                if(index >= min && index <= max){
                    file.select();
                    this.selected.push(file);
                }
            }
        } else if(!this.controlClicked){
            //deselect - it's not multiple selection
            for (let explorerParent of this.selected) {
                explorerParent.deselect();
            }
            this.selected = [];
            element.select();
            this.selected.push(element);
        }else {
            if (element.selected) {
                element.deselect();
                utils.removeFromArray(this.selected, element);
            } else {
                element.select();
                this.selected.push(element);
            }
        }
    }
    /**
     * @param element {ExplorerParent}
     * @param event {Event}
     */
    onDoubleClick(element, event){
        if(this.callbacks.hasOwnProperty('open')){
            this.callbacks.open(element);
        }else{
            throw new Error('Unable to open file: no callback specified');
        }
    }
    /**
     * Overridable
     * @param element {ExplorerParent}
     * @param event {Event}
     */
    onContextClick(element, event){

    }

    /**
     * @param explorer {AbstractFileExplorer}
     * @param parent {HTMLElement}
     * @param callbacks {{}}
     * @return {FileExplorer}
     */
    static fromAbstract(explorer, parent, callbacks){
        let fileExplorer = new FileExplorer(parent, callbacks);
        fileExplorer.parentPath = explorer.parentPath;
        fileExplorer.childs = explorer.childs;
        fileExplorer.abstractExplorer = explorer.abstractExplorer;
        return fileExplorer;
    }
}

module.exports.FileExplorer = FileExplorer;

/**
 * @interface
 */
class ExplorerParent{
    /**
     * @type FileExplorer
     */
    fileExplorer;
    /**
     * @type ?Folder
     */
    parent;
    name;
    path;

    /**
     * @type HTMLElement
     */
    element;

    /**
     * @type HTMLSpanElement
     */
    text;


    /**
     * @param name {string}
     * @param path {string}
     */
    constructor(name, path) {
        this.name = name;
        this.path = fsutils.normalizePath(path);
    }

    /**
     * @abstract
     * @return string
     */
    getIcon(){

    }

    /**
     * @return string
     */
    getName(){
        return this.name;
    }

    /**
     * @param event {Event}
     */
    onClick(event){
        this.fileExplorer.onClick(this, event);
    }

    /**
     * @param event {Event}
     */
    onContextClick(event){
        this.fileExplorer.onContextClick(this, event);
    }

    select(){
        this.element.classList.add('selected');
    }

    deselect(){
        this.element.classList.remove('selected');
    }

    /**
     * @param event {Event}
     */
    onDoubleClick(event){
        this.fileExplorer.onDoubleClick(this, event);
    }

    /**
     * @abstract
     * @return HTMLElement
     */
    render(){

    }

    /**
     * @abstract
     * @return {{}}
     */
    serialize(){

    }

    /**
     * @param data {{}}
     * @param parent {FileExplorer}
     * @abstract
     * @return this
     */
    static deserialize(data, parent){

    }

    get selected(){
        return this.element.classList.contains('selected');
    }

    /**
     * Override it to order your items.
     * Bigger than 0 - on top
     * Smaller than 0 - on bottom
     * @return {number}
     */
    get order(){
        return 0;
    }

    /**
     * @param newParent {?Folder}
     */
    move(newParent = null){
        //remove from old
        if(this.parent == null){
            this.fileExplorer.removeChildSilent(this);
        }else{
            this.parent.removeChildSilent(this)
        }

        //add to new
        if(newParent == null){
            this.fileExplorer.addChildSilent(this);
        }else{
            newParent.addChildSilent(this);
        }


        //force render
        this.fileExplorer.renderElement(this);
    }

    /**
     * @param newName {string}
     */
    rename(newName){
        //!todo
    }

    /**
     * @param withDependencies {boolean} should delete dependent files like models or textures if they would be unused
     */
    delete(withDependencies = false){
        //!todo
    }
}

class Folder extends ExplorerParent{
    /**
     * @type HTMLElement
     */
    folder;

    /**
     * @type HTMLElement
     */
    folderContent;

    collapsed = false;

    /**
     * @type {ExplorerParent[]}
     */
    childs = [];

    /**
     * Is folder locked for new contents
     * e.g resource folder
     * @type {boolean}
     */
    locked = false;

    /**
     * @return ExplorerParent
     * @param element {ExplorerParent}
     */
    addChild(element){
        this.childs.push(element);
        this.fileExplorer.allChilds.push(element);
        element.fileExplorer = this.fileExplorer;
        element.parent = this;
        return element;
    }

    /**
     * Moving from this folder to any other
     * @return ExplorerParent
     * @param element {ExplorerParent}
     */
    addChildSilent(element){
        this.childs.push(element);
        element.fileExplorer = this.fileExplorer;
        element.parent = this;
        return element;
    }

    /**
     * @param element {ExplorerParent}
     */
    removeChild(element){
        const {utils} = require('./../util/utils.js');
        utils.removeFromArray(this.childs, element);
        utils.removeFromArray(this.fileExplorer.allChilds, element);
    }

    /**
     * Moving from this folder to any other
     * @param element {ExplorerParent}
     */
    removeChildSilent(element){
        const {utils} = require('./../util/utils.js');
        utils.removeFromArray(this.childs, element);
    }

    getIcon() {
        return utils.getIcon('folder.svg');
    }

    /**
     * @param text
     * @return ExplorerParent[]
     */
    search(text){
        let matching = [];
        for (let child of this.childs) {
            if(child.getName().includes(text)){
                matching.push(child);
            }else if(child instanceof Folder){
                let mtc = child.search(text);
                if(mtc.length > 0){
                    matching.push(child);
                    matching.push(...mtc);
                }
            }
        }
        return matching;
    }

    render() {
        this.element = document.createElement('div');
        this.element.classList.add("folder-holder");

        this.folder = document.createElement('div');
        this.folder.classList.add("folder",'explorer-element');
        utils.onClick(this.folder,(e) => {
            this.onClick(e);
        })
        utils.onDoubleClick(this.folder,(e) => {
            this.onDoubleClick(e);
        });
        utils.onContextClick(this.folder,(e) => {
            e.preventDefault();
            this.onContextClick(e);
        })

        let collapse = document.createElement('img');
        collapse.classList.add('collapse');
        collapse.src = utils.getIcon(this.collapsed ? 'arrow_collapse.svg' : 'arrow_expand.svg');
        utils.onClick(collapse, () => {
            this.collapsed = !this.collapsed;
            collapse.src = utils.getIcon(this.collapsed ? 'arrow_collapse.svg' : 'arrow_expand.svg');
            this.folderContent.style.display = this.collapsed ? "none" : "inherit";
        })

        let icon = document.createElement('img');
        icon.src = this.getIcon();

        this.text = document.createElement('span');
        this.text.classList.add('title');
        this.text.innerText = this.getName();

        utils.addChild(this.folder, collapse, icon, this.text);

        this.folderContent = document.createElement('div');
        this.folderContent.classList.add("folder-content");
        this.folderContent.style.display = this.collapsed ? "none" : "inherit";

        //childs
        for (let child of this.childs) {
            utils.addChild(this.folderContent, child.render());
        }

        //
        utils.addChild(this.element, this.folder, this.folderContent)

        ///
        let drag = new dragAndDrop.draggable(this.folder);
        drag.serialize = () => {
            return JSON.stringify({
                type: "folder",
                index: this.fileExplorer.allChilds.indexOf(this)
            })
        };

        drag.addDragStartEvent((e) => {
            if(!this.fileExplorer.selected.includes(this)){
                this.onClick(e);
            }
        })

        let drop = new dragAndDrop.zone(this.element);
        drop.analyzeData = (string) => {
            let data = JSON.parse(string);
            let type = data.type;
            let index = data.index;

            if(this.fileExplorer.selected.includes(this)){
                return false;
            }

            for (let e of this.fileExplorer.selected) {
                e.move(this);
            }

            return true;
        }

        return this.element;
    }

    sort(){
        for (let child of this.childs) {
            if(child instanceof Folder){
                child.sort();
            }
        }
        this.childs.sort((a, b) => {
            return a.order === b.order ? (a.getName() < b.getName() ? -1 : 1) : (a.order < b.order ? 1 : -1);
        })
    }

    static deserialize(data, parent, allChilds = []) {
        let childs = [];
        for (let child of data.childs){
            if(child.type === 'folder'){
                let folder = Folder.deserialize(child, parent, allChilds);
                allChilds.push(folder);
                childs.push(folder);
            }else{
                let file = File.deserialize(child, parent);
                allChilds.push(file)
                childs.push(file);
            }
        }

        let folder;
        let type = data['folder_type'];
        if(type === 'resource-folder'){
            folder = new ResourceFolder(data.name, data.path);
        }else if(type === 'error-folder'){
            folder = new ErrorsFolder(data.name, data.path);
        }else{
            folder = new Folder(data.name, data.path);
        }

        folder.fileExplorer = parent;
        folder.childs = childs;
        return folder;
    }

    get type(){
        return "plain";
    }

    get order() {
        return 1;
    }

    serialize() {
        let childs = [];
        for (let child of this.childs) {
            childs.push(child.serialize());
        }
        return {
            type: 'folder',
            folder_type: this.type,
            name: this.name,
            path: this.path,
            childs: childs
        }
    }
}

module.exports.Folder = Folder;

class File extends ExplorerParent{
    data = {};

    getIcon() {
        return utils.getIcon('file.svg');
    }

    render() {
        this.createElement();
        let icon = document.createElement('img');
        icon.src = this.getIcon();

        this.text = document.createElement('span');
        this.text.classList.add('title');
        this.text.innerText = this.getName();

        utils.addChild(this.element, icon, this.text);
        return this.element;
    }

    createElement(){
        this.element = document.createElement('div');
        this.element.classList.add("file",'explorer-element');
        utils.onClick(this.element,(e) => {
            this.onClick(e);
        })
        utils.onDoubleClick(this.element,(e) => {
            this.onDoubleClick(e);
        });
        utils.onContextClick(this.element,(e) => {
            e.preventDefault();
            this.onContextClick(e);
        })

        let openMark = document.createElement('img');
        openMark.classList.add("open-mark");
        openMark.src = utils.getIcon('arrow_collapse.svg');
        utils.addChild(this.element, openMark);

        let drag = new dragAndDrop.draggable(this.element);
        drag.serialize = () => {
            return JSON.stringify({
                type: "file",
                index: this.fileExplorer.allChilds.indexOf(this)
            })
        };

        drag.addDragStartEvent((e) => {
            if(!this.fileExplorer.selected.includes(this)){
                this.onClick(e);
            }
        })

        let drop = new dragAndDrop.zone(this.element);
        drop.analyzeData = (string) => {
            let data = JSON.parse(string);
            let type = data.type;
            let index = data.index;

            if(this.fileExplorer.selected.includes(this)){
                return false;
            }
            if(this.parent != null){
                return false;
            }
            let allRoot = true;
            for (let e of this.fileExplorer.selected) {
                if(e.parent != null){
                    allRoot = false;
                    break;
                }
            }
            if(allRoot){
                return false;
            }

            for (let e of this.fileExplorer.selected) {
                e.move();
            }

            return true;
        }
    }


    static deserialize(data, parent) {
        let file;
        if(data.data != null && data.data.hasOwnProperty('type')){
            let type = data.data['type'];
            if(type === 'block'){
                file = new BlockFile(data.name, data.path);
            }else if(type === 'block_model'){
                file = new BlockModelFile(data.name, data.path);
            }else if(type === 'item'){
                file = new ItemFile(data.name, data.path);
            }else if(type === 'texture'){
                file = new TextureFile(data.name, data.path);
            }else{
                file = new File(data.name, data.path);
            }
        }else{
            file = new File(data.name, data.path);
        }
        file.data = data.data === null ? {} : data.data;
        file.fileExplorer = parent;
        return file;
    }

    serialize() {
        return {
            type: 'file',
            name: this.name,
            path: this.path,
            data: this.data
        }
    }
}

module.exports.File = File;

class ResourceFolder extends Folder{
    constructor(name, path) {
        super(name, path);
        this.locked = true;
    }

    render() {
        let element = super.render();
        element.classList.add("resource-folder");
        return element;
    }

    get order() {
        return -5;
    }

    get type() {
        return "resource-folder";
    }
}

module.exports.ResourceFolder = ResourceFolder;

class ErrorsFolder extends Folder{
    constructor(name, path) {
        super(name, path);
        this.locked = true;
    }

    render() {
        let element = super.render();
        element.classList.add("errors-folder");
        return element;
    }

    get order(){
        return -10;
    }

    get type(){
        return 'error-folder';
    }
}

module.exports.ErrorsFolder = ErrorsFolder;

class OpenableFile extends File{
    open(){
        this.element.classList.add("file-opened");
    }

    close(){
        this.element.classList.remove("file-opened")
    }

    update(ms){

    }

    get isOpened(){
        return this.element.classList.contains('file-opened')
    }
}

class BlockFile extends OpenableFile{
    /**
     * @type HTMLImageElement
     */
    icon;
    /**
     * @type HTMLImageElement
     */
    iconPreview;

    get blockName(){
        return this.data.value;
    }

    /**
     * @return {?Block}
     */
    getBlock(){
        return mod.modRegistry.getBlock(this.blockName);
    }

    getIcon() {
        return utils.getIcon('block.svg');
    }

    render() {
        /**
         * @type {Block}
         */
        let block = this.getBlock();

        this.createElement();

        this.icon = document.createElement('img');
        this.icon.src = this.getIcon();

        this.iconPreview = document.createElement('img');

        this.updateIcon();

        this.text = document.createElement('span');
        this.text.classList.add('title');
        this.text.innerText = this.getName();
        if(block == null){
            this.text.style.color = 'red'
        }

        utils.addChild(this.element, this.icon, this.iconPreview, this.text);

        if(block == null || !block.valid){
            let errors = document.createElement('div');
            errors.classList.add("errors");
            let errorImg = document.createElement('img');
            errorImg.src = utils.getIcon('error-mark.svg');
            utils.addChild(errors, errorImg);
            utils.addChild(this.element, errors);

            let tooltip = new tooltips.TextTooltip(errorImg, block == null ? "Block is undefined" : block.errorMessage);
            tooltip.applyHover(errorImg);
        }

        return this.element;
    }

    isVisible = false;
    update(ms){
        if(this.element == null){
            return
        }
        if((ms % 10 === 0 && ms % 3 === 0) || !this.isVisible){
            if(utils.checkVisible(this.element)){
                this.isVisible = true;
                this.updateIcon();
            }else{
                this.isVisible = false;
            }
        }
    }

    currentModel = 0;
    currentTexture = 0;
    updateIcon(){
        let block = this.getBlock();

        let model = block.models[this.currentModel];
        let exists = false;
        if(model != null) {
            let textures = model.getTextures();
            let texture = textures[this.currentTexture];

            exists = texture != null && texture.exists();
            this.iconPreview.src = !exists ? utils.getIcon('block.svg') : texture.path;

            if(this.currentTexture < textures.length-1){
                this.currentTexture ++;
            }else{
                this.currentTexture = 0;
                if(this.currentModel < block.models.length-1){
                    this.currentModel ++;
                }else{
                    this.currentModel = 0;
                }
            }
        }else{
            this.iconPreview.src = utils.getIcon('block.svg');
        }

        if(!exists){
            this.icon.style.filter = 'saturate(0.4)';
            this.iconPreview.style.filter = 'saturate(0.2)';
        }else{
            this.icon.style.filter = 'inherit';
        }
    }
}
module.exports.BlockFile = BlockFile;

class BlockModelFile extends OpenableFile{
    get blockModelName(){
        return this.data.value;
    }

    getBlockModel(){
        return mod.modRegistry.getBlockModel(this.blockModelName);
    }

    getIcon() {
        return utils.getIcon('model.svg');
    }

    render() {
        /**
         * @type {BlockModel}
         */
        let model = this.getBlockModel();
        let valid = !(model == null || !model.exists())

        this.createElement();

        let icon = document.createElement('img');
        icon.src = this.getIcon();

        let textures = model == null ? null : model.getTextures();
        let texture = textures == null || textures.length <= 0 ? null : textures[0].pathOrNull;
        let iconPreview = document.createElement('img');
        iconPreview.src = texture == null ? utils.getIcon( 'model.svg') : textures[0].path;
        if(texture == null){
            icon.style.filter = 'saturate(0.4)';
            iconPreview.style.filter = 'saturate(0.2)';
        }
        utils.addChild(this.element,icon,iconPreview);

        this.text = document.createElement('span');
        this.text.classList.add('title');
        this.text.innerText = this.getName();
        if(!valid){
            this.text.style.color = 'gray';
        }
        if(model == null){
            this.text.style.color = 'red'
        }

        utils.addChild(this.element,this.text);
        let errors = document.createElement('div');
        errors.classList.add("errors");
        if(!valid){
            let errorImg = document.createElement('img');
            errorImg.src = utils.getIcon('error-mark.svg');
            utils.addChild(errors, errorImg);

            let tooltip = new tooltips.TextTooltip(errorImg, model == null ? "Model is undefined" : model.errorMessage);
            tooltip.applyHover(errorImg);
        }
        if(!model.hasBlockstate){
            let errorImg = document.createElement('img');
            errorImg.src = utils.getIcon('error-mark.svg');
            errorImg.classList.add("warning");
            utils.addChild(errors, errorImg);

            let tooltip = new tooltips.TextTooltip(errorImg, "This model is unused.");
            tooltip.applyHover(errorImg);
        }
        utils.addChild(this.element, errors);

        return this.element;
    }
}
module.exports.BlockModelFile = BlockModelFile;

class ItemFile extends OpenableFile{
    get itemName(){
        return this.data.value;
    }

    getItem(){
        return mod.modRegistry.getItem(this.itemName);
    }

    getIcon() {
        return utils.getIcon('item.svg');
    }

    render() {
        /**
         * @type {Item}
         */
        let item = this.getItem();

        this.createElement();

        let icon = document.createElement('img');
        icon.src = this.getIcon();

        let textures = item == null ? null : item.getTextures();
        let texture = textures == null || textures.length <= 0 ? null : textures[0].pathOrNull;
        let iconPreview = document.createElement('img');
        iconPreview.src = texture == null ? utils.getIcon( 'texture.svg') : textures[0].path;
        if(texture == null){
            icon.style.filter = 'saturate(0.4)';
            iconPreview.style.filter = 'saturate(0.2)';
        }

        this.text = document.createElement('span');
        this.text.classList.add('title');
        this.text.innerText = this.getName();
        if(item == null){
            this.text.style.color = 'red'
        }

        utils.addChild(this.element, icon, iconPreview, this.text);

        if(item == null || !item.valid){
            let errors = document.createElement('div');
            errors.classList.add("errors");
            let errorImg = document.createElement('img');
            errorImg.src = utils.getIcon('error-mark.svg');
            utils.addChild(errors, errorImg);
            utils.addChild(this.element, errors);

            let tooltip = new tooltips.TextTooltip(errorImg, item == null ? "Item is undefined" : item.errorMessage);
            tooltip.applyHover(errorImg);
        }

        return this.element;
    }
}
module.exports.ItemFile = ItemFile;

class TextureFile extends OpenableFile{
    get textureName(){
        return this.data.value;
    }

    getTexture(){
        return mod.modRegistry.getTexture(this.textureName);
    }

    getIcon() {
        let texture = this.getTexture();
        let valid = !(texture == null || !texture.exists())
        return valid ? (texture.path) : utils.getIcon('texture.svg');
    }

    render() {
        /**
         * @type {Texture}
         */
        let texture = this.getTexture();
        let valid = !(texture == null || !texture.exists())
        this.createElement();

        let icon = document.createElement('img');
        icon.loading = 'lazy';

        if(!valid){
            icon.style.filter = 'saturate(0.2)';
        }
        icon.src = this.getIcon();

        this.text = document.createElement('span');
        this.text.classList.add('title');
        this.text.innerText = this.getName();
        if(!valid){
            this.text.style.color = 'gray';
        }
        if(texture == null){
            this.text.style.color = 'red'
        }


        utils.addChild(this.element, icon, this.text);
        let errors = document.createElement('div');
        errors.classList.add("errors");
        if(!valid){
            let errorImg = document.createElement('img');
            errorImg.src = utils.getIcon('error-mark.svg');
            utils.addChild(errors, errorImg);

            let tooltip = new tooltips.TextTooltip(errorImg, texture == null ? "Texture is undefined" : "Texture does not exists.");
            tooltip.applyHover(errorImg);
        }
        if(!texture.hasModel){
            let errorImg = document.createElement('img');
            errorImg.src = utils.getIcon('error-mark.svg');
            errorImg.classList.add("warning");
            utils.addChild(errors, errorImg);

            let tooltip = new tooltips.TextTooltip(errorImg, "This texture is unused.");
            tooltip.applyHover(errorImg);
        }
        utils.addChild(this.element, errors);

        return this.element;
    }

    onClick(event) {
        super.onClick(event);
    }
}
module.exports.TextureFile = TextureFile;
