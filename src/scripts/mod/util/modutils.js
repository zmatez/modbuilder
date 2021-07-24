class ModUtils {
    /**
     * @param title {string}
     * @param createCallback {function(HTMLElement)}
     * @param parent {HTMLElement}
     * @param classes {string}
     */
    static createRegistrySection(title, createCallback, parent, ...classes){
        let section = document.createElement('div');
        section.classList.add("content-section", ...classes);
        // * HEADER
        let header = document.createElement('h2');
        header.innerHTML = title;
        utils.addChild(section, header);

        createCallback(section);

        utils.addChild(parent, section);

        return section;
    }

    /**
     * @param title {string}
     * @param createCallback {function(HTMLElement)}
     * @param parent {HTMLElement}
     * @param classes {string}
     */
    static createPropertySection(title, createCallback, parent, ...classes){
        let section = document.createElement('div');
        section.classList.add('property-entry', ...classes);

        let header = document.createElement('div');
        header.classList.add('property-title');
        header.innerHTML = title;

        let content = document.createElement('div');
        content.classList.add('property-content');
        createCallback(content);

        utils.addChild(section, header, content);
        utils.addChild(parent, section);


        return section;
    }
}

module.exports.ModUtils = ModUtils;

class ResourceLocation {
    /**
     * @type string
     */
    namespace;
    /**
     * @type string
     */
    path;

    /**
     * @param location {string | {namespace: string, path: string} | ResourceLocation}
     */
    constructor(location) {
        if (typeof location === "string") {
            if (location.includes(':')) {
                this.namespace = location.substring(0, location.indexOf(':'));
                this.path = location.substring(location.indexOf(':') + 1, location.length);
            } else {
                this.namespace = 'minecraft';
                this.path = location;
            }
        }else{
            this.namespace = location.namespace;
            this.path = location.path;
        }
    }

    get location() {
        return this.namespace + ":" + this.path;
    }

    /**
     * @param folderName {string} e.g. models/block
     * @param resourcePath {string}
     * @return string | null
     */
    getAsset(folderName, resourcePath) {
        return resourcePath + "/assets/" + this.namespace + "/" + folderName + "/" + this.path;
    }

    /**
     * @param resourcePath {string}
     * @return {string|null}
     */
    getModel(resourcePath) {
        return this.getAsset('models', resourcePath) + ".json";
    }

    /**
     * @param resourcePath {string}
     * @return {string|null}
     */
    getTexture(resourcePath) {
        return this.getAsset('textures', resourcePath) + ".png";
    }

    /**
     * @param location {ResourceLocation}
     * @return boolean identical
     */
    compare(location) {
        return location.location === this.location;
    }
}

module.exports.ResourceLocation = ResourceLocation;