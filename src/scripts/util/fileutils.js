class FileUtils{
    /**
     * @param path {string}
     * @return {string[]} paths
     */
    static getFilesInFolder(path){
        let files = [];
        const read = (dir) => {
            for (let file of fs.readdirSync(dir)) {
                if(fs.lstatSync(dir + "/" + file).isDirectory()){
                    read(dir + "/" + file)
                }else{
                    files.push(dir + "/" + file);
                }
            }
        }
        read(path);
        return files;
    }

    /**
     * @param path
     * @return AbstractFileExplorer
     */
    static getFileExplorer(path){
        const e = require('../gui/fileexplorer');
        let explorer = new e.AbstractFileExplorer();
        explorer.parentPath = path;
        const read = (dir, folder = null) => {
            for (let file of fs.readdirSync(dir)) {
                let p = dir + "/" + file;
                if(fs.lstatSync(p).isDirectory()){
                    let folder = new e.Folder(global.path.basename(p), p);
                    explorer.addChild(folder);
                    read(p,folder)
                }else{
                    let file = new e.File(global.path.parse(p).name,p);
                    if(folder != null){
                        folder.addChild(file);
                    }else{
                        explorer.addChild(file);
                    }
                }
            }
        }
        read(path);
        return explorer;
    }

    /**
     * @param list {{path: string, parent: string data: {}}[]} list of texture paths
     * @return AbstractFileExplorer
     */
    static getFileExplorerFromPathList(list){
        const e = require('../gui/fileexplorer');
        let explorer = new e.AbstractFileExplorer();
        //todo explorer.parentPath = path;


        for (let entry of list) {
            let parentPath = FileUtils.normalizePath(entry.parent);
            let filePath = FileUtils.normalizePath(entry.path);
            let relativePath = filePath.replace(parentPath,"");

            let folder = explorer.mkdirs(parentPath, null,relativePath);

            let file = new e.File(global.path.parse(filePath).name,filePath);
            file.data = entry.data;

            if(folder == null){
                explorer.addChild(file);
            }else{
                folder.addChild(file);
            }
        }

        return explorer;
    }

    /**
     * @param folderName {string} e.g 'textures'
     * @param fileType {string} e.g 'texture'
     * @param registry {Map<string, IRegistryEntry>}
     * @param path {"assets", "data"}
     * @param ignoreFolders {...number} folders to ignore
     * @return AbstractFileExplorer
     */
    static getResourceList(folderName, fileType, registry, path = 'assets', ...ignoreFolders){
        const e = require('../gui/fileexplorer');
        let explorer = new e.AbstractFileExplorer();

        /**
         * @type {Object<string, Folder>}
         */
        let folders = {};

        for (let [key, entry] of registry) {
            let file = new e.File(entry.name, entry.path)
            file.data = {
                type: fileType,
                value: entry.location.location
            }
            let folder;

            let locPath = entry.location.path;

            if(entry.location.namespace === mod.codename){
                folder = getOrCreateFolder((path === 'assets' ? mod.assetsPath : mod.dataPath) + "/" + folderName,locPath, null, ...ignoreFolders);
            }else{
                /**
                 * @type {?ModResource}
                 */
                let resource = null;
                for (let key in mod.modResources.resources) {
                    if(entry.location.namespace === key){
                        resource = mod.modResources.resources[key];
                    }
                }

                let entryPath = "";
                let folderName = "errors/"
                let folderPath = folderName;

                if(resource != null){
                    entryPath = (path === 'assets' ? resource.assetsPath : resource.dataPath) + "/" + folderName;
                    if(explorer.parentPath == null){
                        explorer.parentPath = entryPath;
                    }
                    folderName = "resources/"
                    folderPath = folderName + resource.codename + "/";
                    let movedIgnoreFolders = [];
                    for (let num of ignoreFolders) {
                        movedIgnoreFolders.push(num+1)
                    }

                    //create custom folder
                    let resourceFolder = getOrCreateFolder(entryPath, folderName, (name, path) => {
                        return folderName === 'errors/' ? new e.ErrorsFolder(name, path) : new e.ResourceFolder(name, path);
                    },...movedIgnoreFolders);
                    resourceFolder.collapsed = true;

                    //add
                    folder = getOrCreateFolder(entryPath, folderPath + locPath,null,...movedIgnoreFolders);

                }else{
                    LOG.error("Unable to register block: Resource with ID '" + entry.location.namespace + "' not found at '" + entry.location.location + "'");
                }
            }
            if(folder == null){
                explorer.addChild(file);
            }else{
                folder.addChild(file);
            }
        }

        /**
         * @param entryPath {string} /textures folder
         * @param path {string} path from ResourceLocation
         * @param folderCallback {?function(string, string): Folder}
         * @param ignoreFolders {...number}
         * @return Folder
         */
        function getOrCreateFolder(entryPath, path, folderCallback = null, ...ignoreFolders){
            /**
             * @type {?Folder}
             */
            let lastFolder = null;
            let lastString = "";
            let split = path.split("/");
            let i = 0;
            for (let string of split) {
                if(ignoreFolders.includes(i)){
                    continue
                }
                i++;
                if(split.length === i){
                    break;
                }
                let strPath = lastString + "/" + string;
                lastString = strPath;
                let contains = false;
                let folder;
                for (let key in folders) {
                    if(strPath === key){
                        contains = true;
                        folder = folders[key];
                    }
                }

                if(!contains){
                    if(folderCallback == null) {
                        folder = new e.Folder(string, entryPath + strPath);
                    }else{
                        folder = folderCallback(string, entryPath + strPath);
                    }
                    if(lastFolder == null){
                        explorer.addChild(folder);
                    }else{
                        lastFolder.addChild(folder);
                    }
                    folders[strPath] = folder;
                }

                lastFolder = folder;
            }
            return lastFolder;
        }

        return explorer;
    }

    /**
     * @param folderName {string} e.g 'models/item'
     * @param configDataName {string} e.g 'items' (from JSON config)
     * @param path {"assets", "data"}
     * @returns {AbstractFileExplorer}
     */
    static getUnfolderedResourceList(folderName, configDataName, path = 'assets'){
        const e = require('../gui/fileexplorer');
        let explorer = fsutils.getFileExplorer((path === 'assets' ? mod.assetsPath : mod.dataPath) + folderName);
        let oldExplorer = explorer;
        let configData = mod.config.json[configDataName];
        if (configData != null) {
            oldExplorer = e.AbstractFileExplorer.deserialize(configData, null, null);

            //everything on explorer json should be the same as in blocks, just without folders
            //if it isn't remove or add item

            for (let item of oldExplorer.allChilds) {
                if(item instanceof e.File){
                    let contains = false;
                    //folders are disallowed in explorer, show only from main folder
                    for (let file of explorer.childs) {
                        if (file instanceof e.File) {
                            if (file.getName() === item.getName()) {
                                contains = true;
                                break
                            }
                        }
                    }

                    if (contains) {
                        //if does not exists on explorer from directory, remove
                        if(item.parent == null){
                            oldExplorer.removeChild(item)
                        }else{
                            item.parent.removeChild(item);
                        }
                    }

                }
            }

            for (let file of explorer.childs) {
                if (file instanceof e.File) {
                    let contains = false;

                    for (let item of oldExplorer.allChilds) {
                        if(item instanceof e.File){
                            if (item.getName() === file.getName()) {
                                contains = true;
                                break;
                            }
                        }
                    }

                    if (!contains) {
                        //if does not exists on explorer from JSON, but exists on normal, add
                        oldExplorer.addChild(file);
                    }
                }
            }
        }
        //save to JSON
        mod.config.json[configDataName] = oldExplorer.serialize();
        mod.config.markDirty();
        return oldExplorer;
    }
    /**
     * @param pathStr {string}
     * @return {string}
     */
    static normalizePath(pathStr){
        let p = path.normalize(pathStr);
        let path_regex = /\/\//;
        p = p.replace(/\\/g, "/");
        while (p.match(path_regex)) {
            p = p.replace(path_regex, "/");
        }
        return p;
    }
}

module.exports = FileUtils