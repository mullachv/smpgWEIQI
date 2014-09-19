var isMoveOk = (function() {
    'use strict';
    dim = 9;
    
    function isEqual(object1, object2) {
        return JSON.stringify(object1) === JSON.stringify(object2);
    }
    function createNewBoard() {
        var tarr = new Array(dim || 0);
        if (tarr.length < 9) {
            throw Error('Board dimension must be at least 9x9');
        } else if (tarr.length % 2 !== 0) {
            throw Error('Board dimension must be an odd number.');
        }
        i = tarr.length;
        while(i--) {
            tarr[tarr.length-1-i] = new Array(tarr.length);
        }
        return tarr;
    }
    function copyObject(object) {
        return JSON.parse(JSON.stringify(object));
    }
    function mergeSets(sets, newarr, oldarr) {
        var setsAfterMerge = sets;
        //iterate through sets
        var temp = [];
        for(i = 0; i<setsAfterMerge.length; i++) {
            temp = setsAfterMerge[i];
            if (temp.isArray()) {
                for(i2 = 0; i2<temp.length; i2++) {
                    if(temp[i2] === oldarr) {
                        temp.push(newarr);
                        setsAfterMerge[i] = temp;
                    }
                }
            }
        }
        return setsAfterMerge;
    }
    function getSets(board) {
        var setsX = [];
        var setsO = [];
        var row, col;
        for (row = 0; row < dim; row++) {
            for (col = 0; col < dim; col++) {
                if(board[row][col] === 'X') {
                    if(board[row-1][col] === board[row][col]) {
                        setsX = mergeSets(setsX, [row, col], [row-1,col]);
                    } else if(board[row][col-1] === board[row][col]) {
                        setsX = mergeSets(setsX, [row, col], [row, col-1]);
                    } else {
                        setsX.push([[row,col]]);
                    }
                } else if (board[row][col] === 'O') {
                    if(board[row-1][col] === board[row][col]) {
                        setsO = mergeSets(setsO, [row, col], [row-1,col]);
                    } else if(board[row][col-1] === board[row][col]) {
                        setsO = mergeSets(setsO, [row, col], [row, col-1]);
                    } else {
                        setsO.push([[row,col]]);
                    }
                }
            }
        }
        return {black: setsX, white: setsO};
    }
    function cleanBoard(board, arr) {
        var boardAfterEval = copyObject(board);
        for (i = 0; i<arr.length; i++) {
            row = arr[i][0];
            col = arr[i][1];
            boardAfterEval[row][col] = '';
        }
        return boardAfterEval;
    }
    function getLiberties(board, forest) {
        var captures = 0;
        var boardAfterEval = copyObject(board);
        var tempset;
        var liberties = 0;
        for (i = 0; i<forest.length; i++) {
            liberties = 0;
            tempset = forest[i];
            for (i2 = 0; i2<tempset.length; i2++) {
                var row = tempset[i2][0];
                var col = tempset[i2][1];
                if(board[row-1][col] === '' ||
                        board[row+1][col] === '' ||
                        board[row][col-1] === '' ||
                        board[row][col+1] === '') {
                    liberties++;
                    break;
                }
            }
            if(liberties===0) {
                captures = captures+tempset.length;
                boardAfterEval = cleanBoard(boardAfterEval, tempset);
            }
        }
        return {board: boardAfterEval, captured: captures};
    }
    function evaluateBoard(board, captured, turn) {
        var capturedAfterEval = copyObject(captured);
        
        var forest = getSets(board);
        var black = forest.black;
        var white = forest.white;
        
        // Iterate through the sets to find ones without liberties
        var result;
        if(turn === 0) {
            result = getLiberties(board, white);
            capturedAfterEval.black = captured.black+result.captured;
        } else if (turn === 1) {
            result = getLiberties(board, black);
            capturedAfterEval.white = captured.white + result.captured;
        } else {
            throw Error('Invalid turn value.');
        }
        return {board: result.board, captured: capturedAfterEval};
    }
    function getWinner(board, captured) {
        var winner = 'X';
        if (captured.black - captured.white === 0) {
            winner = '';
        } else if (captured.white > captured.black) {
            winner = 'O';
        }
        return winner;
    }
    function makeMove(board, delta, captured, passes, turnIndexBeforeMove) {
        var boardAfterMove = copyObject(board);
        var passesAfterMove = passes;
        
        var row = delta.row;
        var col = delta.col;
        if(row === -1 && col === -1) {
            passesAfterMove++;
        } else if (boardAfterMove[row][col] !== '') {
            throw Error('Not a valid space!');
        } else {
            boardAfterMove[delta.row][delta.col] = turnIndexBeforeMove === 0 ? 'X' : 'O';
            passesAfterMove = 0;
        }
        
        var stateAfterEval = evaluateBoard(boardAfterMove, captured, turnIndexBeforeMove);
        boardAfterMove = stateAfterEval.board;
        var capturedAfterMove = stateAfterEval.captured;

        var firstOperation;
        if(passesAfterMove === 2) {
            var winner = getWinner(boardAfterMove, capturedAfterMove);
            firstOperation = {endMatch: {endMatchScores:
               (winner === 'X' ? [1, 0] : (winner === 'O' ? [0, 1] : [0, 0]))}};
        } else {
            firstOperation = {setTurn: {turnIndex: 1 - turnIndexBeforeMove}};
        }
        
        return [
            firstOperation,
            {set: {key: 'board', value: boardAfterMove}},
            {set: {key: 'delta', value: delta}},
            {set: {key: 'captured', value: capturedAfterMove}},
            {set: {key: 'passes', value: passesAfterMove}}
        ];
    }
    
    function isMoveOk(params) {
        var move = params.move;
        var turnIndexBeforeMove = params.turnIndexBeforeMove;
        /* Example turnBeforeMove:
         * turnBeforeMove = 0;
         * 0 means player1, who players the black stones
         */
        var stateBeforeMove = params.stateBeforeMove;
        /* Example stateBeforeMove
         * [{
         *  board: [['X','','',...,''],[...],['',...,'']],
         *  delta: {row: 0, col: 0},
         *  captured: {black: 0, white: 0},
         *  passes: 0
         * }]
         */
        
        
        try {
            /* Example move
             * [
             *  {endMatch: {endMatchScores: [1, 0]}},
             *   or {setTurn : {turnIndex: 1}},
             *  {set: {key: 'board', 
             *          value: [['X','O','',...,''],[...],['',...,'']]
             *          }},
             *  {set: {key: 'delta', 
             *          value: {row: 0, col: 0}
             *          }}
             *  {set: {key: 'captured', {black: 0, white: 0}}},
             *  {set: {key: 'passes', value: 0}},
             * ]
             */
            var deltaValue = move[3].set.value;
            
            var captured = stateBeforeMove.captured;
            if(captured===undefined || 
                    captured.black===undefined || 
                    captured.white===undefined) {
                captured = {black: 0, white: 0};
            }
            
            var passes = stateBeforeMove.passes;
            if(passes===undefined) {
                passes = 0;
            } else if(passes > 2 || passes < 0) {
                return false;
            }
            
            var board = stateBeforeMove.board;
            if(board===undefined) {
                board=createNewBoard();
            }
            
            var expectedMove = makeMove(board, deltaValue, captured, passes, turnIndexBeforeMove);
            if(!isEqual(move, expectedMove)) {
                return false;
            }
            
            
        } catch(e) {
            return false;
        }
        return true;
        
    }
    
    return isMoveOk;
})();
