'use strict';

// TODO: remove stateService before launching the game.
angular.module('myApp',
    ['myApp.messageService', 'myApp.gameLogic', 'myApp.scaleBodyService','platformApp'])
  .controller('Ctrl', function (
      $window, $scope, $log,
      messageService, scaleBodyService, stateService, gameLogic) {

var isLocalTesting = $window.parent === $window;

    function updateUI(params) {
      $scope.jsonState = angular.toJson(params.stateAfterMove, true);
      $scope.board = params.stateAfterMove.board;
      $scope.captured = params.stateAfterMove.captured;
      $scope.passes = params.stateAfterMove.passes;
      // Set initial state, or reset if somehow invalid
      if ($scope.board === undefined || $scope.captured === undefined || 
              $scope.passes === undefined) {
        $scope.board = gameLogic.getInitialBoard();
        $scope.captured = {black: 0, white: 0};
        $scope.passes = 0;
      }
      $scope.isYourTurn = params.turnIndexAfterMove >= 0 &&
              params.yourPlayerIndex === params.turnIndexAfterMove;
      $scope.turnIndex = params.turnIndexAfterMove;
    }
    
    function sendMakeMove(move) {
        $log.info(["Making move:", move]);
        if(isLocalTesting) {
            stateService.makeMove(move);
        } else {
            messageService.sendMessage({makeMove: move});
        }
    }
    
    updateUI({stateAfterMove: {}, turnIndexAfterMove: 0, yourPlayerIndex: -2});
    var game = {
      gameDeveloperEmail: "vangieshue@gmail.com",
      minNumberOfPlayers: 2,
      maxNumberOfPlayers: 2,
      exampleGame: gameLogic.getExampleGame(),
      riddles: gameLogic.getRiddles()
    };
    
    $scope.passClicked = function () {
        //Clicking on the CLICK TO PASS button triggers this function
        //It will increment the number of passes.
        //The fraction indicates in the button notes how many
        //consecutive passes have been made (2 ends the game).
        $log.info(["Clicked on pass.",$scope.passes]);
        if (!$scope.isYourTurn) {
            return;
        }
        try {
            $scope.delta = {row: -1, col: -1};
            var move = gameLogic.createMove($scope.board, $scope.delta, $scope.captured, $scope.passes, $scope.turnIndex);
            $scope.isYourTurn = false; // Prevent new move
            sendMakeMove(move);
        } catch (e) {
            $log.info(["Cannot pass.", $scope.passes]);
            return;
        }
    };
    
    $scope.cellClicked = function (row, col) {
        $log.info(["Clicked on cell:", row, col]);
        if (!$scope.isYourTurn) {
            return;
        }
        try {
            $scope.delta = {row: row, col: col};
            var move = gameLogic.createMove($scope.board, $scope.delta, $scope.captured, $scope.passes, $scope.turnIndex);
            $scope.isYourTurn = false; // Prevent new move
            // Insert Animations & send makeMove
            sendMakeMove(move);
        } catch (e) {
            $log.info(["Cannot make move:", row, col]);
            return;
        }
    };
    
    scaleBodyService.scaleBody({width: 450, height: 450});
    
    if (isLocalTesting) {
      game.isMoveOk = gameLogic.isMoveOk;
      game.updateUI = updateUI;
      stateService.setGame(game);
    } else {
      messageService.addMessageListener(function (message) {
        if (message.isMoveOk !== undefined) {
          var isMoveOkResult = gameLogic.isMoveOk(message.isMoveOk);
          messageService.sendMessage({isMoveOkResult: isMoveOkResult});
        } else if (message.updateUI !== undefined) {
          updateUI(message.updateUI);
        }
      });

      messageService.sendMessage({gameReady : game});
    }
  });
