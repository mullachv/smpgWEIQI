var gameLogic;
(function (gameLogic) {
    var dim = 19; //$scope.numberOfRowsAndCols; // size of weiqi table
    // AngularJS isEqual code
    // https://docs.angularjs.org/api/ng/function/angular.equals
    if (window.location.search === '?boardSize=9') {
        dim = 9;
    }
    if (window.location.search === '?boardSize=19') {
        dim = 19;
    }
    if (window.location.search === '?boardSize=13') {
        dim = 13;
    }
    function isEqual(object1, object2) {
        return angular.equals(object1, object2);
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
    function getInitialBoard() {
        return createNewBoard();
    }
    gameLogic.getInitialBoard = getInitialBoard;
    // returns copy of JS object
    function copyObject(object) {
        return JSON.parse(JSON.stringify(object));
    }
    //Helper for getSets
    function getWeb(color, row, col, board) {
        var points = [];
        var leader = createNewBoard();
        function tryPoints(row, col) {
            points.push([row, col]);
            leader[row][col] = color;
            if (row - 1 >= 0 && leader[row - 1][col] === '' && board[row - 1][col] === color) {
                tryPoints(row - 1, col);
            }
            if (row + 1 < dim && leader[row + 1][col] === '' && board[row + 1][col] === color) {
                tryPoints(row + 1, col);
            }
            if (col + 1 < dim && leader[row][col + 1] === '' && board[row][col + 1] === color) {
                tryPoints(row, col + 1);
            }
            if (col - 1 >= 0 && leader[row][col - 1] === '' && board[row][col - 1] === color) {
                tryPoints(row, col - 1);
            }
        }
        tryPoints(row, col);
        return { willadd: points, links: leader };
    }
    //Helper for getSets
    function mergeBoards(leader, links) {
        var finalleader = copyObject(leader);
        var row, col;
        for (row = 0; row < dim; row++) {
            for (col = 0; col < dim; col++) {
                if (links[row][col] !== '') {
                    finalleader[row][col] = links[row][col];
                }
            }
        }
        return finalleader;
    }
    // needed by evaluateBoard
    // groups all contiguous stones as sets
    function getSets(board) {
        var leaderX = createNewBoard();
        var leaderO = createNewBoard();
        var setsX = []; // black sets
        var setsO = []; // white sets
        var row, col;
        var connectInfo;
        for (row = 0; row < dim; row++) {
            for (col = 0; col < dim; col++) {
                if (board[row][col] === 'X' && leaderX[row][col] === '') {
                    connectInfo = getWeb('X', row, col, board);
                    setsX.push(copyObject(connectInfo.willadd));
                    leaderX = mergeBoards(leaderX, connectInfo.links);
                }
                else if (board[row][col] === 'O' && leaderO[row][col] === '') {
                    connectInfo = getWeb('O', row, col, board);
                    setsO.push(copyObject(connectInfo.willadd));
                    leaderO = mergeBoards(leaderO, connectInfo.links);
                }
            }
        }
        return { black: setsX, white: setsO };
    }
    // Changes all arr locations in board to '' (empty)
    function cleanBoard(board, arr) {
        var newboard = copyObject(board);
        var i, row, col;
        for (i = 0; i < arr.length; i++) {
            row = arr[i][0];
            col = arr[i][1];
            newboard[row][col] = '';
        }
        return newboard;
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
                if ((row - 1 >= 0 && board[row - 1][col] === '') ||
                    (row + 1 < dim && board[row + 1][col] === '') ||
                    (col - 1 >= 0 && board[row][col - 1] === '') ||
                    (col + 1 < dim && board[row][col + 1] === '')) {
                    liberties++;
                    break;
                }
            }
            if (liberties === 0) {
                captures = captures + tempset.length;
                boardAfterEval = cleanBoard(boardAfterEval, tempset);
            }
        }
        return { board: boardAfterEval, captured: captures };
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
        }
        result = getLiberties(boardAfterEval, black);
        capturedAfterEval.black = captured.black + result.captured;
        boardAfterEval = copyObject(result.board);
        if (turn === 1) {
            result = getLiberties(boardAfterEval, white);
            capturedAfterEval.white = captured.white + result.captured;
            boardAfterEval = copyObject(result.board);
        }
        return { board: boardAfterEval, captured: capturedAfterEval };
    }
    // getWinner determines winner based on captured stones
    function getWinner(captured) {
        var winner = 'O';
        if (captured.black - captured.white === 0) {
            winner = '';
        }
        else if (captured.white > captured.black) {
            winner = 'X';
        }
        return winner;
    }
    // returns a random move that the computer plays
    function createComputerMove(boardbeforeMove, board, captured, passes, turnIndexBeforeMove) {
        var possibleMoves = [];
        var i, j, delta, testmove, newcaptured;
        for (i = 0; i < dim; i++) {
            for (j = 0; j < dim; j++) {
                delta = { row: i, col: j };
                try {
                    testmove = createMove(boardbeforeMove, board, delta, captured, passes, turnIndexBeforeMove);
                    newcaptured = testmove[3].set.value;
                    if ((turnIndexBeforeMove === 0 && newcaptured.white > captured.white)
                        || (turnIndexBeforeMove === 1 && newcaptured.black > captured.black)) {
                        return testmove;
                    }
                    if (!(turnIndexBeforeMove === 0 && newcaptured.black > captured.black)
                        && !(turnIndexBeforeMove === 1 && newcaptured.white > captured.white)) {
                        possibleMoves.push(testmove);
                    }
                }
                catch (e) {
                }
            }
        }
        try {
            delta = { row: -1, col: -1 };
            testmove = createMove(boardbeforeMove, board, delta, captured, passes, turnIndexBeforeMove);
            possibleMoves.push(testmove);
        }
        catch (e) {
        }
        var randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        return randomMove;
    }
    gameLogic.createComputerMove = createComputerMove;
    function getboardNum(board, turnIndex) {
        var sum = 0;
        var i, j;
        var color = turnIndex ? 'O' : 'X';
        for (i = 0; i < dim; i++)
            for (j = 0; j < dim; j++)
                if (board[i][j] === color)
                    sum++;
        return sum;
    }
    // returns state that should be produced by making move 'delta'
    function createMove(boardbeforeMove, board, delta, captured, passes, turnIndexBeforeMove) {
        // instantiate values if stateBeforeMove was {}
        if (captured === undefined) {
            captured = { black: 0, white: 0 };
        }
        if (passes === undefined) {
            passes = 0;
        }
        if (board === undefined) {
            board = createNewBoard();
        }
        if (boardbeforeMove === undefined)
            boardbeforeMove = createNewBoard();
        var setnumBefore, setnumAfter;
        setnumBefore = getboardNum(board, turnIndexBeforeMove);
        var boardAfterMove = copyObject(board);
        var passesAfterMove = passes;
        var capturedAfterMove = copyObject(captured);
        var row = delta.row;
        var col = delta.col;
        if (row === -1 && col === -1) {
            // delta of {-1, -1} indicates a pass (no move made)
            passesAfterMove++;
            if (passesAfterMove > 2) {
                throw Error('Exceeded number of possible passes.');
            }
        }
        else if (boardAfterMove[row][col] !== '') {
            // if space isn't '' then bad move
            throw Error('Space is not empty!');
        }
        else {
            // else make the move/change the board
            // bad delta should automatically throw error
            boardAfterMove[row][col] = turnIndexBeforeMove === 0 ? 'X' : 'O';
            passesAfterMove = 0; //if a move is made, passes is reset
            // evaluate board to see if any players captured new pieces
            var stateAfterEval = evaluateBoard(boardAfterMove, captured, turnIndexBeforeMove);
            boardAfterMove = stateAfterEval.board;
            capturedAfterMove = stateAfterEval.captured;
        }
        setnumAfter = getboardNum(boardAfterMove, turnIndexBeforeMove);
        if (setnumAfter <= setnumBefore && setnumAfter > 0 && passes === 0 && passesAfterMove === 0)
            throw Error('you can not suicide.');
        if (angular.equals(boardbeforeMove, boardAfterMove) && passes === 0 && passesAfterMove === 0)
            throw Error("don’t allow a move that brings the game back to stateBeforeMove.");
        var firstOperation; // Either endMatchScores or setTurn
        if (passesAfterMove === 2) {
            // 2 passes means players have decided to end game
            var winner = getWinner(capturedAfterMove);
            firstOperation = { endMatch: { endMatchScores: (winner === 'X' ? [1, 0] : (winner === 'O' ? [0, 1] : [0, 0])) } };
        }
        else {
            firstOperation = { setTurn: { turnIndex: 1 - turnIndexBeforeMove } };
        }
        return [
            firstOperation,
            { set: { key: 'board', value: boardAfterMove } },
            { set: { key: 'delta', value: delta } },
            { set: { key: 'captured', value: capturedAfterMove } },
            { set: { key: 'passes', value: passesAfterMove } }
        ];
    }
    gameLogic.createMove = createMove;
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
            // createMove will return the expected state
            var expectedMove = createMove(stateBeforeMove.boardbeforeMove, stateBeforeMove.board, deltaValue, stateBeforeMove.captured, stateBeforeMove.passes, turnIndexBeforeMove);
            // which should match the passed 'move' object
            if (!isEqual(move, expectedMove)) {
                return false;
            }
        }
        catch (e) {
            return false;
        }
        return true;
    }
    gameLogic.isMoveOk = isMoveOk;
})(gameLogic || (gameLogic = {}));
;var game;
(function (game) {
    var jsonState = null;
    game.board = null;
    var delta;
    var captured;
    var passes;
    var notifications;
    var turnIndex;
    var computerTurn;
    var clickToDragPiece;
    var boardbeforeMove;
    var isYourTurn;
    var msg;
    game.numberOfRowsAndCols = 19;
    game.boardSrc = 'imgs/board_19x19_2.png';
    var rowsNum = game.numberOfRowsAndCols;
    var colsNum = game.numberOfRowsAndCols;
    //window.touchElementId = "boardArea";
    // angular.module('myApp').controller('Ctrl',
    //     ['$rootScope', '$scope', '$log', '$timeout',
    //         'gameService', 'gameLogic',
    //         'resizeGameAreaService','dragAndDropService',
    //         function ($rootScope, $scope, $log, $timeout,
    //                   gameService, gameLogic, resizeGameAreaService,dragAndDropService) {
    function init() {
        resizeGameAreaService.setWidthToHeight(0.8);
        gameService.setGame({
            minNumberOfPlayers: 2,
            maxNumberOfPlayers: 2,
            isMoveOk: gameLogic.isMoveOk,
            updateUI: updateUI
        });
        // See http://www.sitepoint.com/css3-animation-javascript-event-handlers/
        // document.addEventListener("animationend", animationEndedCallback, false); // standard
        // document.addEventListener("webkitAnimationEnd", animationEndedCallback, false); // WebKit
        // document.addEventListener("oanimationend", animationEndedCallback, false); // Opera
        dragAndDropService.addDragListener("boardArea", handleDragEvent);
        //dragAndDropService.addDragListener("gameArea", handleDragEvent);
        //gameArea = document.getElementById("gameArea");
        // Before updateUI, show an empty board to viewer (so you can't perform moves)
        updateUI({ stateAfterMove: {}, turnIndexAfterMove: 0, yourPlayerIndex: -2 });
    }
    game.init = init;
    // var moveAudio = new Audio('audio/move.wav');
    // moveAudio.load();
    game.getButtonValue = function () {
        switch (passes) {
            case 0: return 'PASS';
            case 1: return 'END_MATCH';
            case 2: return 'GAME_OVER';
            default: return 'PASS';
        }
    };
    /*global variables*/
    game.hidePassButton = function () {
        return computerTurn;
    };
    if (window.location.search === '?boardSize=9') {
        game.numberOfRowsAndCols = 9;
        game.boardSrc = 'imgs/board.png';
    }
    if (window.location.search === '?boardSize=19') {
        game.numberOfRowsAndCols = 19;
        game.boardSrc = 'imgs/board_19x19_2.png';
    }
    if (window.location.search === '?boardSize=13') {
        game.numberOfRowsAndCols = 13;
        game.boardSrc = 'imgs/board1313.png';
    }
    game.getIntegersTill = function (number) {
        var res = [];
        for (var i = 0; i < number; i++) {
            res.push(i);
        }
        return res;
    };
    function handleDragEvent(type, clientX, clientY) {
        if (passes === 2 || computerTurn) {
            return; // if the game is over, do not display dragging effect
        }
        var draggingLines = document.getElementById("draggingLines");
        var horizontalDraggingLine = document.getElementById("horizontalDraggingLine");
        var verticalDraggingLine = document.getElementById("verticalDraggingLine");
        clickToDragPiece = document.getElementById("clickToDragPiece");
        var gameArea = document.getElementById("gameArea");
        var boardArea = document.getElementById("boardArea");
        // Center point in gameArea
        var x = clientX - gameArea.offsetLeft;
        var y = clientY - gameArea.offsetTop;
        // Is outside boardArea?
        var button = document.getElementById("button");
        /*
        console.log(button);
        if (x > button.offsetLeft && x < button.offsetLeft + button.clientWidth
            && y > button.offsetTop && y < button.offsetTop + button.clientHeight) {
            if (type === "touchend" || type === "touchcancel" || type === "touchleave" || type === "mouseup") {
                $scope.passClicked();
            }
            return;
        }
        */
        if (x < 0 || x >= gameArea.clientWidth || y < 0 || y >= boardArea.clientHeight) {
            draggingLines.style.display = "none";
            clickToDragPiece.style.display = "none";
            return;
        }
        // Inside gameArea. Let's find the containing square's row and col
        var col = Math.floor(colsNum * x / boardArea.clientWidth);
        var row = Math.floor(rowsNum * y / boardArea.clientHeight);
        // if the cell is not empty, don't preview the piece, but still show the dragging lines
        if (game.board[row][col] === 'X' || game.board[row][col] === 'O') {
            return;
        }
        clickToDragPiece.style.display = "inline";
        draggingLines.style.display = "inline";
        var centerXY = getSquareCenterXY(row, col);
        verticalDraggingLine.setAttribute("x1", "" + centerXY.x);
        verticalDraggingLine.setAttribute("x2", "" + centerXY.x);
        horizontalDraggingLine.setAttribute("y1", "" + centerXY.y);
        horizontalDraggingLine.setAttribute("y2", "" + centerXY.y);
        // show the piece
        //var cell = document.getElementById('board' + row + 'x' + col).className = $scope.turnIndex === 0 ? 'black' : 'white';
        var topLeft = getSquareTopLeft(row, col);
        var circle = document.getElementById("circle");
        circle.setAttribute("fill", turnIndex === 0 ? 'black' : 'white');
        clickToDragPiece.style.left = topLeft.left + "px";
        clickToDragPiece.style.top = topLeft.top + "px";
        if (type === "touchend" || type === "touchcancel" || type === "touchleave" || type === "mouseup") {
            // drag ended
            clickToDragPiece.style.display = "none";
            draggingLines.style.display = "none";
            dragDone(row, col);
        }
    }
    function getSquareTopLeft(row, col) {
        var size = getSquareWidthHeight();
        return { top: row * size.height, left: col * size.width };
    }
    function getSquareWidthHeight() {
        var boardArea = document.getElementById("boardArea");
        return {
            width: boardArea.clientWidth / (colsNum),
            height: boardArea.clientHeight / (rowsNum)
        };
    }
    function getSquareCenterXY(row, col) {
        var size = getSquareWidthHeight();
        return {
            x: col * size.width + size.width / 2,
            y: row * size.height + size.height / 2
        };
    }
    function dragDone(row, col) {
        $rootScope.$apply(function () {
            var lmsg = "Dragged to " + row + "x" + col;
            console.log(lmsg);
            msg = lmsg;
            cellClicked(row, col);
        });
    }
    function sendComputerMove() {
        gameService.makeMove(gameLogic.createComputerMove(boardbeforeMove, game.board, captured, passes, turnIndex));
    }
    function updateUI(params) {
        jsonState = angular.toJson(params.stateAfterMove, true);
        game.board = params.stateAfterMove.board;
        delta = params.stateAfterMove.delta;
        captured = params.stateAfterMove.captured;
        passes = params.stateAfterMove.passes;
        // Set initial state, or reset if somehow invalid
        if (game.board === undefined || captured === undefined ||
            passes === undefined) {
            game.board = gameLogic.getInitialBoard();
            captured = { black: 0, white: 0 };
            passes = 0;
            notifications = "Nothing was dragged";
        }
        else {
        }
        isYourTurn = params.turnIndexAfterMove >= 0 &&
            params.yourPlayerIndex === params.turnIndexAfterMove;
        turnIndex = params.turnIndexAfterMove;
        //$log.info("updateUI: ", $scope.turnIndex);
        // Is it the computer's turn?
        if (isYourTurn && params.playersInfo[params.yourPlayerIndex].playerId === '') {
            // Wait 500ms for animation to end
            computerTurn = true;
            $timeout(sendComputerMove, 1000);
            return;
        }
        computerTurn = false;
    }
    game.passClicked = function () {
        //Clicking on the CLICK TO PASS button triggers this function
        //It will increment the number of passes.
        //The fraction indicates in the button notes how many
        //consecutive passes have been made (2 ends the game).
        console.log(["Clicked on pass.", passes]);
        if (!isYourTurn) {
            return;
        }
        try {
            var delta = { row: -1, col: -1 };
            var move = gameLogic.createMove(boardbeforeMove, game.board, delta, captured, passes, turnIndex);
            boardbeforeMove = game.board;
            isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        }
        catch (e) {
            console.log(["Cannot pass.", passes]);
            return;
        }
    };
    function cellClicked(rrow, ccol) {
        console.log(["Clicked on cell:", rrow, ccol]);
        if (!isYourTurn) {
            return;
        }
        try {
            var delta = { row: rrow, col: ccol };
            var move = gameLogic.createMove(boardbeforeMove, game.board, delta, captured, passes, turnIndex);
            boardbeforeMove = game.board;
            isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        }
        catch (e) {
            console.log(["Cannot make move:", rrow, ccol]);
            return;
        }
    }
    ;
    game.shouldSlowlyAppear = function (rrow, ccol) {
        return delta !== undefined &&
            delta.row === rrow &&
            delta.col === ccol;
    };
    game.isEmpty = function (rrow, ccol) {
        return game.board[rrow][ccol] !== undefined &&
            game.board[rrow][ccol] === '';
    };
    game.onDropComplete = function (data, event, row, col) {
        console.log("onDropComplete happened!", arguments);
        notifications = "Dropped piece " + data + " in " + row + "x" + col;
        console.log(isYourTurn);
        if (!isYourTurn || data === 2) {
            notifications = "You can't use that piece.";
            return;
        }
        try {
            var delta = { row: row, col: col };
            var move = gameLogic.createMove(boardbeforeMove, game.board, delta, captured, passes, turnIndex);
            boardbeforeMove = game.board;
            isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        }
        catch (e) {
            console.log(["Cannot make move:", row, col]);
            return;
        }
    };
})(game || (game = {}));
angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
    .run(function () {
    $rootScope['game'] = game;
    translate.setLanguage('en', {
        RULES_OF_GO: "New to GO?",
        RULES_SLIDE1: "There are essentially only two rules in GO",
        RULES_SLIDE2: "Rule 1 (the rule of liberty) states that every stone remaining on the board must have at least one open \"point\" (an intersection, called a \"liberty\") directly next to it (up, down, left, or right)",
        RULES_SLIDE3: "Stones or groups of stones which lose their last liberty are removed from the board.",
        RULES_SLIDE4: "Rule 2 (the \"ko rule\") states that the stones on the board must never repeat a previous position of stones. Moves which would do so are forbidden, and thus only moves elsewhere on the board are permitted that turn.",
        PASS: "PASS",
        END_MATCH: "END MATCH",
        GAME_OVER: "GAME OVER",
        CLOSE: "Close"
    });
    game.init();
});
