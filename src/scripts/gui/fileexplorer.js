class AbstractFileExplorer{
    /**
     * @type ExplorerParent[]
     */
    childs = [];

    /**
     * Used if folder structure is "abstract", and folders are saved only to JSON (blockstates)
     * @type {boolean}
     */
    requireUnique = false;

    /**
     * @return ExplorerParent
     * @param element {ExplorerParent}
     */
    addChild(element){
        this.childs.push(element);
        return element;
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
     * @return {File[]}
     */
    getFiles(){
        let files = [];
        this.iterate((file, folder) => {
            files.push(file);
        })

        return files;
    }

    /**
     * @param name {string}
     * @param path {?string}
     * @param parent {?Folder}
     * @return Folder
     */
    createFolder(name, path,parent = null){
        if(path == null && parent == null){
            return null;
        }
        let folder = new Folder(name, path == null ? parent.path : path);
        this.addChild(folder);
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
            requireUnique: this.requireUnique,
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
        this.iterate((entry, folder) => {
            if(entry.path === path && entry instanceof Folder){
                return entry;
            }
        }, null, true);
        return null;
    }

    /**
     * @param data {{}}
     * @param parent {?HTMLElement}
     * @param callbacks {?{}}
     * @return {AbstractFileExplorer | FileExplorer}
     */
    static deserialize(data, parent, callbacks){
        let explorer = null;
        if(parent == null || callbacks == null){
            explorer = new AbstractFileExplorer();
        }else{
            explorer = new FileExplorer(parent, callbacks);
        }

        let childs = [];
        for (let child of data.childs){
            if(child.type === 'folder'){
                childs.push(Folder.deserialize(child, explorer));
            }else{
                childs.push(File.deserialize(child, explorer));
            }
        }

        if(parent == null){
            explorer.childs = childs;
            explorer.requireUnique = data.requireUnique;
            return explorer;
        }else{
            explorer.childs = childs;
            explorer.parent = parent;
            explorer.requireUnique = data.requireUnique;
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
        })
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
        element.parent = this;
        return super.addChild(element);
    }

    createFolder(name, path, parent = null, callback = null) {
        let folder = super.createFolder(name, path, parent);
        this.sort();
        this.renderAsync(() => {
            utils.scrollToElement(this.parent, folder.element);
            this.onClick(folder, null);
            if(callback != null){
                callback()
            }
        });
        return folder;
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
            this.iterate((parent, folder) => {
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
            }, null, true);
        }
    }

    // * -------------------------------------------------------------------
    /**
     * @param element {ExplorerParent}
     * @param event {Event}
     */
    onClick(element, event){
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

            this.iterate((file, folder) => {
                let index = file.element.offsetTop;
                if(index >= min && index <= max){
                    file.select();
                    this.selected.push(file);
                }
            }, null, true);
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
     * @param explorer {AbstractFileExplorer}
     * @param parent {HTMLElement}
     * @param callbacks {{}}
     * @return {FileExplorer}
     */
    static fromAbstract(explorer, parent, callbacks){
        let fileExplorer = new FileExplorer(parent, callbacks);
        fileExplorer.childs = explorer.childs;
        fileExplorer.requireUnique = explorer.requireUnique;
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
        this.path = path;
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
        this.parent.onClick(this, event);
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
        this.parent.onDoubleClick(this, event);
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
     * @return ExplorerParent
     * @param element {ExplorerParent}
     */
    addChild(element){
        this.childs.push(element);
        element.parent = this.parent;
        return element;
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

    static deserialize(data, parent) {
        let childs = [];
        for (let child of data.childs){
            if(child.type === 'folder'){
                childs.push(Folder.deserialize(child, parent));
            }else{
                childs.push(File.deserialize(child, parent));
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

        folder.parent = parent;
        folder.childs = childs;
        return folder;
    }

    get type(){
        return "plain";
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

        let openMark = document.createElement('img');
        openMark.classList.add("open-mark");
        openMark.src = utils.getIcon('arrow_collapse.svg');
        utils.addChild(this.element, openMark)
    }


    static deserialize(data, parent) {
        let file;
        if(data.data != null && data.data.hasOwnProperty('type')){
            let type = data.data['type'];
            if(type === 'block'){
                file = new BlockFile(data.name, data.path);
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
        file.parent = parent;
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

    get isOpened(){
        return this.element.classList.contains('file-opened')
    }
}

class BlockFile extends OpenableFile{
    get blockName(){
        return this.data.value;
    }

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

        let icon = document.createElement('img');
        icon.src = this.getIcon();

        this.text = document.createElement('span');
        this.text.classList.add('title');
        this.text.innerText = this.getName();
        if(block == null){
            this.text.style.color = 'red'
        }

        utils.addChild(this.element, icon, this.text);

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
}
module.exports.BlockFile = BlockFile;

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
}
module.exports.TextureFile = TextureFile;
