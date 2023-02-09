'use strict';


class Board {

    constructor(width = 8) {

        this.width = width;
        this.cells = {};
        this.moves = [];
        this.turn = "black";
        this._finished = false;

        this.initBoard();
    }

    
    get finished() {
        return this._finished
    }

    
    initBoard() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.width; y++) {
                this.cells[`${x}-${y}`] = new Cell(x, y);
            }
        }

        this.putInitialNuts();
    }

    putInitialNuts() {
        const centerCord = Math.floor(this.width / 2);

        this.setOwner(centerCord, centerCord, "white");
        this.setOwner(centerCord - 1, centerCord - 1, "white");

        this.setOwner(centerCord, centerCord - 1, "black");
        this.setOwner(centerCord - 1, centerCord, "black");

        this.findMoves();
    }

    getCell(x, y) {
        return this.cells[`${x}-${y}`]
    }

   
    changeTurn() {
        this.turn = this.turn === "white" ? "black" : "white";
    }

    
    setOwner(x, y, owner) {
        if (!this.getCell(x, y)) {
            throw new Error(`Could not found any cell for x:${x} & y:${y}`)
        }

        this.getCell(x, y).owner = owner;
    }

   
    getNuts(owner = null) {
        let nuts = [];
        Object.keys(this.cells)
            .map(key => {
                if ((!owner && this.cells[key].owner !== null) || (owner && this.cells[key].owner === owner))
                    nuts.push(this.cells[key]);
            });
        return nuts;
    }

    
    getWhiteNuts() {
        return this.getNuts("white");
    }

    
    getBlackNuts() {
        return this.getNuts("black");
    }

    
    addMove(x, y, centerNut, direction) {

        let alreadyAdded = false;
        this.moves.map((move) => {
            if (move.x === x && move.y === y) {
                alreadyAdded = true;

                if (move.directions.indexOf(direction) === -1) {
                    move.directions.push(direction)
                }
            }
        });

        if (!alreadyAdded)
            this.moves.push({
                x,
                y,
                centerNut,
                directions: [direction],
            })
    }

    isOnBoard(x, y) {
        return (x > -1 && y > -1) && (x < this.width && y < this.width)
    }


    getEmptyNeighborsOfCell(x, y) {
        let emptyNeighbors = [];

        const cellNeighbors = this.getCell(x, y).neighbors();
        cellNeighbors.map(([nx, ny]) => {
            if (this.isOnBoard(nx, ny) && this.getCell(nx, ny).owner === null) {
                emptyNeighbors.push(this.getCell(nx, ny));
            }
        });

        return emptyNeighbors
    }

    
    crossAxises(cx, cy) {
        return {
            topLeftToCell: (i) => `${cx + i}-${cy + i}`,        
            topCenterToCell: (i) => `${cx}-${cy + i}`,          
            topRightToCell: (i) => `${cx - i}-${cy + i}`,       
            leftCenterToCell: (i) => `${cx + i}-${cy}`,         
            rightCenterToCell: (i) => `${cx - i}-${cy}`,        
            bottomLeftToCell: (i) => `${cx + i}-${cy - i}`,     
            bottomCenterToCell: (i) => `${cx}-${cy - i}`,       
            bottomRightToCell: (i) => `${cx - i}-${cy - i}`,    
        };
    }


    crossAllDirectionsToCell(cx, cy, centerNut) {

        const directions = this.crossAxises(cx, cy);

        Object.keys(directions).map(dir => {
            let rivalNutsOnCross = 0;
            for (let i = 0; i < this.width; i++) {

                let cell = this.cells[directions[dir](i)];
                if (!cell) break;


                if (cell.owner !== this.turn && cell.owner !== null) {
                    rivalNutsOnCross++;

                } else if (cell.owner === this.turn && rivalNutsOnCross > 0) {
                    this.addMove(cx, cy, centerNut, dir);
                    break;

                } else if (i === 1 && (cell.owner === this.turn || cell.owner === null)) {
                    break;

                } else if (rivalNutsOnCross > 0 && cell.owner === null) {
                    break;
                }
            }
        })

    }

    
    findMoves() {
        this.moves = [];

        let nuts;
        if (this.turn === "white")
            nuts = this.getBlackNuts();
        else
            nuts = this.getWhiteNuts();


        nuts.map((nut) => {
            const [x, y] = nut.pos();
            const neighbors = this.getEmptyNeighborsOfCell(x, y);

            neighbors.map((neighbor) => {
                const [nx, ny] = neighbor.pos();

                this.crossAllDirectionsToCell(nx, ny, [x, y]);
            });

        });

    }

    
    findCellsToFlip(nx, ny, dir) {

        const directions = this.crossAxises(nx, ny);

        let cellToChange = [];

        for (let i = 0; i <= this.width; i++) {
            let cell = this.cells[directions[dir](i)];

            if (!cell) {
                break;

            } else if (cell.owner !== this.turn) {
                cellToChange.push(cell);

            } else if (cell.owner === this.turn || cell.owner === null) {
                break;

            }
        }

        return cellToChange
    }

    
    isValidMove(x, y) {
        return this.moves.find(move => move.x === x && move.y === y) !== undefined
    }

  
    placeNutTo(x, y) {

        if (!this.isValidMove(x, y))
            throw new Error(`The move [${x},${y}] is impossible!`);

        const move = this.moves.find(move => move.x === x && move.y === y);

        let cellsToFlip = [];
        move.directions.map((dir) => {
            cellsToFlip = [...cellsToFlip, ...this.findCellsToFlip(x, y, dir)];
        });

        cellsToFlip.map(cell => cell.owner = this.turn);

        this.changeTurn();
        this.findMoves();

        if (this.moves.length === 0) {
            this.changeTurn();
            this.findMoves();

            if (this.moves.length === 0)
                this._finished = true;
        }

    }

    
    gameResult() {
        const white = this.getWhiteNuts().length,
            black = this.getBlackNuts().length;

        return {
            white,
            black,
            winner: white > black ? "white" :
                black > white ?
                    "black" : "equal"
        };

    }
}
