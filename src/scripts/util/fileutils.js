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
     * @return AbstractFileExplorer
     */
    static getTextureList(){
        const e = require('../gui/fileexplorer');
        let explorer = new e.AbstractFileExplorer();

        /**
         * @type {Object<string, Folder>}
         */
        let folders = {};

        for (let [key, texture] of mod.modRegistry.textures) {
            let file = new e.File(texture.name, texture.path)
            file.data = {
                type: 'texture',
                value: texture.location.location
            }
            let folder;
            if(texture.location.namespace === mod.codename){
                folder = getOrCreateFolder(mod.assetsPath + "textures",texture.location.path);

                if(folder == null){
                    explorer.addChild(file);
                }else{
                    folder.addChild(file);
                }
            }else{
                /**
                 * @type {?ModResource}
                 */
                let resource = null;
                for (let key in mod.modResources.resources) {
                    if(texture.location.namespace === key){
                        resource = mod.modResources.resources[key];
                    }
                }

                let texturesPath = "";
                let folderPath = "error/";

                if(resource != null){
                    texturesPath = resource.assetsPath + "/textures";
                    folderPath = "resources/" + resource.codename + "/";

                    //create custom folder
                    let resourceFolder = getOrCreateFolder(texturesPath, "resources/", (name, path) => {
                        return new e.ResourceFolder(name, path);
                    });
                    resourceFolder.collapsed = true;

                    //add
                    folder = getOrCreateFolder(texturesPath, folderPath + texture.location.path);

                    if(folder == null){
                        explorer.addChild(file);
                    }else{
                        folder.addChild(file);
                    }
                }else{

                }
            }
        }

        /**
         * @param texturesPath {string} /textures folder
         * @param path {string} path from ResourceLocation
         * @param folderCallback {?function(string, string): Folder}
         * @return Folder
         */
        function getOrCreateFolder(texturesPath, path, folderCallback = null){
            /**
             * @type {?Folder}
             */
            let lastFolder = null;
            let lastString = "";
            let split = path.split("/");
            let i = 0;
            for (let string of split) {
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
                        folder = new e.Folder(string, texturesPath + strPath);
                    }else{
                        folder = folderCallback(string, texturesPath + strPath);
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