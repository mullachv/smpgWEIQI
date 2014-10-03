'use strict';

// TODO: remove stateService before launching the game.
angular.module('myApp',
    ['myApp.messageService', 'myApp.gameLogic', 'platformApp'])
  .controller('Ctrl', function (
      $window, $scope, $log,
      messageService, stateService, gameLogic) {

var BOARDDIMENSION = 9;
function createNewBoard() {
        var rows = BOARDDIMENSION;
        var cols = BOARDDIMENSION;
        var array = [], row = [];
        while (cols--)
            row.push('');
        while (rows--)
            array.push(row.slice());
        return array;
    }

    function updateUI(params) {
      $scope.jsonState = angular.toJson(params.stateAfterMove, true);
      $scope.board = params.stateAfterMove.board;
      if ($scope.board === undefined) {
        $scope.board = createNewBoard();
      }
    }
    updateUI({stateAfterMove: {}});
    var game = {
      gameDeveloperEmail: "vangieshue@gmail.com",
      minNumberOfPlayers: 2,
      maxNumberOfPlayers: 2,
      exampleGame: gameLogic.getExampleGame(),
      riddles: gameLogic.getRiddles()
    };

    var isLocalTesting = $window.parent === $window;
    $scope.move = "[{setTurn: {turnIndex: 1}}, {set: {key: 'board', value:[['X', '', '','','','','','',''], ['', '', '','','','','','',''], ['', '', '','','','','','',''], ['', '', '','','','','','',''], ['', '', '','','','','','',''], ['', '', '','','','','','',''], ['', '', '','','','','','',''], ['', '', '','','','','','',''], ['', '', '','','','','','','']]}}, {set: {key: 'delta', value: {row: 0, col: 0}}}, {set: {key: 'captured', value: {black: 0, white: 0}}}, {set: {key: 'passes', value: 0}}]";
    $scope.makeMove = function () {
      $log.info(["Making move:", $scope.move]);
      var moveObj = eval($scope.move);
      if (isLocalTesting) {
        stateService.makeMove(moveObj);
      } else {
        messageService.sendMessage({makeMove: moveObj});
      }
    };

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
