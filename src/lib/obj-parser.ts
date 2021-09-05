import { Group } from "./shapes/group";
import { SmoothTriangle } from "./shapes/primitives/smooth-triangle";
import { Triangle } from "./shapes/primitives/triangle";
import { point, Tuple, vector } from './tuples'

export class ObjParser {
    ignoredLines = 0;
    vertices: Tuple[] = [];
    normals: Tuple[] = [];
    groups: { [groupName: string]: Group } = {};
    model: Group = new Group();

    private activeGroup = this.model;

    constructor() {
    }

    parse(data: string): Group {
        data.split('\n').forEach(cmd => this.parseLine(cmd));

        this.model.divide(4);
        return this.model;
    }

    private parseLine(command: string): void {
        const params = command.trim().replace(/\s\s+/g, ' ').split(' ');

        if(params.length === 4 && params[0] === ('v')) {
            this.vertices.push(point(
                Number.parseFloat(params[1]), 
                Number.parseFloat(params[2]), 
                Number.parseFloat(params[3])
            ));
        } else if(params.length === 4 && params[0] === ('vn')) {
            this.normals.push(vector(
                Number.parseFloat(params[1]), 
                Number.parseFloat(params[2]), 
                Number.parseFloat(params[3])
            ));
        } else if(params.length > 3 && params[0] === ('f')) {
            const p = params.slice(1).map(s => s.split('/').map(n => Number.parseInt(n)));
            
            for(let i = 1; i < p.length - 1; i++) {
                if(p[i].length == 1) {
                    this.activeGroup.add(new Triangle(
                        this.vertices[p[0][0] - 1],
                        this.vertices[p[i][0] - 1],
                        this.vertices[p[i + 1][0] - 1])
                    );
                } else if(p[i].length == 3){
                    this.activeGroup.add(new SmoothTriangle(
                        this.vertices[p[0][0] - 1],
                        this.vertices[p[i][0] - 1],
                        this.vertices[p[i + 1][0] - 1],
                        this.normals[p[0][2] - 1],
                        this.normals[p[i][2] - 1],
                        this.normals[p[i + 1][2] - 1])
                    );
                }
            }
        } else if(params.length === 2 && params[0] === ('g')) {
            this.groups[params[1]] = new Group();
            this.activeGroup = this.groups[params[1]];
            this.model.add(this.activeGroup);
        } else {
            this.ignoredLines++;
        }
    }
}