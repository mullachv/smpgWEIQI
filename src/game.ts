module game {

  let jsonState:any = null;
  export let board:any = null;
  let delta:any;
  let captured:any;
  let passes:any;
  let notifications:any;
  let turnIndex:any;
  var computerTurn:any;
  let clickToDragPiece:any;
  let boardbeforeMove:any;
  let isYourTurn:any;
  let msg:any;

  export let numberOfRowsAndCols = 19;
  export let boardSrc = 'imgs/board_19x19_2.png';
  var rowsNum = numberOfRowsAndCols;
  var colsNum = numberOfRowsAndCols;


//window.touchElementId = "boardArea";

// angular.module('myApp').controller('Ctrl',
//     ['$rootScope', '$scope', '$log', '$timeout',
//         'gameService', 'gameLogic',
//         'resizeGameAreaService','dragAndDropService',
//         function ($rootScope, $scope, $log, $timeout,
//                   gameService, gameLogic, resizeGameAreaService,dragAndDropService) {

  export function init() {
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
    updateUI({stateAfterMove: {}, turnIndexAfterMove: 0, yourPlayerIndex: -2});

  }


    // var moveAudio = new Audio('audio/move.wav');
    // moveAudio.load();
    export let getButtonValue = function() {
        switch (passes) {
            case 0: return 'PASS';
            case 1: return 'END_MATCH';
            case 2: return 'GAME_OVER';
            default: return 'PASS';
        }
    }

	/*global variables*/

    export let hidePassButton = function() {
        return computerTurn;
    }

    if (window.location.search === '?boardSize=9') {
        numberOfRowsAndCols = 9;
        boardSrc = 'imgs/board.png';
    }

    if (window.location.search === '?boardSize=19') {
        numberOfRowsAndCols = 19;
        boardSrc = 'imgs/board_19x19_2.png';
    }

        if (window.location.search === '?boardSize=13') {
        numberOfRowsAndCols = 13;
        boardSrc = 'imgs/board1313.png';
    }
    export let getIntegersTill = function (number:any) {
        var res:any = [];
        for (var i = 0; i < number; i++) {
          res.push(i);
        }
        return res;
      }

	function handleDragEvent(type:any, clientX:any, clientY:any){
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
		if (board[row][col] === 'X' || board[row][col] === 'O') {
			return;
		}
		clickToDragPiece.style.display = "inline";
        draggingLines.style.display = "inline";
		var centerXY = getSquareCenterXY(row, col);
        verticalDraggingLine.setAttribute("x1", ""+centerXY.x);
        verticalDraggingLine.setAttribute("x2", ""+centerXY.x);
        horizontalDraggingLine.setAttribute("y1", ""+centerXY.y);
        horizontalDraggingLine.setAttribute("y2", ""+centerXY.y);
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
	function getSquareTopLeft(row:any, col:any) {
        var size = getSquareWidthHeight();
        return {top: row * size.height, left: col * size.width}
    }
	function getSquareWidthHeight() {
		var boardArea = document.getElementById("boardArea");
        return {
          width: boardArea.clientWidth / (colsNum),
          height: boardArea.clientHeight / (rowsNum)
        };
    }
    function getSquareCenterXY(row:any, col:any) {
        var size = getSquareWidthHeight();
        return {
			x: col * size.width + size.width / 2,
			y: row * size.height + size.height / 2
        };
    }
	function dragDone(row:any, col:any) {
        $rootScope.$apply(function () {
          var lmsg = "Dragged to " + row + "x" + col;
          console.log(lmsg);
          msg = lmsg;
		      cellClicked(row, col);
        });
    }

    function sendComputerMove() {
        gameService.makeMove(
                gameLogic.createComputerMove(boardbeforeMove, board,
                        captured,
                        passes,
                        turnIndex)
                );
    }

    function updateUI(params:any) {
        jsonState = angular.toJson(params.stateAfterMove, true);
        board = params.stateAfterMove.board;
        delta = params.stateAfterMove.delta;
        captured = params.stateAfterMove.captured;
        passes = params.stateAfterMove.passes;
        // Set initial state, or reset if somehow invalid
        if (board === undefined || captured === undefined ||
                passes === undefined) {
            board = gameLogic.getInitialBoard();
            captured = {black: 0, white: 0};
            passes = 0;
            notifications = "Nothing was dragged";
        } else {
           // moveAudio.play();
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


    export let passClicked = function () {
        //Clicking on the CLICK TO PASS button triggers this function
        //It will increment the number of passes.
        //The fraction indicates in the button notes how many
        //consecutive passes have been made (2 ends the game).
        console.log(["Clicked on pass.", passes]);
        if (!isYourTurn) {
            return;
        }
        try {
            var delta = {row: -1, col: -1};
            var move = gameLogic.createMove(boardbeforeMove, board, delta, captured, passes, turnIndex);
             boardbeforeMove = board;
            isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        } catch (e) {
            console.log(["Cannot pass.", passes]);
            return;
        }
    };

	function cellClicked(rrow:any, ccol:any) {
        console.log(["Clicked on cell:", rrow, ccol]);
        if (!isYourTurn) {
            return;
        }
        try {
            var delta = {row: rrow, col: ccol};
            var move = gameLogic.createMove(boardbeforeMove, board, delta, captured, passes, turnIndex);
            boardbeforeMove = board;
            isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        } catch (e) {
            console.log(["Cannot make move:", rrow, ccol]);
            return;
        }
    };
    export let shouldSlowlyAppear = function (rrow:any, ccol:any) {
        return delta !== undefined &&
                delta.row === rrow &&
                delta.col === ccol;
    };
    export let isEmpty = function (rrow:any, ccol:any) {
        return board[rrow][ccol] !== undefined &&
                board[rrow][ccol] === '';
    };

    export let onDropComplete = function (data:any, event:any, row:any, col:any) {
        console.log("onDropComplete happened!", arguments);
        notifications = "Dropped piece " + data + " in " + row + "x" + col;
        console.log(isYourTurn);
        if (!isYourTurn || data===2) {
            notifications = "You can't use that piece.";
            return;
        }
        try {
            var delta = {row: row, col: col};
            var move = gameLogic.createMove(boardbeforeMove, board, delta, captured, passes, turnIndex);
            boardbeforeMove = board;
            isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        } catch (e) {
            console.log(["Cannot make move:", row, col]);
            return;
        }
      };
    //scaleBodyService.scaleBody({width: 450, height: 500});


}

angular.module('myApp', ['ngTouch', 'ui.bootstrap', 'gameServices'])
.run(function(){
  $rootScope['game'] = game;
    translate.setLanguage('en',{
    RULES_OF_GO:"New to GO?",
    RULES_SLIDE1:"There are essentially only two rules in GO",
    RULES_SLIDE2:"Rule 1 (the rule of liberty) states that every stone remaining on the board must have at least one open \"point\" (an intersection, called a \"liberty\") directly next to it (up, down, left, or right)",
    RULES_SLIDE3:"Stones or groups of stones which lose their last liberty are removed from the board.",
    RULES_SLIDE4:"Rule 2 (the \"ko rule\") states that the stones on the board must never repeat a previous position of stones. Moves which would do so are forbidden, and thus only moves elsewhere on the board are permitted that turn.",
    PASS:"PASS",
    END_MATCH:"END MATCH",
    GAME_OVER:"GAME OVER",
    CLOSE:"Close"
    });
    game.init();
});
