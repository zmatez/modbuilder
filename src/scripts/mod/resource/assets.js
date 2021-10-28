const explorer = require('../../gui/fileexplorer');
const {ModUtils, ResourceLocation} = require('../util/modutils');
const fileOperators = require('../../operation/file-operator');

class ModAssetLoader {
    /**
     * @type Mod
     */
    mod;
    /**
     * @type MainController
     */
    controller;
    /**
     * @type AbstractFileExplorer
     */
    blocks;
    /**
     * @type AbstractFileExplorer
     */
    blockModels;
    /**
     * @type AbstractFileExplorer
     */
    items;
    /**
     * @type AbstractFileExplorer
     */
    textures;

    /**
     * @param mod {Mod}
     * @param controller {MainController}
     */
    constructor(mod, controller) {
        this.mod = mod;
        this.controller = controller;
    }

    serialize(){
        return {
            loaded: this.loaded
        }
    }

    static deserialize(data, mod, controller){
        let loader =  new ModAssetLoader(mod, controller);
        loader.loaded = data.loaded;
        return loader;
    }

    load(callback) {
        this.loadBlockstates();
        setTimeout(() => {
            this.loadBlocks();
            setTimeout(() => {
                this.loadItems();
                setTimeout(() => {
                    this.loadTextures();
                    this.loaded = true;
                    callback();
                },250)
            },250)
        },250)
    }

    /**
     * @private
     */
    loadBlockstates(){
        //------------------------------------------------------ BLOCKSTATES -----------
        LOG.progress("Loading blockstates");

        this.blocks = fsutils.getUnfolderedResourceList('blockstates','blockstates');

        this.blocks.fileOperator = new fileOperators.FileOperator(this.blocks, this.controller);

        LOG.success("Loaded " + this.blocks.allChilds.length + " blockstates");
        this.mod.modLoadingProgress.update('blockstates',this.blocks.allChilds.length);
    }

    /**
     * @private
     */
    loadBlocks(){
        //------------------------------------------------------ BLOCKS & MODELS -----------
        LOG.progress("Loading models...")
        for (let file of this.blocks.allChilds) {
            let block = this.registry.getOrCreateBlock(new Block(file.path, this.resourcePath, this.mod.codename));

            block.load();
            file.data = {
                type: 'block',
                value: block.location.location
            }
        }

        let resourcesFolder = new explorer.ResourceFolder('resources','');
        this.blocks.addChild(resourcesFolder);

        for (let key in this.mod.modResources.resources) {
            let resource = this.mod.modResources.resources[key];
            /**
             * @type {Block[]}
             */
            let blocks = resource.loadBlocks();
            //append to BLOCKS
            let folder = new explorer.Folder(resource.codename, resource.assetsPath + "/blockstates");
            resourcesFolder.addChild(folder);
            for (let block of blocks) {
                let file = new explorer.File(block.name,block.path);
                file.data = {
                    type: 'block',
                    value: block.location.location
                }
                folder.addChild(file);
            }
        }


        // * ------------------------------------------------

        /**
         * @param namespace {string}
         * @param dir {string}
         * @param registry {ModRegistry}
         * @param resourcePath {string}
         */
        function loadModelsIn(namespace, dir, registry, resourcePath){
            let files = fsutils.getFilesInFolder(dir);
            for (let file of files) {
                let path = fsutils.normalizePath(file).replace(fsutils.normalizePath(dir),'');
                if(path.startsWith('/')){
                    path = path.substring(1);
                }

                if(!path.includes('.json')){
                    continue
                }

                path = path.replace('.json','')

                let location = new ResourceLocation({
                    namespace: namespace,
                    path: 'block/' + path
                });

                if(!registry.hasBlockModel(location)){
                    let texture = registry.getOrCreateBlockModel(new BlockModel(location.location,resourcePath));
                }
            }
        }

        loadModelsIn(this.mod.codename, this.mod.assetsPath + "/models/block", this.registry, this.resourcePath);
        for (let key in this.mod.modResources.resources) {
            let resource = this.mod.modResources.resources[key];
            loadModelsIn(resource.codename, resource.assetsPath + "/models/block", this.registry, resource.path);
        }

        this.blockModels = fsutils.getResourceList('models/block','block_model',mod.modRegistry.blockModels,'assets',0);

        // * ------------------------------------------------

        let blocksCount = this.registry.countBlocks(true);
        let modelsCount = this.registry.countBlockModels(true);

        this.blockModels.fileOperator = new fileOperators.FileOperator(this.blockModels, this.controller);

        LOG.success("Loaded " + modelsCount.count + " (" + modelsCount.valid + " valid) models for " + blocksCount.count + " blocks (" + blocksCount.valid + " valid)")
        this.mod.modLoadingProgress.update('models_block',modelsCount.count);
    }

    /**
     * @private
     */
    loadItems(){
        LOG.progress("Loading items...");

        this.items = fsutils.getUnfolderedResourceList('models/item','items');

        //load to registry
        for (let file of this.items.allChilds) {
            let item = this.registry.getOrCreateItem(new Item(file.path, this.resourcePath, this.mod.codename));
            item.load();
            file.data = {
                type: 'item',
                value: item.location.location
            }
        }

        let resourcesFolder = new explorer.ResourceFolder('resources','');
        this.items.addChild(resourcesFolder);

        for (let key in this.mod.modResources.resources) {
            let resource = this.mod.modResources.resources[key];
            let items = resource.loadItems();
            //append to ITEMS
            let folder = new explorer.Folder(resource.codename, resource.assetsPath + "/models/item");
            resourcesFolder.addChild(folder);
            for (let item of items) {
                let file = new explorer.File(item.name,item.path);
                file.data = {
                    type: 'item',
                    value: item.location.location
                }
                folder.addChild(file);
            }
        }

        let count = this.registry.countItems(true);

        this.items.fileOperator = new fileOperators.FileOperator(this.items, this.controller);

        LOG.success("Loaded " + count.count + " items (" + count.valid + " valid)");
        this.mod.modLoadingProgress.update('models_item',count.count);
    }

    /**
     * @private
     */
    loadTextures(){
        //------------------------------------------------------ TEXTURES -----------
        /**
         * @type {Texture[]}
         */
        //load textures from models
        for (let [key, model] of this.registry.blockModels) {
            model.loadTextures();
        }

        for (let [key, item] of this.registry.items) {
            item.loadTextures();
        }

        /**
         * @param namespace {string}
         * @param dir {string}
         * @param registry {ModRegistry}
         * @param resourcePath {string}
         */
        function loadTexturesIn(namespace, dir, registry, resourcePath){
            let files = fsutils.getFilesInFolder(dir);
            for (let file of files) {
                let path = fsutils.normalizePath(file).replace(fsutils.normalizePath(dir),'');
                if(path.startsWith('/')){
                    path = path.substring(1);
                }

                if(!path.includes('.png')){
                    continue
                }
                if(path.includes('.mcmeta')){
                    continue
                }

                path = path.replace('.png','')

                let location = new ResourceLocation({
                    namespace: namespace,
                    path: path
                });

                let texture = registry.getOrCreateTexture(new Texture(null, location.location,resourcePath));
                texture.resourcePath = resourcePath;
            }
        }
        loadTexturesIn(this.mod.codename, this.mod.assetsPath + "/textures", this.registry, this.resourcePath);
        for (let key in this.mod.modResources.resources) {
            let resource = this.mod.modResources.resources[key];
            loadTexturesIn(resource.codename, resource.assetsPath + "/textures", this.registry, resource.path);
        }


        let texturesCount = this.registry.countTextures()

        this.textures = fsutils.getResourceList('textures','texture',mod.modRegistry.textures);
        this.textures.fileOperator = new fileOperators.FileOperator(this.textures, this.controller);

        this.mod.modLoadingProgress.update('textures',texturesCount);
    }


    get resourcePath(){
        return this.mod.path;
    }
    get assetsPath() {
        return this.mod.assetsPath;
    }
    get blockStatePath() {
        return this.mod.blockStatePath;
    }
    get registry(){
        return this.mod.modRegistry;
    }


}

module.exports.ModAssetLoader = ModAssetLoader;

class ModRegistry{
    /**
     * @type {Map<string, Block>} name -> block
     */
    blocks = new Map();
    /**
     * @type {Map<string, BlockModel>} location -> block
     */
    blockModels = new Map();
    /**
     * @type {Map<string, Item>} location -> item
     */
    items = new Map();
    /**
     * @type {Map<string, Texture>} location -> texture
     */
    textures = new Map();

    /**
     * @type {function(string)}
     */
    transferCallback;

    /**
     * @param transferCallback {function(string)}
     */
    constructor(transferCallback) {
        this.transferCallback = transferCallback
    }

    //-------------------- BLOCKS -------------------
    /**
     * @param location {string | ResourceLocation}
     * @return {boolean}
     */
    hasBlock(location){
        if(location instanceof ResourceLocation){
            location = location.location;
        }
        return this.blocks.has(location)
    }
    /**
     * @param location {string | ResourceLocation}
     * @return {?Block}
     */
    getBlock(location){
        if(location instanceof ResourceLocation){
            location = location.location;
        }
        return this.blocks.get(location)
    }
    /**
     * @param block {Block}
     * @return boolean
     */
    registerBlock(block){
        if(this.hasBlock(block.location)){
            return false;
        }

        this.blocks.set(block.location.location, block);
        return true;
    }
    /**
     * @param block {Block}
     * @return {Block}
     */
    getOrCreateBlock(block){
        if(this.hasBlock(block.location)){
            return this.getBlock(block.location);
        }
        this.registerBlock(block);
        this.markDirty();
        return block;
    }
    /**
     * @param returnData {boolean}
     * @return {number | {count, valid}}
     */
    countBlocks(returnData = false){
        let count = 0;
        let validCount = 0;
        for (let [key, block] of this.blocks) {
            count++;
            if(block.valid){
                validCount++;
            }
        }
        if(returnData){
            return {
                count: count,
                valid: validCount
            }
        }
        return count;
    }

    //-------------------- BLOCK MODELS -------------------
    /**
     * @param location {ResourceLocation | string}
     * @return {boolean}
     */
    hasBlockModel(location){
        if(location instanceof ResourceLocation){
            location = location.location;
        }
        return this.blockModels.has(location)
    }
    /**
     * @param location {ResourceLocation | string}
     * @return {?BlockModel}
     */
    getBlockModel(location){
        if(location instanceof ResourceLocation){
            location = location.location;
        }
        return this.blockModels.get(location)
    }
    /**
     * @param blockModel {BlockModel}
     * @return boolean
     */
    registerBlockModel(blockModel){
        if(this.hasBlockModel(blockModel.location.location)){
            return false;
        }

        this.blockModels.set(blockModel.location.location, blockModel)
        return true;
    }
    /**
     * @param blockModel {BlockModel}
     * @return {BlockModel}
     */
    getOrCreateBlockModel(blockModel){
        if(this.hasBlockModel(blockModel.location)){
            return this.getBlockModel(blockModel.location);
        }
        this.registerBlockModel(blockModel);
        this.markDirty();
        return blockModel;
    }
    /**
     * @param returnData {boolean}
     * @return {number | {count, valid}}
     */
    countBlockModels(returnData = false){
        let count = 0;
        let validCount = 0;
        for (let [key, model] of this.blockModels) {
            count++;
            if(model.valid){
                validCount++;
            }
        }
        if(returnData){
            return {
                count: count,
                valid: validCount
            }
        }
        return count;
    }
    //-------------------- ITEMS -------------------
    /**
     * @param location {string | ResourceLocation}
     * @return {boolean}
     */
    hasItem(location){
        if(location instanceof ResourceLocation){
            location = location.location;
        }
        return this.items.has(location)
    }
    /**
     * @param location {string | ResourceLocation}
     * @return {?Item}
     */
    getItem(location){
        if(location instanceof ResourceLocation){
            location = location.location;
        }
        return this.items.get(location)
    }
    /**
     * @param item {Item}
     * @return boolean
     */
    registerItem(item){
        if(this.hasItem(item.location)){
            return false;
        }

        this.items.set(item.location.location, item)
        return true;
    }
    /**
     * @param item {Item}
     * @return {Item}
     */
    getOrCreateItem(item){
        if(this.hasItem(item.location)){
            return this.getItem(item.location);
        }
        this.registerItem(item);
        this.markDirty();
        return item;
    }
    /**
     * @param returnData {boolean}
     * @return {number | {count, valid}}
     */
    countItems(returnData = false){
        let count = 0;
        let validCount = 0;
        for (let [key, model] of this.items) {
            count++;
            if(model.valid){
                validCount++;
            }
        }
        if(returnData){
            return {
                count: count,
                valid: validCount
            }
        }
        return count;
    }

    //-------------------- TEXTURES -------------------
    /**
     * @param location {ResourceLocation | string}
     * @return {boolean}
     */
    hasTexture(location){
        if(location instanceof ResourceLocation){
            location = location.location;
        }
        return this.textures.has(location)
    }
    /**
     * @param location {ResourceLocation | string}
     * @return {?Texture}
     */
    getTexture(location){
        if(location instanceof ResourceLocation){
            location = location.location;
        }
        return this.textures.get(location)
    }
    /**
     * @param texture {Texture}
     * @return boolean
     */
    registerTexture(texture){
        if(this.hasTexture(texture.location.location)){
            return false;
        }
        this.textures.set(texture.location.location, texture)
        this.markDirty();
        return true;
    }
    /**
     * @param texture {Texture}
     * @return {Texture}
     */
    getOrCreateTexture(texture){
        if(this.hasTexture(texture.location)){
            return this.getTexture(texture.location);
        }
        this.registerTexture(texture);
        return texture;
    }
    /**
     * @return {number}
     */
    countTextures(){
        return this.textures.size
    }

    // ! ---------------------------------------------
    /**
     * @private
     * @type {boolean}
     */
    dirty = false;

    markDirty(){
        this.dirty = true;
    }

    send(){
        this.transferCallback(JSON.stringify(this));
        this.dirty = false;
    }

    // * ---------------------------
    serialize(){
        let blocks = [];
        let blockModels = [];
        let items = [];
        let textures = [];

        for (let [key, block] of this.blocks) {
            blocks.push({
                key: key,
                value: block.serialize()
            })
        }
        for (let [key, blockModel] of this.blockModels) {
            blockModels.push({
                key: key,
                value: blockModel.serialize()
            })
        }
        for (let [key, item] of this.items) {
            items.push({
                key: key,
                value: item.serialize()
            })
        }
        for (let [key, texture] of this.textures) {
            textures.push({
                key: key,
                value: texture.serialize()
            })
        }

        return {
            blocks: blocks,
            blockModels: blockModels,
            items: items,
            textures: textures
        }
    }

    //thing is, we can't create new object here, just switch values
    //future work: replace values that changed, so the reference is still the same
    deserialize(data){
        //create all backwards
        this.textures = new Map();
        for(let entry of data.textures){
            this.textures.set(entry.key, Texture.deserialize(entry.value));
        }
        this.items = new Map();
        for(let entry of data.items){
            this.items.set(entry.key, Item.deserialize(entry.value));
        }
        this.blockModels = new Map();
        for(let entry of data.blockModels){
            this.blockModels.set(entry.key, BlockModel.deserialize(entry.value));
        }
        this.blocks = new Map();
        for(let entry of data.blocks){
            this.blocks.set(entry.key, Block.deserialize(entry.value));
        }

        return this;
    }
}

module.exports.ModRegistry = ModRegistry;

/* blockstates, models etc. */
/**
 * @interface
 */
class IRegistryEntry{
    /**
     * @type ResourceLocation
     */
    location;

    /**
     * @abstract
     * @return {{}}
     */
    serialize(){

    }

    /**
     * @abstract
     * @param data {{}}
     * @return {this}
     */
    static deserialize(data){

    }

    /**
     * @abstract
     * @return {this}
     */
    refresh(){

    }
}

//one blockstate == one block
class Block extends IRegistryEntry{
    /**
     * @type string
     */
    path;

    /**
     * @type {string[]}
     */
    modelLocations = [];
    /**
     * @type BlockModel[]
     */
    models = [];

    loaded = false;
    valid = false;
    errorMessage = null;

    /**
     * @type string
     */
    resourcePath

    /**
     * @param path {string}
     * @param resourcePath {string}
     * @param codename {string}
     */
    constructor(path, resourcePath, codename) {
        super();
        this.resourcePath = resourcePath;
        this.path = path;
        this.codename = codename;
        this.location = new ResourceLocation({
            namespace: codename,
            path: global.path.parse(path).name
        })
    }

    load() {
        try {
            let data = fs.readFileSync(this.path).toString('utf-8');
            let json = JSON.parse(data);

            let models = [];

            const iterate = (obj) => {
                Object.keys(obj).forEach(key => {
                    if (key === 'model') {
                        models.push(obj[key]);
                    }

                    if (typeof obj[key] === 'object') {
                        iterate(obj[key])
                    }
                })
            }

            iterate(json);

            if (models.length <= 0) {
                this.valid = false;
                this.errorMessage = "No models found";
            } else {
                this.modelLocations = models;
                this.valid = true;
            }
        } catch (e) {
            this.valid = false;
            this.errorMessage = e.message;
        }
        this.loaded = true;

        this.loadModels();
    }

    loadModels() {
        for (let modelLocation of this.modelLocations) {
            let model = mod.modRegistry.getOrCreateBlockModel(new BlockModel(modelLocation,this.resourcePath));
            model.hasBlockstate = true;
            this.models.push(model);
            model.load();
        }
    }

    get json(){
        if(isMain){
            return fs.readFileSync(this.path,{encoding: 'utf-8', flag: 'r'});
        }else{
            return this.jsonRemote
        }
    }

    exists() {
        if(isMain) {
            return fs.existsSync(this.path);
        }else{
            return this.existsRemote;
        }
    }

    get name() {
        return global.path.parse(this.path).name;
    }

    // * ---------------------------
    serialize(){
        let models = [];
        for (let model of this.models) {
            models.push(model.location.location)
        }
        return {
            path: this.path,
            location: this.location,
            modelLocations: this.modelLocations,
            models: models,
            loaded: this.loaded,
            valid: this.valid,
            errorMessage: this.errorMessage,
            resourcePath: this.resourcePath,
            json: this.json,
            exists: this.exists()
        }
    }

    static deserialize(data){
        let block = new Block(data.path,data.resourcePath,data.location.namespace);
        block.modelLocations = data.modelLocations;
        let models = [];
        for (let [key, value] of mod.modRegistry.blockModels) {
            if(data.models.includes(key)){
                models.push(value);
            }
        }
        block.models = models;
        block.loaded = data.loaded;
        block.valid = data.valid;
        block.errorMessage = data.errorMessage;
        block.resourcePath = data.resourcePath;
        block.jsonRemote = data.json;
        block.existsRemote = data.exists;
        return block;
    }

    refresh() {
        return mod.modRegistry.getBlock(this.location);
    }
}

module.exports.Block = Block;

class IModel extends IRegistryEntry{
    /**
     * @type Texture[]
     */
    textures = [];
    /**
     * @return {IModel | null}
     */
    findParent(){
        if(this.parent == null){
            return null;
        }

        let parent = new ResourceLocation(this.parent);
        if(parent.path.startsWith('item/')){
            parent.path = parent.path.substr(5);
            return mod.modRegistry.getItem(parent);
        }else if(parent.path.startsWith('block/')){
            return mod.modRegistry.getBlockModel(parent);
        }
        return null;
    }

    /**
     * includes parents
     * @return {Texture[]}
     */
    getTextures(){
        let parent = this.findParent();
        /**
         * @type {Texture[]}
         */
        let textures = this.textures;

        if(parent != null && parent !== this){
            let parentTextures = parent.getTextures();
            for (let ptx of parentTextures) {
                let contains = false;
                for (let texture of textures) {
                    if(texture.key === ptx.key){
                        contains = true;
                        break
                    }
                }

                if(!contains){
                    textures.push(ptx);
                }
            }
        }

        return textures;
    }

    /**
     * @return {{origin: IModel, overridden: boolean, texture: Texture}[][]}
     */
    getParentDiagram(){
        let parent = this.findParent();
        /**
         * @type {{origin: IModel, overridden: boolean, texture: ?Texture}[][]}
         */
        let textures = [];
        textures[0] = [];
        if(this.textures.length === 0){
            textures[0].push({
                origin: this,
                overridden: false,
                texture: null
            })
        }else{
            for (let texture of this.textures) {
                textures[0].push({
                    origin: this,
                    overridden: false,
                    texture: texture
                })
            }
        }

        if(parent != null && parent !== this){
            let parentTextures = parent.getParentDiagram()
            for (let i = 0; i < parentTextures.length; i++) {
                let ptx = parentTextures[i];
                textures[i+1] = [];
                for (let j = 0; j < ptx.length; j++) {
                    let ptxArr = ptx[j];
                    let contains = false;
                    for (let texture of textures) {
                        if(texture.texture != null && texture.texture.key === ptxArr.texture.key){
                            contains = true;
                            break
                        }
                    }

                    textures[i+1].push({
                        origin: ptxArr.origin,
                        texture: ptxArr.texture,
                        overridden: contains
                    })
                }

            }
        }

        return textures;
    }

    /**
     * @abstract
     */
    refresh() {
    }
    /**
     * @abstract
     */
    serialize() {
    }
}

class BlockModel extends IModel{
    /**
     * @type {string[]}
     */
    textureLocations = [];

    loaded = false;
    valid = false;
    errorMessage = null;

    hasBlockstate = false;
    /**
     * @type {?string}
     */
    parent;

    /**
     * @type string
     */
    resourcePath;

    /**
     * @param id {string | ResourceLocation}
     * @param resourcePath {string}
     */
    constructor(id, resourcePath) {
        super();
        this.resourcePath = resourcePath;
        this.location = new ResourceLocation(id);
    }

    load() {
        try {
            let data = fs.readFileSync(this.path).toString('utf-8');
            let json = JSON.parse(data);

            let textures = [];

            const iterate = (obj) => {
                Object.keys(obj).forEach(key => {
                    if (key === 'textures') {
                        let textureObj = obj[key];
                        for (let key in textureObj) {
                            textures.push({
                                key: key,
                                value: textureObj[key]
                            });
                        }
                    }else if(key === 'parent' && this.parent == null){
                        this.parent = obj[key];
                    }

                    if (typeof obj[key] === 'object') {
                        iterate(obj[key])
                    }
                })
            }

            iterate(json);

            if (textures.length <= 0) {
                this.valid = false;
                this.errorMessage = "No textures found";
            } else {
                this.textureLocations = textures;
                this.valid = true;
            }
        } catch (e) {
            this.valid = false;
            this.errorMessage = e.message;
        }
        this.loaded = true;
    }

    loadTextures() {
        for (let textureLocation of this.textureLocations) {
            let texture = mod.modRegistry.getOrCreateTexture(new Texture(textureLocation.key, textureLocation.value, this.resourcePath));
            texture.hasModel = true;
            this.textures.push(texture);
        }
    }

    get path() {
        return this.location.getModel(this.resourcePath);
    }

    get name() {
        return global.path.parse(this.path).name;
    }

    get json(){
        if(isMain){
            if(this.exists()) {
                return fs.readFileSync(this.path, 'utf-8');
            }
            return null;
        }else{
            return this.jsonRemote
        }
    }

    exists() {
        if(isMain) {
            return fs.existsSync(this.path);
        }else{
            return this.existsRemote;
        }
    }

    // * ---------------------------
    serialize(){
        let textures = [];
        for (let texture of this.textures) {
            textures.push(texture.location.location)
        }
        return {
            location: this.location,
            textureLocations: this.textureLocations,
            textures: textures,
            loaded: this.loaded,
            valid: this.valid,
            errorMessage: this.errorMessage,
            hasBlockstate: this.hasBlockstate,
            parent: this.parent,
            resourcePath: this.resourcePath,
            exists: this.exists(),
            json: this.json
        }
    }

    static deserialize(data){
        let model = new BlockModel(data.location,data.resourcePath);
        model.textureLocations = data.textureLocations;
        let textures = [];
        //console.log("Deserializing " + model.name + " with " + data.textures.length + " textures");
        for(let textureLocation of data.textures){
            if(mod.modRegistry.hasTexture(textureLocation)){
                textures.push(mod.modRegistry.getTexture(textureLocation))
            }
        }
        model.textures = textures;
        model.loaded = data.loaded;
        model.valid = data.valid;
        model.errorMessage = data.errorMessage;
        model.hasBlockstate = data.hasBlockstate;
        model.parent = data.parent;
        model.existsRemote = data.exists;
        model.jsonRemote = data.json;
        return model;
    }

    refresh() {
        return mod.modRegistry.getBlockModel(this.location);
    }
}

module.exports.BlockModel = BlockModel;

//ItemModel
class Item extends IModel{
    /**
     * @type string
     */
    path;

    /**
     * @type {string[]}
     */
    textureLocations = [];

    loaded = false;
    valid = false;
    errorMessage = null;


    /**
     * @type {?string}
     */
    parent;

    /**
     * @type string
     */
    resourcePath;

    /**
     * @param path {string}
     * @param resourcePath {string}
     * @param codename {string}
     */
    constructor(path, resourcePath, codename) {
        super();
        this.resourcePath = resourcePath;
        this.path = path;
        this.codename = codename;
        this.location = new ResourceLocation({
            namespace: codename,
            path: global.path.parse(path).name
        })
    }

    load() {
        try {
            let data = fs.readFileSync(this.path).toString('utf-8');
            let json = JSON.parse(data);

            let textures = [];

            const iterate = (obj) => {
                Object.keys(obj).forEach(key => {
                    if (key === 'textures') {
                        let textureObj = obj[key];
                        for (let key in textureObj) {
                            textures.push({
                                key: key,
                                value: textureObj[key]
                            });
                        }
                    }else if(key === 'parent' && this.parent == null){
                        this.parent = obj[key];
                    }

                    if (typeof obj[key] === 'object') {
                        iterate(obj[key])
                    }
                })
            }

            iterate(json);

            if (textures.length <= 0 && this.parent == null) {
                this.valid = false;
                this.errorMessage = "No textures found and parent is undefined";
            } else {
                this.textureLocations = textures;
                this.valid = true;
            }
        } catch (e) {
            this.valid = false;
            this.errorMessage = e.message;
        }
        this.loaded = true;
        //LOG.debug("Loaded: " + this.name + ": " + this.valid + " - " + this.errorMessage)
    }

    loadTextures() {
        for (let textureLocation of this.textureLocations) {
            let texture = mod.modRegistry.getOrCreateTexture(new Texture(textureLocation.key, textureLocation.value, this.resourcePath));
            texture.hasModel = true;
            this.textures.push(texture);
        }
    }

    get json(){
        if(isMain){
            return fs.readFileSync(this.path,'utf-8');
        }else{
            return this.jsonRemote
        }
    }

    get name() {
        return global.path.parse(this.path).name;
    }

    // * ---------------------------
    serialize(){
        let textures = [];
        for (let texture of this.textures) {
            textures.push(texture.location.location)
        }
        return {
            path: this.path,
            location: this.location,
            textureLocations: this.textureLocations,
            textures: textures,
            loaded: this.loaded,
            valid: this.valid,
            errorMessage: this.errorMessage,
            parent: this.parent,
            resourcePath: this.resourcePath,
            json: this.json
        }
    }

    static deserialize(data){
        let item = new Item(data.path,data.resourcePath, data.location.namespace);
        item.textureLocations = data.textureLocations;
        let textures = [];
        for(let textureLocation of data.textures){
            if(mod.modRegistry.hasTexture(textureLocation)){
                textures.push(mod.modRegistry.getTexture(textureLocation))
            }
        }
        item.textures = textures;
        item.loaded = data.loaded;
        item.valid = data.valid;
        item.errorMessage = data.errorMessage;
        item.parent = data.parent;
        item.jsonRemote = data.json;
        return item;
    }

    refresh() {
        return mod.modRegistry.getItem(this.location);
    }
}

module.exports.Item = Item;

class Texture extends IRegistryEntry{
    /**
     * @type string
     */
    key;

    /**
     * @type string
     */
    resourcePath;

    hasModel = false;

    /**
     * @param key
     * @param id {string | ResourceLocation}
     * @param resourcePath {string}
     */
    constructor(key, id, resourcePath) {
        super();
        this.key = key;
        this.location = new ResourceLocation(id);
        this.resourcePath = resourcePath;
    }

    exists() {
        if(isMain) {
            return fs.existsSync(this.path);
        }else{
            return this.existsRemote;
        }
    }

    get path() {
        return this.location.getTexture(this.resourcePath);
    }

    get name() {
        return global.path.parse(this.path).name;
    }

    get pathOrNull(){
        if(this.exists()){
            return this.path;
        }else{
            return null;
        }
    }

    /**
     * @param callback {function(number, number)}
     */
    size(callback){
        const size = require('image-size');
        size(this.path, (e, r) => {
            if(e){
                callback(-1,-1);
            }else{
                callback(r.width, r.height);
            }
        })
    }

    // * ---------------------------
    serialize(){
        return {
            key: this.key,
            location: this.location,
            resourcePath: this.resourcePath,
            hasModel: this.hasModel,
            exists: this.exists()
        }
    }

    static deserialize(data){
        let texture = new Texture(data.key, data.location, data.resourcePath);
        texture.hasModel = data.hasModel;
        texture.existsRemote = data.exists;
        return texture;
    }

    refresh() {
        return mod.modRegistry.getTexture(this.location);
    }
}

module.exports.Texture = Texture;