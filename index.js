/*
Unfolded cube assumed to look like this:
        ....
        ....
        ....
        ....
............
............
............
............
        ........
        ........
        ........
        ........

Face numbers are 0-5, starting at the top, going left to right, like this:
  0
123
  45

Orientation of the faces must match the orientation shown above. Up is relative to each face after 
folded into a cube.
*/


const [RIGHT, DOWN, LEFT, UP] = [0, 1, 2 ,3];

// Each node is a point in the cube.
class Node{
    face; // Which face of the cube
    x; // X relative to that face
    y; // Y relative to that face
    visited; // Does it contain a rock?
    up; // Node above it
    down; // Node below it
    left; // Node to the left
    right; // Node to the right

    constructor(face, x, y){
        this.face = face;
        this.x = x;
        this.y = y;
        this.visited = false;
    }

    toString = () => `[${this.face},${this.x},${this.y}]`;
}

class Cube{
    nodes;
    currentNode;
    width;

    constructor(faceWidth){
        this.width = faceWidth;
        this.nodes = [];
        this.createNodes(faceWidth);
    }

    // Returns a set of strings representing visited nodes in order
    solve = () => {
        let startingNode = this.nodes[0][0][0];
        let stackedNodes = [{
            node: startingNode,
            visitedNodes: new Set()
        }];

        // while there are still possible paths to check
        while (stackedNodes.length > 0){
            // get a path and add to visited
            let current = stackedNodes.pop();
            current.visitedNodes.add(current.node.toString());

            // What are all the possible places the knight could move to?
            let possibleLocations = {
                upRight: this.moveKnight(current.node, UP, RIGHT),
                upLeft: this.moveKnight(current.node, UP, LEFT),
                downRight: this.moveKnight(current.node, DOWN, RIGHT),
                downLeft: this.moveKnight(current.node, DOWN, LEFT),
                rightUp: this.moveKnight(current.node, RIGHT, UP),
                rightDown: this.moveKnight(current.node, RIGHT, DOWN),
                leftUp: this.moveKnight(current.node, LEFT, UP),
                leftDown: this.moveKnight(current.node, LEFT, DOWN)
            }

            // This was a potential win condition. Only possible with certain sized cubes
            const isOneMoveAway = () => {
                Object.values(possibleLocations).forEach(location => {
                    if (location.toString() == startingNode.toString())
                        return true;
                });
                return false;
            }

            // Win condition
            let winningSize = 6 * this.width * this.width;
            if (current.visitedNodes.size == winningSize && (this.width % 2 == 1 || isOneMoveAway())){ // only check is one move away if even
                return current.visitedNodes;
            }

            // If they haven't been visited on this path, add to stack
            Object.values(possibleLocations).forEach(location => {
                if (!current.visitedNodes.has(location.toString())){
                    stackedNodes.push({
                        node: location, 
                        visitedNodes: new Set(current.visitedNodes)
                    })
                }    
            })
            
        }

        console.log('No solution found.');
    }

    // Creates all the nodes, each representing one square on the face of the cube
    createNodes = (faceWidth) => {
        for (let face = 0; face < 6; face++){
            const currentFace = [];
            for (let row = 0; row < faceWidth; row++){
                const currentRow = [];
                for (let col = 0; col < faceWidth; col++){
                    currentRow.push(new Node(face, row, col))
                }
                currentFace.push(currentRow);
            }
            this.nodes.push(currentFace);
        }

        this.nodes.forEach(face => {
            face.forEach(row => {
                row.forEach(node => {
                    // Conditions to determine interior nodes only
                    if (this.isInteriorNode(node, faceWidth)){
                        node.up = this.nodes[node.face][node.x - 1][node.y];
                        node.down = this.nodes[node.face][node.x + 1][node.y];
                        node.left = this.nodes[node.face][node.x][node.y - 1];
                        node.right = this.nodes[node.face][node.x][node.y + 1];
                    }
                })
            })
        })
        // If we folded this into a cube, determine edges
        this.zipCube(faceWidth);
    }

    // Attaches the edges of cube faces to other faces
    zipCube = (faceWidth) => {
        const first = 0;
        const last = faceWidth - 1;

        // Reduced this into one big loop instead of many similar small ones.
        // Addresses four nodes per face per loop
        // Unpredictable side is specified manually, then predictable sides addressed
        for (let i = 0; i < faceWidth; i++){
            const increasing = i;
            const decreasing = last - i;

            // Face 0 
            let currentFace = 0;
            let faceRelations = this.getFaceRelations(currentFace)
            // Top
            this.nodes[currentFace][first][increasing].up =this.nodes[faceRelations.up][first][decreasing];
            this.connectOtherTopSides(this.nodes[currentFace][first][increasing], faceWidth, increasing);
            // Bottom
            this.nodes[currentFace][last][increasing].down = this.nodes[faceRelations.down][first][increasing];
            this.connectOtherBottomSides(this.nodes[currentFace][last][increasing], faceWidth, increasing);
            // Left
            this.nodes[currentFace][increasing][first].left = this.nodes[faceRelations.left][first][increasing];
            this.connectOtherLeftSides(this.nodes[currentFace][increasing][first], faceWidth, increasing);
            // Right
            this.nodes[currentFace][increasing][last].right = this.nodes[faceRelations.right][decreasing][last];
            this.connectOtherRightSides(this.nodes[currentFace][increasing][last], faceWidth, increasing);

            // Face 1
            currentFace = 1;
            faceRelations = this.getFaceRelations(currentFace);
            // Top
            this.nodes[currentFace][first][increasing].up = this.nodes[faceRelations.up][first][decreasing];
            this.connectOtherTopSides(this.nodes[currentFace][first][increasing], faceWidth, increasing);
            // Bottom
            this.nodes[currentFace][last][increasing].down = this.nodes[faceRelations.down][first][increasing];
            this.connectOtherBottomSides(this.nodes[currentFace][last][increasing], faceWidth, increasing);
            // Left
            this.nodes[currentFace][increasing][first].left = this.nodes[faceRelations.left][last][decreasing];
            this.connectOtherLeftSides(this.nodes[currentFace][increasing][first], faceWidth, increasing);
            // Right
            this.nodes[currentFace][increasing][last].right = this.nodes[faceRelations.right][increasing][first];
            this.connectOtherRightSides(this.nodes[currentFace][increasing][last], faceWidth, increasing);

            // Face 2
            currentFace = 2;
            faceRelations = this.getFaceRelations(currentFace);
            // Top
            this.nodes[currentFace][first][increasing].up = this.nodes[faceRelations.up][increasing][first];
            this.connectOtherTopSides(this.nodes[currentFace][first][increasing], faceWidth, increasing);
            // Bottom
            this.nodes[currentFace][last][increasing].down = this.nodes[faceRelations.down][decreasing][first];
            this.connectOtherBottomSides(this.nodes[currentFace][last][increasing], faceWidth, increasing);
            // Left
            this.nodes[currentFace][increasing][first].left = this.nodes[faceRelations.left][increasing][last];
            this.connectOtherLeftSides(this.nodes[currentFace][increasing][first], faceWidth, increasing);
            // Right
            this.nodes[currentFace][increasing][last].right = this.nodes[faceRelations.right][increasing][first];
            this.connectOtherRightSides(this.nodes[currentFace][increasing][last], faceWidth, increasing);

            // Face 3
            currentFace = 3;
            faceRelations = this.getFaceRelations(currentFace);
            // Top
            this.nodes[currentFace][first][increasing].up = this.nodes[faceRelations.up][last][increasing];
            this.connectOtherTopSides(this.nodes[currentFace][first][increasing], faceWidth, increasing);
            // Bottom
            this.nodes[currentFace][last][increasing].down = this.nodes[faceRelations.down][first][increasing];
            this.connectOtherBottomSides(this.nodes[currentFace][last][increasing], faceWidth, increasing);
            // Left
            this.nodes[currentFace][increasing][first].left = this.nodes[faceRelations.left][increasing][last];
            this.connectOtherLeftSides(this.nodes[currentFace][increasing][first], faceWidth, increasing);
            // Right
            this.nodes[currentFace][increasing][last].right = this.nodes[faceRelations.right][first][decreasing];
            this.connectOtherRightSides(this.nodes[currentFace][increasing][last], faceWidth, increasing);

            // Face 4
            currentFace = 4;
            faceRelations = this.getFaceRelations(currentFace);
            // Top
            this.nodes[currentFace][first][increasing].up = this.nodes[faceRelations.up][last][increasing];
            this.connectOtherTopSides(this.nodes[currentFace][first][increasing], faceWidth, increasing);
            // Bottom
            this.nodes[currentFace][last][increasing].down = this.nodes[faceRelations.down][last][decreasing];
            this.connectOtherBottomSides(this.nodes[currentFace][last][increasing], faceWidth, increasing);
            // Left
            this.nodes[currentFace][increasing][first].left = this.nodes[faceRelations.left][last][decreasing];
            this.connectOtherLeftSides(this.nodes[currentFace][increasing][first], faceWidth, increasing);
            // Right
            this.nodes[currentFace][increasing][last].right = this.nodes[faceRelations.right][increasing][first];
            this.connectOtherRightSides(this.nodes[currentFace][increasing][last], faceWidth, increasing);

            // Face 5
            currentFace = 5;
            faceRelations = this.getFaceRelations(currentFace);
            // Top
            this.nodes[currentFace][first][increasing].up =this.nodes[faceRelations.up][decreasing][last];
            this.connectOtherTopSides(this.nodes[currentFace][first][increasing], faceWidth, increasing);
            // Bottom
            this.nodes[currentFace][last][increasing].down = this.nodes[faceRelations.down][decreasing][first];
            this.connectOtherBottomSides(this.nodes[currentFace][last][increasing], faceWidth, increasing);
            // Left
            this.nodes[currentFace][increasing][first].left = this.nodes[faceRelations.left][increasing][last];
            this.connectOtherLeftSides(this.nodes[currentFace][increasing][first], faceWidth, increasing);
            // Right
            this.nodes[currentFace][increasing][last].right = this.nodes[faceRelations.right][decreasing][last];
            this.connectOtherRightSides(this.nodes[currentFace][increasing][last], faceWidth, increasing);
        }
    }

    // Assigns predictable sides to top edge node
    connectOtherTopSides = (node, faceLength, y) => {
        node.down = this.nodes[node.face][1][y]; // down always safe
        // Only add lefts and rights if they aren't going over the edge
        if (y != 0) node.left = this.nodes[node.face][0][y - 1];
        if (y != faceLength - 1) node.right = this.nodes[node.face][0][y + 1];
    }

    // Assigns predictable sides to bottom edge node
    connectOtherBottomSides = (node, faceLength, y) => {
        node.up = this.nodes[node.face][faceLength - 2][y]; // up always safe
        if (y != 0) node.left = this.nodes[node.face][faceLength - 1][y - 1];
        if (y != faceLength -1) node.right = this.nodes[node.face][faceLength - 1][y + 1];
    }

    // Assigns predictable sides to left edge of node
    connectOtherLeftSides = (node, faceLength, x) => {
        node.right = this.nodes[node.face][x][1];// right always safe
        if (x != 0) node.up = this.nodes[node.face][x - 1][0];
        if (x != faceLength - 1) node.down = this.nodes[node.face][x + 1][0];
    }

    // Assigns predictable sides to right edge node
    connectOtherRightSides = (node, faceLength, x) => {
        node.left = this.nodes[node.face][x][faceLength - 2];
        if (x != 0) node.up = this.nodes[node.face][x - 1][faceLength - 1];
        if (x != faceLength - 1) node.down = this.nodes[node.face][x + 1][faceLength - 1];
    }

    // Checks if a node is an interior node (aka, not an edge node)
    isInteriorNode = (node, faceLength) => {
        return (
            node.x > 0 &&
            node.y > 0 &&
            node.x < faceLength - 1 &&
            node.y < faceLength - 1
        ) 
    }

    // Returns and object that which face (number) is in the direction of the parameter face
    // Direction is relative to parameter face
    getFaceRelations = (face) => {
        switch (face) {
            case 0:
                return {up: 1, down: 3, left: 2, right: 5};
            case 1:
                return {up: 0, down: 4, left: 5, right: 2};
            case 2:
                return {up: 0, down: 4, left: 1, right: 3};
            case 3:
                return {up: 0, down: 4, left: 2, right: 5};
            case 4:
                return {up: 3, down: 1, left: 2, right: 5};
            case 5:
                return {up: 3, down: 1, left: 4, right: 0};
        }
    }

    // Determines the next direction relative to the currentFace. Used when grid is a cube
    determineNewDirection = (initialFace, currentFace) => {
        switch(initialFace){
            case 0:
                switch (currentFace) {
                    case 1:
                    case 2:
                    case 3:
                        return DOWN;
                    case 5:
                        return LEFT;
                }
            case 1:
                switch (currentFace) {
                    case 0:
                        return DOWN;
                    case 2:
                        return RIGHT;
                    case 4:
                        return UP;
                    case 5:
                        return DOWN;
                }
            case 2:
                switch (currentFace) {
                    case 0:
                        return RIGHT;
                    case 1:
                        return LEFT;
                    case 3:
                    case 4:
                        return RIGHT;
                }
            case 3:
                switch (currentFace) {
                    case 0:
                        return UP;
                    case 2:
                        return LEFT;
                    case 4:
                    case 5:
                        return DOWN;
                }
            case 4:
                switch (currentFace) {
                    case 1:  
                    case 2:  
                    case 3:
                        return UP;
                    case 5:
                        return RIGHT;
                }
            case 5:
                switch (currentFace) {
                    case 0:  
                        return LEFT;
                    case 1:  
                        return RIGHT;
                    case 3:
                    case 4:
                        return LEFT;
                }
        }
    }

    // Returns the node where the knight would move, given start and two directions
    moveKnight =  (startingNode, firstDirection, secondDirection) => {
        let currentNode = startingNode;

        // Move 2
        let currentDirection = firstDirection;      
        for (let i = 0; i < 2; i++){
            let startingFace = currentNode.face;
            switch (currentDirection) {
                case UP:
                    currentNode = currentNode.up;
                    break;
                case DOWN:
                    currentNode = currentNode.down;
                    break;
                case LEFT:
                    currentNode = currentNode.left;
                    break;
                case RIGHT:
                    currentNode = currentNode.right;
                    break;
            }
            if (currentNode.face != startingFace){
                currentDirection = this.determineNewDirection(startingFace, currentNode.face);
            }
        }

        currentDirection = secondDirection;
        // Move 1
        switch (currentDirection) {
            case UP:
                currentNode = currentNode.up;
                break;
            case DOWN:
                currentNode = currentNode.down;
                break;
            case LEFT:
                currentNode = currentNode.left;
                break;
            case RIGHT:
                currentNode = currentNode.right;
                break;
        }

        return currentNode;
    }
}

let puzzle = new Cube(3);
console.log(puzzle.nodes);
let solutionSet = puzzle.solve();

let moveCounter = 1;
for (const el of solutionSet){
    console.log(`${moveCounter}:\t${el}`);
    moveCounter++;
}
