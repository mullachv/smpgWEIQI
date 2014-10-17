'use strict';

angular.module('myApp', ['ngTouch']).controller('Ctrl', function (
        $window, $scope, $log, $timeout,
        gameService, scaleBodyService, gameLogic) {

    var moveAudio = new Audio('audio/move.wav');
    moveAudio.load();

    function sendComputerMove() {
        gameService.makeMove(
                gameLogic.createComputerMove($scope.board,
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
        } else {
            moveAudio.play();
        }
        $scope.isYourTurn = params.turnIndexAfterMove >= 0 &&
                params.yourPlayerIndex === params.turnIndexAfterMove;
        $scope.turnIndex = params.turnIndexAfterMove;

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
            var move = gameLogic.createMove($scope.board, delta, $scope.captured, $scope.passes, $scope.turnIndex);
            $scope.isYourTurn = false; // Prevent new move
            gameService.makeMove(move);
        } catch (e) {
            $log.info(["Cannot pass.", $scope.passes]);
            return;
        }
    };

    $scope.cellClicked = function (rrow, ccol) {
        $log.info(["Clicked on cell:", rrow, ccol]);
        if (!$scope.isYourTurn) {
            return;
        }
        try {
            var delta = {row: rrow, col: ccol};
            var move = gameLogic.createMove($scope.board, delta, $scope.captured, $scope.passes, $scope.turnIndex);
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

    scaleBodyService.scaleBody({width: 450, height: 475});

    gameService.setGame({
        gameDeveloperEmail: "vangie.shue@gmail.com",
        minNumberOfPlayers: 2,
        maxNumberOfPlayers: 2,
        exampleGame: gameLogic.getExampleGame(),
        riddles: gameLogic.getRiddles(),
        isMoveOk: gameLogic.isMoveOk,
        updateUI: updateUI
    });
});
