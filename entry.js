Bot.register('DummyBot', function(board_state, player_state, move) {
  var me = board_state.me;
  var board = board_state.board;
  var dirs = board.safe_directions(me);
  var tiles = board.surrounding_tiles(me);
  
  function calcScore(tile, d, pastTile) {
    var surr = board.safe_surrounding_tiles(tile);
    if (d == 0) {
      return surr.length;
    }
    var score = 0;
    for (var i = 0; i < surr.length; i++) {
      if (surr[i] == pastTile) {
       continue; 
      }
      score = score + calcScore(surr[i], d-1, tile);
    }
    return score + surr.length;
  }
  
  var scores = new Array();
  for (var i = 0; i < dirs.length; i++) {
    var dir = dirs[i];
    scores[i] = calcScore(tiles[dir], 6, me) 
  }
  
  var max = scores[0];
  var maxIndex = 0;

for (var i = 1; i < scores.length; i++) {
    if (scores[i] > max) {
        maxIndex = i;
        max = scores[i];
    }
}
  
  move(dirs[maxIndex]);
})
