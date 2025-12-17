"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseNode = void 0;
class BaseNode {
    constructor(id, name, type, properties = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.properties = properties;
    }
    execute(input) {
        throw new Error("Execute method not implemented.");
    }
    validate() {
        // Basic validation logic can be implemented here
        return true;
    }
}
exports.BaseNode = BaseNode;
