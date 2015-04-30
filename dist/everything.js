angular.module('myApp',[]).factory('gameLogic', function () {

    'use strict';

    
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
        return angular.equals(object1, object2)
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

    // returns copy of JS object
    function copyObject(object) {
        return JSON.parse(JSON.stringify(object));
    }

    //Helper for getSets
    function getWeb(color, row, col, board) {
        var points = [];
        var leader = createNewBoard();
        
        function tryPoints(row, col) {
            points.push([row,col]);
            leader[row][col]=color;
            if(row-1>=0 && leader[row-1][col]==='' && board[row-1][col]===color) 
            { tryPoints(row-1, col); }
            if(row+1<dim && leader[row+1][col]==='' && board[row+1][col]===color) 
            { tryPoints(row+1, col); }
            if(col+1<dim && leader[row][col+1]==='' && board[row][col+1]===color) 
            { tryPoints(row, col+1); }
            if(col-1>=0 && leader[row][col-1]==='' && board[row][col-1]===color) 
            { tryPoints(row, col-1); }
        }
        
        tryPoints(row, col);
        return {willadd: points, links: leader};
    }
    //Helper for getSets
    function mergeBoards(leader, links) {
        var finalleader = copyObject(leader);
        var row, col;
        for (row = 0; row < dim; row++) {
            for (col = 0; col < dim; col++) {
                if(links[row][col]!=='') {
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
                if(board[row][col]==='X' && leaderX[row][col]==='') {
                    connectInfo=getWeb('X', row, col, board);
                    setsX.push(copyObject(connectInfo.willadd));
                    leaderX = mergeBoards(leaderX, connectInfo.links);
                } else if(board[row][col]==='O' && leaderO[row][col]==='') {
                    connectInfo=getWeb('O', row, col, board);
                    setsO.push(copyObject(connectInfo.willadd));
                    leaderO = mergeBoards(leaderO, connectInfo.links);
                }
            }
        }
        return {black: setsX, white: setsO};
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
        }
        result = getLiberties(boardAfterEval, black);
        capturedAfterEval.black = captured.black + result.captured;
        boardAfterEval = copyObject(result.board);
        if (turn === 1) {
            result = getLiberties(boardAfterEval, white);
            capturedAfterEval.white = captured.white + result.captured;
            boardAfterEval = copyObject(result.board);
        }

        return {board: boardAfterEval, captured: capturedAfterEval};
    }

    // getWinner determines winner based on captured stones
    function getWinner(captured) {
        var winner = 'O';
        if (captured.black - captured.white === 0) {
            winner = '';
        } else if (captured.white > captured.black) {
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
                delta = {row: i, col: j};
                try {
                    testmove = createMove(boardbeforeMove, board, delta, captured, passes, turnIndexBeforeMove);
                    newcaptured = testmove[3].set.value;
                    if ((turnIndexBeforeMove===0 && newcaptured.white>captured.white)
                            || (turnIndexBeforeMove===1 && newcaptured.black>captured.black)) {
                        return testmove;
                    }
                    if (!(turnIndexBeforeMove===0 && newcaptured.black>captured.black)
                            && !(turnIndexBeforeMove===1 && newcaptured.white>captured.white)) {
                        possibleMoves.push(testmove);
                    }
                } catch (e) {
                    // cell in that position was full
                }
            }
        }
        try {
            delta = {row: -1, col: -1};
            testmove = createMove(boardbeforeMove, board, delta, captured, passes, turnIndexBeforeMove);
            possibleMoves.push(testmove);
        } catch (e) {
            // Couldn't add pass as a move?
        }
            var randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            return randomMove;
    }

    function getboardNum (board, turnIndex) {
        var sum = 0;
        var i, j;
        var color = turnIndex ? 'O' : 'X';
        for (i = 0; i < dim; i ++)
            for (j = 0; j < dim; j ++)
                if (board [i][j] === color)
                    sum ++;
        return sum;
    }

    // returns state that should be produced by making move 'delta'
    function createMove(boardbeforeMove, board, delta, captured, passes, turnIndexBeforeMove) {
        // instantiate values if stateBeforeMove was {}
        
        if (captured === undefined) {
            captured = {black: 0, white: 0};
        }
        if (passes === undefined) {
            passes = 0;
        }
        if (board === undefined) {
            board = createNewBoard();
        }

        if (boardbeforeMove === undefined)
            boardbeforeMove = createNewBoard ();

        var setnumBefore, setnumAfter;

        setnumBefore = getboardNum (board, turnIndexBeforeMove);

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
        } else if (boardAfterMove[row][col] !== '') {
            // if space isn't '' then bad move
            throw Error('Space is not empty!');
        } else {
            // else make the move/change the board
            // bad delta should automatically throw error
            boardAfterMove[row][col] = turnIndexBeforeMove === 0 ? 'X' : 'O';
            passesAfterMove = 0; //if a move is made, passes is reset
            // evaluate board to see if any players captured new pieces
            var stateAfterEval = evaluateBoard(boardAfterMove, captured, turnIndexBeforeMove);
            boardAfterMove = stateAfterEval.board;
            capturedAfterMove = stateAfterEval.captured;
        }

        setnumAfter = getboardNum (boardAfterMove, turnIndexBeforeMove);

        if (setnumAfter <= setnumBefore && setnumAfter > 0 && passes === 0 && passesAfterMove === 0)
            throw Error ('you can not suicide.');

        if (angular.equals (boardbeforeMove, boardAfterMove) && passes === 0 && passesAfterMove === 0)
            throw Error ("don’t allow a move that brings the game back to stateBeforeMove.");

        var firstOperation; // Either endMatchScores or setTurn
        if (passesAfterMove === 2) {
            // 2 passes means players have decided to end game
            var winner = getWinner(capturedAfterMove);
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

            // createMove will return the expected state
            var expectedMove = createMove(stateBeforeMove.boardbeforeMove, stateBeforeMove.board,
                    deltaValue,
                    stateBeforeMove.captured,
                    stateBeforeMove.passes,
                    turnIndexBeforeMove);
            // which should match the passed 'move' object
            if (!isEqual(move, expectedMove)) {
                return false;
            }
        } catch (e) {
            return false;
        }
        return true;
    }

    // Returns an array of (stateBeforeMove, move, comment)
    // function getExampleMoves(initialTurnIndex, initialState, arrayOfRowColComment) {
    //     var exampleMoves = [];
    //     var state = initialState;
    //     var turnIndex = initialTurnIndex;
    //     for (var i = 0; i < arrayOfRowColComment.length; i++) {
    //         var rowColComment = arrayOfRowColComment[i];
    //         var move = createMove(state.boardbeforeMove, state.board, rowColComment,
    //                 state.captured, state.passes, turnIndex
    //                 );
    //         var stateAfterMove = {board: move[1].set.value,
    //             delta: move[2].set.value,
    //             captured: move[3].set.value,
    //             passes: move[4].set.value
    //         };
    //         exampleMoves.push({
    //             stateBeforeMove: state,
    //             stateAfterMove: stateAfterMove,
    //             turnIndexBeforeMove: turnIndex,
    //             turnIndexAfterMove: 1 - turnIndex,
    //             move: move,
    //             comment: {end: rowColComment.comment}
    //         });
    //         state = stateAfterMove;
    //         turnIndex = 1 - turnIndex;
    //     }
    //     return exampleMoves;
    // }

    // Simple game that shows a capture
    // function getExampleGame() {
    //     return getExampleMoves(0, {}, [
    //         {row: 0, col: 0, comment: "Black always starts. Starting at the corner is not usually a good idea because you have only 2 liberties available."},
    //         {row: 0, col: 1, comment: "White places a stone next to black. Black still has one liberty at [1,0] so it is not captured."},
    //         {row: 1, col: 1, comment: "Black now covers 2 of the white stone's liberties. The white stone still has one liberty at [0,2]."},
    //         {row: 1, col: 2, comment: "White makes a poor move."},
    //         {row: 0, col: 2, comment: "Black captures White's first stone by covering all its possible liberties."},
    //         {row: -1, col: -1, comment: "White passes its turn by not playing. However, 2 consecutive passes are required to end a game."},
    //         {row: 2, col: 2, comment: "Black can play anyway and continue the game."},
    //         {row: -1, col: -1, comment: "White passes its turn again by not playing."},
    //         {row: -1, col: -1, comment: "Black agrees to end the game by passing its turn."}
    //     ]);
    // }
    // // A few riddles, even though game is not really deterministic
    // function getRiddles() {
    //     var board1 = createNewBoard();
    //     board1[0, 1] = 'O';
    //     board1[1] = ['X', 'X', 'O', 'X', '', '', '', '', ''];
    //     board1[2] = ['', 'O', 'X', 'O', '', '', '', '', ''];

    //     var board2 = createNewBoard();
    //     board2[0, 1] = 'O';
    //     board2[1] = ['O', 'X', 'O', '', '', '', '', '', ''];
    //     board2[2] = ['O', 'X', 'O', '', '', '', '', '', ''];

    //     return [
    //         getExampleMoves(0,
    //                 {
    //                     board: board1,
    //                     delta: {row: 2, col: 3},
    //                     captured: {black: 0, white: 0},
    //                     passes: 0
    //                 },
    //         [
    //             {row: 0, col: 2, comment: "Find the position for Black that will capture a white piece."}
    //         ]
    //                 ),
    //         getExampleMoves(0,
    //                 {
    //                     board: board2,
    //                     delta: {row: 2, col: 2},
    //                     captured: {black: 0, white: 0},
    //                     passes: 0
    //                 },
    //         [
    //             {row: 3, col: 1, comment: "Find the position for Black that will prevent white from capturing it in its next move."}
    //         ]
    //                 )
    //     ];
    // }


    this.isMoveOk = isMoveOk;
    // this.getExampleGame = getExampleGame;
    // this.getRiddles = getRiddles;
    this.getInitialBoard = getInitialBoard;
    this.createMove = createMove;
    this.createComputerMove = createComputerMove;
    
    this.getSets = getSets;
    return {isMoveOk: isMoveOk, getInitialBoard: getInitialBoard, createComputerMove: createComputerMove, createMove: createMove};
});
;window.touchElementId = "boardArea";
angular.module('myApp').controller('Ctrl',
    ['$rootScope', '$scope', '$log', '$timeout',
        'gameService', 'gameLogic',
        'resizeGameAreaService',
        function ($rootScope, $scope, $log, $timeout,
                  gameService, gameLogic, resizeGameAreaService) {

    'use strict';        

	resizeGameAreaService.setWidthToHeight(0.8);
    // var moveAudio = new Audio('audio/move.wav');
    // moveAudio.load();
	


	/*global variables*/

    $scope.numberOfRowsAndCols = 19;
    $scope.boardSrc = 'imgs/board_19x19_2.png';
    
    if (window.location.search === '?boardSize=9') {
        $scope.numberOfRowsAndCols = 9;
        $scope.boardSrc = 'imgs/board.png';
    }

    if (window.location.search === '?boardSize=19') {
        $scope.numberOfRowsAndCols = 19;
        $scope.boardSrc = 'imgs/board_19x19_2.png';
    }

        if (window.location.search === '?boardSize=13') {
        $scope.numberOfRowsAndCols = 13;
        $scope.boardSrc = 'imgs/board1313.png';
    }
    var rowsNum = $scope.numberOfRowsAndCols;
    var colsNum = $scope.numberOfRowsAndCols;

    $scope.getIntegersTill = function (number) {
        var res = [];
        for (var i = 0; i < number; i++) {
          res.push(i);
        }
        return res;
      }
	/*global variables*/
	window.handleDragEvent = handleDragEvent;
	function handleDragEvent(type, clientX, clientY){
		
		var draggingLines = document.getElementById("draggingLines");
		var horizontalDraggingLine = document.getElementById("horizontalDraggingLine");
		var verticalDraggingLine = document.getElementById("verticalDraggingLine");
		//var clickToDragPiece = document.getElementById("clickToDragPiece");
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
          draggingLines.style.displagy = "none";
		  clickToDragPiece.style.display = "none";
          return;
        }
		// Inside gameArea. Let's find the containing square's row and col
        var col = Math.floor(colsNum * x / boardArea.clientWidth);
        var row = Math.floor(rowsNum * y / boardArea.clientHeight);
		// if the cell is not empty, don't preview the piece, but still show the dragging lines
		if ($scope.board[row][col] === 'X' || $scope.board[row][col] === 'O') {
			return;
		}
		clickToDragPiece.style.display = "inline";
        draggingLines.style.display = "inline";
		var centerXY = getSquareCenterXY(row, col);
        verticalDraggingLine.setAttribute("x1", centerXY.x);
        verticalDraggingLine.setAttribute("x2", centerXY.x);
        horizontalDraggingLine.setAttribute("y1", centerXY.y);
        horizontalDraggingLine.setAttribute("y2", centerXY.y);
		// show the piece
		//var cell = document.getElementById('board' + row + 'x' + col).className = $scope.turnIndex === 0 ? 'black' : 'white';
		
		
        var topLeft = getSquareTopLeft(row, col);
		var circle = document.getElementById("circle");
		circle.setAttribute("fill", $scope.turnIndex === 0 ? 'black' : 'white');
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
        return {top: row * size.height, left: col * size.width}
    }
	function getSquareWidthHeight() {
		var boardArea = document.getElementById("boardArea");
        return {
          width: boardArea.clientWidth / colsNum,
          height: boardArea.clientHeight / rowsNum
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
          var msg = "Dragged to " + row + "x" + col;
          $log.info(msg);
          $scope.msg = msg;
		  cellClicked(row, col);
        });
    }

    function sendComputerMove() {
        gameService.makeMove(
                gameLogic.createComputerMove($scope.boardbeforeMove, $scope.board,
                        $scope.captured,
                        $scope.passes,
                        $scope.turnIndex)
                );
    }

    function updateUI(params) {
        $scope.jsonState = angular.toJson(params.stateAfterMove, true);
        $scope.board = params.stateAfterMove.board;
        $scope.delta = params.stateAfterMove.delta;
        $scope.captured = params.stateAfterMove.captured;
        $scope.passes = params.stateAfterMove.passes;
        // Set initial state, or reset if somehow invalid
        if ($scope.board === undefined || $scope.captured === undefined ||
                $scope.passes === undefined) {
            $scope.board = gameLogic.getInitialBoard();
            $scope.captured = {black: 0, white: 0};
            $scope.passes = 0;
            $scope.notifications = "Nothing was dragged";
        } else {
           // moveAudio.play();
        }
        $scope.isYourTurn = params.turnIndexAfterMove >= 0 &&
                params.yourPlayerIndex === params.turnIndexAfterMove;
        $scope.turnIndex = params.turnIndexAfterMove;
        //$log.info("updateUI: ", $scope.turnIndex);

        // Is it the computer's turn?
        if ($scope.isYourTurn && params.playersInfo[params.yourPlayerIndex].playerId === '') {
            // Wait 500ms for animation to end
            $timeout(sendComputerMove, 1000);
        }
    }

    // Before updateUI, show an empty board to viewer (so you can't perform moves)
    updateUI({stateAfterMove: {}, turnIndexAfterMove: 0, yourPlayerIndex: -2});

    $scope.passClicked = function () {
        //Clicking on the CLICK TO PASS button triggers this function
        //It will increment the number of passes.
        //The fraction indicates in the button notes how many
        //consecutive passes have been made (2 ends the game).
        $log.info(["Clicked on pass.", $scope.passes]);
        if (!$scope.isYourTurn) {
            return;
        }
        try {
            var delta = {row: -1, col: -1};
            var move = gameLogic.createMove($scope.boardbeforeMove, $scope.board, delta, $scope.captured, $scope.passes, $scope.turnIndex);
             $scope.boardbeforeMove = $scope.board;
            $scope.isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        } catch (e) {
            $log.info(["Cannot pass.", $scope.passes]);
            return;
        }
    };

	function cellClicked(rrow, ccol) {
        $log.info(["Clicked on cell:", rrow, ccol]);
        if (!$scope.isYourTurn) {
            return;
        }
        try {
            var delta = {row: rrow, col: ccol};
            var move = gameLogic.createMove($scope.boardbeforeMove, $scope.board, delta, $scope.captured, $scope.passes, $scope.turnIndex);
            $scope.boardbeforeMove = $scope.board;
            $scope.isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        } catch (e) {
            $log.info(["Cannot make move:", rrow, ccol]);
            return;
        }
    };
    $scope.shouldSlowlyAppear = function (rrow, ccol) {
        return $scope.delta !== undefined &&
                $scope.delta.row === rrow &&
                $scope.delta.col === ccol;
    };
    $scope.isEmpty = function (rrow, ccol) {
        return $scope.board[rrow][ccol] !== undefined &&
                $scope.board[rrow][ccol] === '';
    };

    $scope.onDropComplete = function (data, event, row, col) {
        $log.info("onDropComplete happened!", arguments);
        $scope.notifications = "Dropped piece " + data + " in " + row + "x" + col;
        $log.info($scope.isYourTurn);
        if (!$scope.isYourTurn || data===2) {
            $scope.notifications = "You can't use that piece.";
            return;
        }
        try {
            var delta = {row: row, col: col};
            var move = gameLogic.createMove($scope.boardbeforeMove, $scope.board, delta, $scope.captured, $scope.passes, $scope.turnIndex);
            $scope.boardbeforeMove = $scope.board;
            $scope.isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        } catch (e) {
            $log.info(["Cannot make move:", row, col]);
            return;
        }
      };
    //scaleBodyService.scaleBody({width: 450, height: 500});
    
    gameService.setGame({
        gameDeveloperEmail: "zhuangzeleng1992@gmail.com",
        minNumberOfPlayers: 2,
        maxNumberOfPlayers: 2,
        // exampleGame: gameLogic.getExampleGame(),
        // riddles: gameLogic.getRiddles(),
        isMoveOk: gameLogic.isMoveOk,
        updateUI: updateUI
    });
}]);
