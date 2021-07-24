class ModelData{
    /**
     * @type {BlockModel}
     */
    model;

    // # -----------------------
    /**
     * Whether to use ambient occlusion (true - default), or not (false)
     * @type boolean
     */
    ambientOcclusion;

    /**
     * Holds the different places where item models are displayed
     * @type {MDisplay[]}
     */
    display;
    // # -----------------------

    /**
     * @param model {BlockModel}
     */
    constructor(model) {
        this.model = model;
    }

    read(){
        let json = this.model.json;

        this.ambientOcclusion = json['ambientocclusion'];
        if(json.hasOwnProperty('display')){
            for (let [key, value] in json['display']) {
                let display = MDisplay.fromJSON(key, value);
                this.display.push(display);
            }
        }
        //textures - in model


    }

    /**
     * @returns {IModel|null}
     */
    get parent(){
        return this.model.findParent();
    }
}

// ! -------------------------------------------------------------------------------------------------------------------
class MDisplay{
    /**
     * Place where an item model is displayed.
     * Holds its rotation, translation and scale for the specified situation.
     * fixed refers to item frames, while the rest are as their name states.
     * Note that translations are applied to the model before rotations.
     * @type {"thirdperson_righthand","thirdperson_lefthand", "firstperson_righthand", "firstperson_lefthand", "gui", "head", "ground", "fixed"}
     */
    position;

    /**
     * Specifies the rotation of the model according to the scheme [x, y, z].
     * @type {?number[]}
     */
    rotation;

    /**
     * Specifies the position of the model according to the scheme [x, y, z]. The values are clamped between -80 and 80.
     * @type {?number[]}
     */
    translation;

    /**
     * Specifies the scale of the model according to the scheme [x, y, z]. If the value is greater than 4, it is displayed as 4.
     * @type {?number[]}
     */
    scale;

    static fromJSON(name, json){
        let display = new MDisplay();
        display.position = name;
        display.rotation = json['rotation'];
        display.translation = json['translation'];
        display.scale = json['scale'];

        return display;
    }
}

class MElement{
    from;
    to;
    rotation;
    shade;
    faces;

}

class MElementRotation{
    origin;
    axis;
    angle;
    rescale;
}

class MFace{
    /**
     * Defines the area of the texture to use according to the scheme [x1, y1, x2, y2].
     * If unset, it defaults to values equal to xyz position of the element.
     * The texture behavior is inconsistent if UV extends below 0 or above 16.
     * If the numbers of x1 and x2 are swapped (e.g. from 0, 0, 16, 16 to 16, 0, 0, 16), the texture flips.
     * UV is optional, and if not supplied it automatically generates based on the element's position.
     * @type MUV
     */
    uv;
    /**
     * Specifies the texture in form of the texture variable prepended with a #.
     * @type string
     */
    texture;
    /**
     * Specifies whether a face does not need to be rendered when there is a block touching it in the specified position.
     * The position can be: down, up, north, south, west, or east.
     * It also determines the side of the block to use the light level from for lighting the face, and if unset, defaults to the side.
     * bottom may also be used in the latest versions instead of down, despite appearing only once in the actual game assets.
     * @type {"down", "up", "north", "south", "east", "west"}
     */
    cullface;
    /**
     * Rotates the texture by the specified number of degrees.
     * Can be 0, 90, 180, or 270. Defaults to 0. Rotation does not affect which part of the texture is used.
     * Instead, it amounts to permutation of the selected texture vertexes (selected implicitly, or explicitly though uv).
     * @type number
     */
    rotation;
    /**
     * Determines whether to tint the texture using a hardcoded tint index. The default value, -1, indicates not to use the tint.
     * Any other number is provided to BlockColors to get the tint value corresponding to that index.
     * However, most blocks do not have a tint value defined (in which case white is used).
     * Furthermore, no vanilla block currently uses multiple tint values, and thus the tint index value is ignored (as long as it is set to something other than -1);
     * it could be used for modded blocks that need multiple distinct tint values in the same block though.
     * @type number
     */
    tintindex;
}

class MUV{
    x1;
    z1;
    x2;
    z2;
}