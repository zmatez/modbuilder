const toml = require('@iarna/toml');
const assets = require('./resource/assets');
const resources = require('./resource/resources');

class IMod{
    /**
     * @type ModData
     */
    config;

    /**
     * @type ModRegistry
     */
    modRegistry;

    /**
     * @type ModResources
     */
    modResources;

    /**
     * @param config {ModData}
     * @param transferCallback {function(string)} used to transfer registry client<->server
     */
    constructor(config,transferCallback) {
        this.config = config;
        this.modRegistry = new assets.ModRegistry(transferCallback);
        this.modResources = new resources.ModResources(config);
    }

    get name(){
        return this.config.name;
    }

    get codename(){
        return this.config.codename;
    }

    get path(){
        return this.config.path;
    }

    //----------------------------
    get assetsPath() {
        return this.path + "/assets/" + this.codename + "/";
    }
    get dataPath() {
        return this.path + "/data/" + this.codename + "/";
    }
    get blockStatePath() {
        return this.assetsPath + "blockstates/";
    }

    // * -----------------------
    serialize(){
        return {
            config: config,
        }
    }

    static deserialize(data, transferCallback){
        return new IMod(data.config, transferCallback);
    }
}

module.exports.IMod = IMod;

class Mod extends IMod{
    tomlPath;
    /**
     * @type TOMLConfig
     */
    tomlConfig;

    /**
     * @type ModAssetLoader
     */
    assetLoader;

    /**
     * @type ModLoadingProgress
     */
    modLoadingProgress;

    // ? callbacks
    /**
     * @type function(data)
     */
    responseCallback;
    /**
     * @type function
     */
    callbackTOML;
    /**
     * @tyoe function
     */
    callbackAssets;

    /**
     * @param config {ModData}
     * @param transferCallback {function(string)} used to transfer registry client<->server
     * @param controller {MainController}
     */
    constructor(config, transferCallback, controller) {
        super(config,transferCallback);
        this.tomlPath = this.path + "/META-INF/mods.toml";

        this.assetLoader = new assets.ModAssetLoader(this,controller);
    }

    /**
     * @param responseCallback {function(data)}
     * @param callbackTOML {function}
     * @param callbackAssets {function}
     */
    setup(responseCallback, callbackTOML, callbackAssets){
        this.responseCallback = responseCallback;
        this.callbackTOML = callbackTOML;
        this.callbackAssets = callbackAssets;
    }


    load(){
        this.modLoadingProgress = new ModLoadingProgress(this.responseCallback);
        this.modLoadingProgress.register('mod_data');
        this.modLoadingProgress.register('resources');
        this.modLoadingProgress.register('blockstates');
        this.modLoadingProgress.register('models_block');
        this.modLoadingProgress.register('models_item');
        this.modLoadingProgress.register('textures');
        this.modLoadingProgress.register('render');

        this.readTOML((config) => {
            this.tomlConfig = config;
            this.modLoadingProgress.update('mod_data')
            this.callbackTOML();

            setTimeout(() => {
                this.modResources.load();
                this.modLoadingProgress.update('resources', this.modResources.count);
                setTimeout(() => {
                    this.assetLoader.load(() => {
                        this.callbackAssets();
                    })
                },250)
            },250)
        })
    }

    /**
     * @param callback {function(TOMLConfig)}
     */
    readTOML(callback){
        fs.readFile(this.tomlPath,'utf-8',(err, data) => {
            if(err){
                callback(null);
            }else{
                let file = toml.parse(data);
                let config = new TOMLConfig();
                config.modLoader = file['modLoader'];
                config.loaderVersion = file['loaderVersion'];
                config.issueTrackerURL = file['issueTrackerURL'];
                let mod = file['mods'][0];
                config.modId = mod['modid'];
                config.version = mod['version'];
                config.displayName = mod['displayName'];
                config.updateJSONURL = mod['updateJSONURL'];
                config.displayURL = mod['displayURL'];
                config.logoFile = mod['logoFile'];
                config.credits = mod['credits'];
                config.authors = mod['authors'];
                config.description = mod['description'];
                callback(config);
            }
        })
    }

    /**
     * @param config {TOMLConfig}
     * @param callback {function(boolean)}
     */
    writeTOML(config, callback){
        const save = (newConfig) => {
            if(newConfig != null){
                let string = toml.stringify(newConfig);
                fs.writeFile(this.tomlPath,string,'utf-8',() => {
                    callback(true);
                })
            }else{
                callback(false);
            }
        }

        fs.readFile(this.tomlPath,'utf-8',(err, data) => {
            if(err){
                save(null);
            }else{
                let file = toml.parse(data);
                file['modLoader'] = config.modLoader;
                file['loaderVersion'] = config.loaderVersion;
                file['issueTrackerURL'] = config.issueTrackerURL;
                let mod = file['mods'][0];
                mod['modid'] = config.modId;
                mod['version'] = config.version;
                mod['displayName'] = config.displayName;
                mod['updateJSONURL'] = config.updateJSONURL;
                mod['displayURL'] = config.displayURL;
                mod['logoFile'] = config.logoFile;
                mod['credits'] = config.credits;
                mod['authors'] = config.authors;
                mod['description'] = config.description;
                save(file);
            }
        })
    }

    serialize() {
        return {
            config: this.config,
            tomlConfig: this.tomlConfig,
            assetLoader: this.assetLoader.serialize()
        }
    }

    static deserialize(data, transferCallback, controller) {
        let mod = new Mod(data.config, transferCallback, controller);
        mod.tomlConfig = data.tomlConfig;
        mod.assetLoader = assets.ModAssetLoader.deserialize(data.assetLoader, mod, controller);
        return mod;
    }
}

module.exports.Mod = Mod;

class TOMLConfig{
    modLoader;
    loaderVersion;
    issueTrackerURL;
    modId;//it is the same as codename is
    version;
    displayName;
    updateJSONURL;
    displayURL;
    logoFile;
    credits;
    authors;
    description;
}

class ModLoadingProgress{
    /**
     * @type {function(data: {})}
     */
    callback;

    progress = {};

    /**
     * @param callback {function(data: {})}
     */
    constructor(callback) {
        this.callback = callback;
    }

    register(name, value = false){
        this.progress[name] = {
            value: value,
            info: null
        };
    }

    pop(){
        this.send();
    }

    update(name, info = null, value = true){
        this.progress[name].value = value;
        this.progress[name].info = info;
        this.send(info);
    }

    /**
     * @private
     */
    send(info = null){
        let loaded = true;
        for (let key in this.progress) {
            if(!this.progress[key].value){
                loaded = false;
                break;
            }
        }

        this.callback({
            progress: this.progress,
            info: info,
            loaded: loaded
        });
    }
}

//--------------------------------------------------
