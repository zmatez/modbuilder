class Config{
    json = {
        theme: "light",
        mods: [

        ]
    };

    /**
     * @type string
     */
    path;

    /**
     * @type string
     */
    filePath;

    newlyCreated = false;
    loaded = false;
    saved = false;

    /**
     * @type {{ModData}}
     */
    modData = {};

    constructor() {
        global.LOG.progress("Loading Config...");

        this.path = process.env.APPDATA;
        if(this.path == null || this.path === ""){
            this.path = process.env.HOME;
        }
        this.path +=  "/matez/modbuilder";
        this.filePath = this.path + "/config.json";
    }

    exists(callback) {
        fs.exists(this.filePath,callback);
    }

    load() {
        this.exists((v) => {
            if(!v){
                //create new
                fs.mkdir(this.path,(err) => {
                    if (err) {
                        return;
                    }
                    global.LOG.log("Created config directory.");
                });
                fs.writeFile(this.filePath,JSON.stringify(this.json,null,2),() => {

                });
                this.newlyCreated = true;
            }

            fs.readFile(this.filePath, 'utf-8',(err, data) => {
                if(err){
                    throw err;
                }

                this.json = JSON.parse(data);
                this.saved = true;

                this.onLoad();

                this.loaded = true;

                global.LOG.success("Loaded config: " + this.filePath);
            })
        });
    }

    onLoad(){
        if(this.json.mods != null){
            this.json.mods.forEach((path) => {
                this.loadModData(path);
            })
        }
    }

    save(callback){
        global.LOG.progress("Saving config...");

        this.exists((v) => {
            if(!v){
                //create new
                fs.mkdir(this.path,(err) => {
                    if (err) {
                        return;
                    }
                    global.LOG.log("Created config directory.");
                });
                this.newlyCreated = true;
            }
        });

        fs.writeFile(this.filePath,JSON.stringify(this.json,null,2),() => {
            global.LOG.success("Saved config settings.");
            this.saved = true;

            let loading = 0;
            let loaded = 0;

            let saves = [];

            for (let key in this.modData) {
                let value = this.modData[key];
                loading++;
                saves.push((callback) => {
                    value.save(callback);
                })
            }

            LOG.progress("Saving " + loading + " mods...")

            for (let func of saves) {
                func(() => {
                    loaded++;

                    if(loading === loaded){
                        LOG.success("Saved all mods")
                        callback();
                    }
                })
            }
        });
    }

    /**
     * @param path {string}
     * @param name {string}
     * @param codename {string}
     * @param callback {function(ModData)}
     */
    createModData(path, name, codename, callback){
        let data = new ModData(path);
        data.config = this;
        data.create(name, codename, () => {
            LOG.debug("Created mod data of " + data.name);
            this.modData[data.name] = data;
            this.json.mods.push(path);
            this.markDirty();
            callback(data);
        });
    }


    /**
     * @param path {string}
     * @param callback {function(ModData)}
     */
    importModData(path, callback){
        this.loadModData(path, (modData) => {
            this.json.mods.push(path);
            this.markDirty();
            callback(modData);
        })
    }

    /**
     * @param path {string}
     * @param callback {function(ModData) | null}
     */
    loadModData(path, callback = null){
        let data = new ModData(path);
        data.config = this;
        data.load((success) => {
            if(success){
                LOG.debug("Loaded mod data of " + data.name);
                this.modData[data.name] = data;
                if(callback != null){
                    callback(data);
                }
            }else{
                LOG.error("Unable to load mod data of " + data.name);
            }
        });
    }

    removeModData(path){
        //todo fix delete
        path = global.path.normalize(path);
        LOG.debug("Deleting " + path)
        delete this.modData[path];
        const index = this.json.mods.indexOf(path);
        if (index > -1) {
            this.json.mods.splice(index, 1);
        }
        this.markDirty()
    }

    markDirty(){
        this.saved = false;
    }
}

exports.config = new Config();

class ModData{
    /**
     * @private
     */
    static fileName = "modbuilder.json"

    /**
     * @type Config
     */
    config;

    path;
    json;

    loaded = false;
    saved = false;

    //---------------
    /**
     * @type string
     */
    name;
    /**
     * @type string
     */
    codename;

    constructor(path) {
        this.path = path;
    }

    create(name, codename, callback){
        this.name = name;
        this.codename = codename;

        fs.writeFile(this.path + "/" + ModData.fileName, JSON.stringify(this.json,null,2), (err) => {
            if(!err){
                LOG.debug("Created data file for mod: " + codename);

                this.json = {
                    name: name,
                    codename: codename,
                    blockstates: null,
                    items: null,
                    resources: null
                }

                this.loaded = true;
                this.saved = true;
                callback();
            }else{
                LOG.error("Unable to create mod data for " + this.codename)
            }
        });
    }

    /**
     * @param callback {function(boolean)}
     */
    load(callback){
        fs.readFile(this.path + "/" + ModData.fileName, 'utf-8',(err, data) => {
            if(err || data.length <= 0){
                //not found
                callback(false);
            }else{
                //found
                this.json = JSON.parse(data);

                //! FIXES FOR JSON
                {
                    if(!this.json.hasOwnProperty('blockstates')){
                        this.json.blockstates = null;
                    }
                    if(!this.json.hasOwnProperty('items')){
                        this.json.items = null;
                    }
                    if(!this.json.hasOwnProperty('resources')){
                        this.json.resources = null;
                    }
                }


                this.name = this.json.name;
                this.codename = this.json.codename;

                this.loaded = true;
                this.saved = true;
                callback(true);
            }
        })
    }

    save(callback){
        fs.writeFile(this.path + "/" + ModData.fileName, JSON.stringify(this.json,null,2), () => {
            LOG.success("Saved mod file of " + this.codename);
            this.loaded = true;
            this.saved = true;
            callback();
        });
    }

    markDirty(){
        this.saved = false;
        this.config.markDirty();
    }
}