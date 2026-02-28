export var Size;
(function (Size) {
    Size[Size["small"] = 27] = "small";
    Size[Size["large"] = 54] = "large";
    Size[Size["extra"] = 117] = "extra";
    Size[Size["piano"] = 48] = "piano";
})(Size || (Size = {}));
export class Page {
    constructor(btnWithIdx, options = {}) {
        this.btnWithIdx = btnWithIdx;
        Object.assign(this, options);
    }
}
