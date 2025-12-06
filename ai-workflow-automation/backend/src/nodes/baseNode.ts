export class BaseNode {
    id: string;
    name: string;
    type: string;
    properties: Record<string, any>;

    constructor(id: string, name: string, type: string, properties: Record<string, any> = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.properties = properties;
    }

    execute(input: any): any {
        throw new Error("Execute method not implemented.");
    }

    validate(): boolean {
        // Basic validation logic can be implemented here
        return true;
    }
}