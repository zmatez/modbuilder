class FileOperator{
    /**
     * @type AbstractFileExplorer
     * @private
     */
    explorer;

    /**
     * @type MainController
     * @private
     */
    controller;

    /**
     * @param explorer {AbstractFileExplorer}
     * @param controller {MainController}
     */
    constructor(explorer, controller) {
        this.explorer = explorer;
        this.controller = controller;

        this.registerEvents();
    }

    /**
     * @private
     * @param id {number}
     * @param data
     */
    sendResponse(id, data){
        this.controller.sendMessage('fileop:response', {
            id: id,
            data: data
        })
    }

    /**
     * @private
     */
    registerEvents(){
        this.controller.receive('fileop:create',(event, data) => {
            this.create(data)
        })
        this.controller.receive('fileop:move',(event, data) => {
            this.move(data)
        })
    }


    //!-----------------------------------------------------------------------------------------------------------------
    /**
     * @param data {{}}
     */
    create(data){
        let path = global.path;

        let id = data.id;
        let fPath = data.path;
        let content = data.content;
        let isFile = data.isFile;
        console.log("Creating at " + this.explorer.parentPath + "(" + id + ")")

        try {
            LOG.debug("Trying to create file/folder at " + fPath)
            if (isFile) {
                fs.writeFileSync(fPath, content == null ? "" : content, {encoding: "utf-8"});
                LOG.log("Created file at " + fPath);
            } else {
                fs.mkdirSync(fPath);
                LOG.log("Created folder at " + fPath);
            }

            this.sendResponse(id, {
                success: true,
                location: fPath
            })
        }catch (e){
            LOG.error("Unable to create file/folder at " + fPath + ": " + e.message);
            this.sendResponse(id, {
                success: false,
                message: e.message
            })
        }
    }
    /**
     * @param data {{}}
     */
    move(data){
        let path = global.path;
        let id = data.id;
        let file = data.file;
        let dir = data.dir;

        if(path.existsSync(file) && path.existsSync(dir) && fs.lstatSync(dir).isDirectory()){
            let fileName = path.parse(file).base;

            try{
                move(file,dir + "/" + fileName,(e) => {
                    //success
                    if(!e){
                        this.sendResponse(id, {
                            success: true,
                            location: dir + "/" + fileName
                        })
                    }else{
                        this.sendResponse(id, {
                            success: false,
                            message: "Unable to move."
                        })
                    }
                })
            }catch (e){
                this.sendResponse(id, {
                    success: false,
                    message: e.message
                })
            }
        }else{
            //return error
            this.sendResponse(id, {
                success: false,
                message: "Path does not exists or is not a directory."
            })
        }
    }
}

class FileOperatorRemote{
    /**
     * @type AbstractFileExplorer
     * @private
     */
    explorer;

    /**
     * @type RendererController
     * @private
     */
    controller;

    /**
     * @type {Operation[]}
     * @private
     */
    operations = [];

    /**
     * @type {number}
     * @private
     */
    static id = 0;

    /**
     * @param explorer {AbstractFileExplorer}
     * @param controller {RendererController}
     */
    constructor(explorer, controller) {
        this.explorer = explorer;
        this.controller = controller;

        this.registerEvents();
    }

    /**
     * @private
     */
    registerEvents(){
        this.controller.receive('fileop:response', (data) => {
            let id = data.id;
            for (let operation of this.operations) {
                if(operation.id === id){
                    operation.callback(data.data);
                    utils.removeFromArray(this.operations,operation);
                    break;
                }
            }
        })
    }

    /**
     * @param callback {function(data)}
     * @return Operation
     * @private
     */
    makeOperation(callback){
        let id = ++FileOperatorRemote.id;
        let operation = new Operation(id, callback);
        this.operations.push(operation);
        return operation;
    }

    //!-----------------------------------------------------------------------------------------------------------------

    /**
     * @param path {string}
     * @param content {string | null}
     * @param isFile {boolean}
     * @param callback {function(data)}
     */
    create(path, content = null, isFile = true, callback = null){
        console.log("Creating at " + this.explorer.parentPath)
        let operation = this.makeOperation((data) => {
            if(callback != null){
                callback(data);
            }
        })
        this.controller.sendMessage('fileop:create', {
            id: operation.id,
            path: path,
            content: content,
            isFile: isFile
        });
    }

    /**
     * @param f {string} file path
     * @param dir {string} directory path
     * @param callback {function(boolean, string)} success, new file path/error
     */
    move(f, dir, callback){
        let operation = this.makeOperation((data) => {
            if(data.success){
                //success
            }else{
                //fail

            }
        })
        this.controller.sendMessage('fileop:move', {
            id: operation.id,
            file: f,
            directory: dir
        });
    }
}

class Operation{
    /**
     * @type number
     */
    id;
    /**
     * @type {function(data)}
     */
    callback;

    /**
     * @param id {number}
     * @param callback {function(data)}
     */
    constructor(id, callback) {
        this.id = id;
        this.callback = callback;
    }
}

function move(oldPath, newPath, callback) {
    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            } else {
                callback(err);
            }
            return;
        }
        callback();
    });

    function copy() {
        let readStream = fs.createReadStream(oldPath);
        let writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);

        readStream.on('close', function () {
            fs.unlink(oldPath, callback);
        });

        readStream.pipe(writeStream);
    }
}

module.exports.FileOperator = FileOperator;
module.exports.FileOperatorRemote = FileOperatorRemote;