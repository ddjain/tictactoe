var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $http, $timeout, $location) {

  var server =  $location.absUrl();

  var socket = io.connect(server);
  var initBoard = {};

  /////////////////GAME FUNCTIONS///////////
  var PLAYER_1 = "Player1";
  var PLAYER_2 = "Player2";
  var EMPTY_PROPERTY = "NONE";

  //Error Messages
  const ERROR_MESSAGE_BOX_ALREADY_SELECTED = "This box is already selected";
  const ERROR_MESSAGE_NOT_YOUR_TURN = "This is not your turn";

  const PATH_IMAGE_CROSS = "/img/cross.png"; 
  const PATH_IMAGE_ROUND = "/img/round.png";
  const PATH_INIT_BOARD_DATA = "../init/BoardInit.json"

  ///EVENTS
  const CTX_EVENT_CREATE_ROOM = "createRoom";
  const CTX_EVENT_JOIN_ROOM = "joinRoom";
  const CTX_EVENT_ON_ROOM_CREATE_SUCCESS = "onRoomCreateSuccess";
  const CTX_EVENT_ON_ROOM_JOIN_SUCCESS = "onRoomJoinSuccess";
  const CTX_EVENT_ON_ROOM_CREATE_ERROR = 'onRoomCreateError';
  const CTX_EVENT_ON_ROOM_JOIN_ERROR = 'onRoomJoinError';
  const CTX_EVENT_ON_ROOM_JOIN_BY_PLAYER_2 = 'OnRoomJoined';
  const CTX_EVENT_ON_GAME_REFRESHED = 'refreshGame'
  const CTX_EVENT_ON_GAME_WIN = 'gameWin';
  const CTX_EVENT_ON_GAME_DATA_UPDATE = "updateGame";
  const CTX_EVENT_ON_GAME_WIN_DECLARE = 'onGameWin';

  $scope.err = '';
  $scope.success = '';
  $scope.turn = PLAYER_1;

  $scope.selectBox = function (box) {
    if (box.isSelected == true) {
      showError(ERROR_MESSAGE_BOX_ALREADY_SELECTED);
      return
    }
    else if ($scope.game.turn == $scope.Me) {
      box.player = $scope.Me;
      box.isSelected = true;
      $scope.game.turn = $scope.opponanat
      socket.emit(CTX_EVENT_ON_GAME_DATA_UPDATE, { game: $scope.game })
    }
    else {
      showError(ERROR_MESSAGE_NOT_YOUR_TURN);
    }
  }

  $scope.getImage = function (box) {
    if (box.player == PLAYER_1) {
      return PATH_IMAGE_CROSS
    }
    else if (box.player == PLAYER_2) {
      return PATH_IMAGE_ROUND;
    }
  }

  function getBoardInitData() {
    $http.get(PATH_INIT_BOARD_DATA)
      .then(function (response) {
        $scope.game = response.data;
      });
  }

  function showError(msg) {
    alert(msg);
    $scope.err = msg;
    $timeout(function () {
      $scope.err = '';
    }, 3000);
  }

  function showSuccess(msg) {
    alert(msg);
    $scope.success = msg;
    $timeout(function () {
      $scope.success = '';
    }, 3000);
  }

  function checkWinCondition() {
    var board = $scope.game.board;
    for (var i = 0; i < board.length; i++) {
      if ((board[i].column[0].player != EMPTY_PROPERTY && board[i].column[1].player != EMPTY_PROPERTY && board[i].column[2].player != EMPTY_PROPERTY)
        && (board[i].column[0].player == board[i].column[1].player && board[i].column[1].player == board[i].column[2].player)) {
        $scope.game.winner = board[i].column[0].player
        socket.emit(CTX_EVENT_ON_GAME_WIN, { game: $scope.game })
        return;
      }
    }
    for (var i = 0; i < board[0].column.length; i++) {
      if ((board[0].column[i].player != EMPTY_PROPERTY && board[1].column[i].player != EMPTY_PROPERTY && board[2].column[i].player != EMPTY_PROPERTY) && (board[0].column[i].player == board[1].column[i].player && board[1].column[i].player == board[2].column[i].player)) {
        $scope.game.winner = board[i].column[0].player
        socket.emit(CTX_EVENT_ON_GAME_WIN, { game: $scope.game })
        return;
      }
    }

    if ((board[0].column[0].player != EMPTY_PROPERTY && board[1].column[1].player != EMPTY_PROPERTY && board[2].column[2].player != EMPTY_PROPERTY)
      && (board[0].column[0].player == board[1].column[1].player && board[1].column[1].player == board[2].column[2].player)
    ) {
      $scope.game.winner = board[0].column[0].player
      socket.emit(CTX_EVENT_ON_GAME_WIN, { game: $scope.game })
      return;
    }

    if ((board[0].column[2].player != EMPTY_PROPERTY && board[1].column[1].player != EMPTY_PROPERTY && board[2].column[0].player != EMPTY_PROPERTY)
      && (board[0].column[2].player == board[1].column[1].player && board[1].column[1].player == board[2].column[0].player)
    ) {
      $scope.game.winner = board[0].column[2].player
      socket.emit(CTX_EVENT_ON_GAME_WIN, { game: $scope.game })
      return;
    }
  }
  /////////////////GAME FUNCTIONS END///////////

  /////////////////ROOOM FUNCTIONS///////////
  $scope.createRoom = function () {
    socket.emit(CTX_EVENT_CREATE_ROOM, { roomName: $scope.roomName })
  }

  $scope.joinRoom = function () {
    socket.emit(CTX_EVENT_JOIN_ROOM, { roomName: $scope.roomName })
  }

  socket.on(CTX_EVENT_ON_ROOM_CREATE_SUCCESS, function (data) {
    $scope.game.roomName = data.name;
    showSuccess(data.msg);
    $scope.waiting = true;
  });

  socket.on(CTX_EVENT_ON_ROOM_JOIN_SUCCESS, function (data) {
    $scope.game.roomName = data.name;
    $scope.Me = PLAYER_2;
    $scope.opponanat = PLAYER_1;
    $scope.game.ready = true;
    $scope.game.turn = PLAYER_1;
    showSuccess(data.msg);
  });

  socket.on(CTX_EVENT_ON_ROOM_CREATE_ERROR, function (data) {
    showError(data.error);
  });

  socket.on(CTX_EVENT_ON_ROOM_JOIN_ERROR, function (data) {
    showError(data.error);
  });

  socket.on(CTX_EVENT_ON_ROOM_JOIN_BY_PLAYER_2, function (data) {
    $scope.waiting = false;
    showSuccess(data);
    $scope.game.ready = true;
    $scope.Me = PLAYER_1;
    $scope.opponanat = PLAYER_2;
    $scope.game.turn = PLAYER_1;
  });


  socket.on(CTX_EVENT_ON_GAME_REFRESHED, function (data) {
    $scope.game = data.game;
    $scope.$apply();
    checkWinCondition();
  });

  socket.on(CTX_EVENT_ON_GAME_WIN_DECLARE, function (data) {
    if (data.winner == $scope.Me) {
      alert("Congrats, You won the game!!!!!!!!!!")
    }
    else {
      alert("Oops.. You Lost the game :(")
    }
    getBoardInitData();
  });

  /////////////////END ROOOM FUNCTIONS///////////
  getBoardInitData();
});
