const assets = require('./assets');

class ModResources{
    /**
     * @type ModData
     */
    modData;

    /**
     * @type {Object.<string, ModResource>}
     */
    resources = {};

    needsReload = false;

    /**
     * @param modData {ModData}
     */
    constructor(modData) {
        this.modData = modData;
    }

    load(){
        LOG.progress("Loading resources");
        let resources = 0;
        if(this.modData.json.resources != null){
            for (let key in this.modData.json.resources) {
                let data = this.modData.json.resources[key];
                let resource = new ModResource(data.codename, data.path);
                resource.load();
                this.resources[resource.codename] = resource;
                resources++;
            }
        }
        this.needsReload = false;
        LOG.success("Loaded " + resources + " resources")
    }

    save(){
        this.modData.json.resources = this.resources;
        this.modData.markDirty();
    }

    /**
     * @param resource {ModResource}
     */
    addResource(resource){
        this.resources[resource.codename] = resource;
        this.save();
        this.needsReload = true;
    }

    /**
     * @param codename {string}
     */
    removeResource(codename){
        delete this.resources[codename];
        this.save();
    }

    get count(){
        return Object.keys(this.resources).length;
    }
}

module.exports.ModResources = ModResources;

class ModResource{
    /**
     * @type string
     */
    codename;
    /**
     * @type string
     */
    path;

    valid = false;

    /**
     * @param codename {?string}
     * @param path {string}
     */
    constructor(codename, path) {
        this.codename = codename;
        this.path = path;
    }

    /**
     * @return boolean
     */
    load(){
        if(fs.existsSync(this.path)){
            let dir = fs.readdirSync(this.path);
            if(dir.includes('data') && dir.includes('assets')){
                this.valid = true;
                return true;
            }
        }
        return false;
    }

    /**
     * @return {Block[]}
     */
    loadBlocks(){
        LOG.progress("Loading blocks for " + this.codename);
        let count = 0;
        let blocks = [];
        const files = fsutils.getFilesInFolder(this.assetsPath + "/blockstates");
        for (let file of files) {
            let block = mod.modRegistry.getOrCreateBlock(new assets.Block(file, this.path, this.codename));
            block.load();
            count++;
            blocks.push(block);
        }
        LOG.success("Loaded " + count + " blocks for " + this.codename);
        return blocks;
    }

    /**
     * @return {Item[]}
     */
    loadItems(){
        LOG.progress("Loading items for " + this.codename);
        let count = 0;
        let items = [];
        const files = fsutils.getFilesInFolder(this.assetsPath + "/models/item");
        for (let file of files) {
            let item = mod.modRegistry.getOrCreateItem(new assets.Item(file, this.path, this.codename));
            item.load();
            count++;
            items.push(item);
        }
        LOG.success("Loaded " + count + " items for " + this.codename);
        return items;
    }

    /**
     * @return boolean
     */
    loadCodename(){
        if(this.valid){
            try{
                let folder = fs.readdirSync(this.path + "/assets/")[0];
                if(folder != null){
                    this.codename = folder;
                    return true;
                }
            }catch (e){
                return false;
            }
        }
        return false;
    }

    get assetsPath(){
        return this.path + "/assets/" + this.codename;
    }

    get dataPath(){
        return this.path + "/data/" + this.codename;
    }
}

module.exports.ModResource = ModResource;
