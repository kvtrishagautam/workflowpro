"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeRegistry = void 0;
class NodeRegistry {
    constructor() {
        this.nodes = new Map();
    }
    register(node) {
        this.nodes.set(node.type, node);
        console.log(`Registered node type: ${node.type}`);
    }
    get(type) {
        return this.nodes.get(type);
    }
    getAll() {
        return Array.from(this.nodes.values());
    }
}
exports.nodeRegistry = new NodeRegistry();
