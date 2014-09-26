'use strict'; //prints error as opposed to ignoring silently

var isMoveOk = (function () {

    var dim = 9; // size of weiqi table

    // AngularJS isEqual code
    // https://docs.angularjs.org/api/ng/function/angular.equals
    function isEqual(object1, object2) {
        if (object1 === object2) {
            return true;
        }
        if (typeof object1 != 'object' && typeof object2 != 'object') {
            return object1 == object2;
        }
        try {
            var keys1 = Object.keys(object1);
            var keys2 = Object.keys(object2);
            var i, key;

            if (keys1.length != keys2.length) {
                return false;
            }
            //the same set of keys (although not necessarily the same order),
            keys1.sort();
            keys2.sort();
            // key test
            for (i = keys1.length - 1; i >= 0; i--) {
                if (keys1[i] != keys2[i])
                    return false;
            }
            // equivalent values for every corresponding key
            for (i = keys1.length - 1; i >= 0; i--) {
                key = keys1[i];
                if (!isEqual(object1[key], object2[key])) {
                    return false;
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    // returns a new [empty] weiqi board
    // code adapted from: http://stackoverflow.com/questions/6495187/best-way-to-generate-empty-2d-array
    function createNewBoard() {
        var rows = dim;
        var cols = dim;
        var array = [], row = [];
        while (cols--)
            row.push('');
        while (rows--)
            array.push(row.slice());
        return array;
    }

    // returns copy of JS object
    function copyObject(object) {
        return JSON.parse(JSON.stringify(object));
    }

    //
    function mergeSets(sets, newarr, oldarr) {
        var setsAfterMerge = sets;
        //iterate through sets
        var temp = [];
        var i;
        for (i = 0; i < setsAfterMerge.length; i++) {
            temp = setsAfterMerge[i];
            if (temp.isArray()) {
                for (i2 = 0; i2 < temp.length; i2++) {
                    if (temp[i2] === oldarr) {
                        temp.push(newarr);
                        setsAfterMerge[i] = temp;
                    }
                }
            }
        }
        return setsAfterMerge;
    }

    // needed by evaluateBoard
    // groups all contiguous stones as sets
    function getSets(board) {
        var setsX = []; // black sets
        var setsO = []; // white sets
        var row, col;
        // iterate through board
        for (row = 0; row < dim; row++) {
            for (col = 0; col < dim; col++) {
                // if it's a black stone
                // add it to existing set if it's touching a stone
                // in a previously explored location
                if (board[row][col] === 'X') {
                    if (board[row - 1][col] === board[row][col]) {
                        setsX = mergeSets(setsX, [row, col], [row - 1, col]);
                    } else if (board[row][col - 1] === board[row][col]) {
                        setsX = mergeSets(setsX, [row, col], [row, col - 1]);
                    } else {
                        // no sets to merge with
                        setsX.push([[row, col]]);
                    }
                } else if (board[row][col] === 'O') {
                    if (board[row - 1][col] === board[row][col]) {
                        setsO = mergeSets(setsO, [row, col], [row - 1, col]);
                    } else if (board[row][col - 1] === board[row][col]) {
                        setsO = mergeSets(setsO, [row, col], [row, col - 1]);
                    } else {
                        setsO.push([[row, col]]);
                    }
                }
            }
        }
        return {black: setsX, white: setsO};
    }

    // Changes all arr locations in board to '' (empty)
    function cleanBoard(board, arr) {
        var i;
        for (i = 0; i < arr.length; i++) {
            row = arr[i][0];
            col = arr[i][1];
            board[row][col] = '';
        }
        return board;
    }

    // For each set in forest, tries to find a liberty
    // If no liberties, then the set is captured
    function getLiberties(board, forest) {
        var captures = 0; // new captures
        var boardAfterEval = copyObject(board);
        var liberties = 0; // liberties found
        var tempset, i, i2;
        for (i = 0; i < forest.length; i++) {
            liberties = 0;
            tempset = forest[i];
            for (i2 = 0; i2 < tempset.length; i2++) {
                var row = tempset[i2][0];
                var col = tempset[i2][1];
                if (board[row - 1][col] === '' ||
                        board[row + 1][col] === '' ||
                        board[row][col - 1] === '' ||
                        board[row][col + 1] === '') {
                    liberties++;
                    break;
                }
            }
            if (liberties === 0) {
                captures = captures + tempset.length;
                boardAfterEval = cleanBoard(boardAfterEval, tempset);
            }
        }
        return {board: boardAfterEval, captured: captures};
    }

    // evaluates WEIQI board using union-find algorithm
    function evaluateBoard(board, captured, turn) {
        var capturedAfterEval = copyObject(captured);
        var boardAfterEval = copyObject(board);

        var forest = getSets(board);
        var black = forest.black;
        var white = forest.white;

        // Iterate through the sets to find ones without liberties
        // First analyze the liberties of the opponent
        var result;
        if (turn === 0) {
            result = getLiberties(boardAfterEval, white);
            capturedAfterEval.white = captured.white + result.captured;
            boardAfterEval = copyObject(result.board);
            result = getLiberties(boardAfterEval, black);
            capturedAfterEval.black = captured.black + result.captured;
            boardAfterEval = copyObject(result.board);
        } else if (turn === 1) {
            result = getLiberties(boardAfterEval, black);
            capturedAfterEval.black = captured.black + result.captured;
            boardAfterEval = copyObject(result.board);
            result = getLiberties(boardAfterEval, white);
            capturedAfterEval.white = captured.white + result.captured;
            boardAfterEval = copyObject(result.board);
        } else {
            throw Error('evaluateBoard: invalid turn value.');
        }
        return {board: boardAfterEval, captured: capturedAfterEval};
    }

    // getWinner determines winner based on captured stones
    function getWinner(board, captured) {
        var winner = 'O';
        if (captured.black - captured.white === 0) {
            winner = '';
        } else if (captured.white > captured.black) {
            winner = 'X';
        }
        return winner;
    }

    // returns state that should be produced by making move 'delta'
    function createMove(board, delta, captured, passes, turnIndexBeforeMove) {
        var boardAfterMove = copyObject(board);
        var passesAfterMove = passes;
        var capturedAfterMove = copyObject(captured);

        var row = delta.row;
        var col = delta.col;
        if (row === -1 && col === -1) {
            // delta of {-1, -1} indicates a pass (no move made)
            passesAfterMove++;
        } else if (boardAfterMove[row][col] !== '') {
            // if space isn't '' then bad move
            throw Error('Space is not empty!');
        } else {
            // else make the move/change the board
            boardAfterMove[row][col] = turnIndexBeforeMove === 0 ? 'X' : 'O';
            passesAfterMove = 0; //if a move is made, passes is reset
            // evaluate board to see if any players captured new pieces
            var stateAfterEval = evaluateBoard(boardAfterMove, captured, turnIndexBeforeMove);
            boardAfterMove = stateAfterEval.board;
            capturedAfterMove = stateAfterEval.captured;
        }

        var firstOperation; // Either endMatchScores or setTurn
        if (passesAfterMove === 2) {
            // 2 passes means players have decided to end game
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
        /* Example move:
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
        var turnIndexBeforeMove = params.turnIndexBeforeMove;
        /* Example turnBeforeMove:
         * turnBeforeMove = 0;
         * 0 or 1, player 0 plays the black stones ('X')
         */
        var stateBeforeMove = params.stateBeforeMove;
        /* Example stateBeforeMove
         * {
         *  board: [['X','','',...,''],[...],['',...,'']],
         *  delta: {row: 0, col: 0},
         *  captured: {black: 0, white: 0},
         *  passes: 0
         * }
         */

        try {
            // deltaValue is the move being made
            var deltaValue = move[2].set.value;

            // values from stateBeforeMove
            var oldcaptured = stateBeforeMove.captured;
            var oldpasses = stateBeforeMove.passes;
            var oldboard = stateBeforeMove.board;

            // instantiate values if stateBeforeMove was {}
            if (oldcaptured === undefined) {
                captured = {black: 0, white: 0};
            }
            if (oldpasses === undefined) {
                passes = 0;
            }
            if (oldboard === undefined) {
                board = createNewBoard();
            }

            // some special cases
            if (oldpasses > 2 || oldpasses < 0) {
                return false;
            }

            // createMove will return the expected state
            var expectedMove = createMove(oldboard, deltaValue,
                    oldcaptured, oldpasses, turnIndexBeforeMove);
            // which should match the passed 'move' object
            if (!isEqual(move, expectedMove)) {
                return false;
            }

        } catch (e) {
            return false;
        }
        return true;
    }

    return isMoveOk;
})();
