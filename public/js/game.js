window.Game = function(player_names, simulation) {
  this.board = new Board(25, 52);
  this.sim = simulation;
  this.players = _.map(player_names, function(player_name, i) {
    var player = new Player(i, player_name);
    this.board.hexes[player.x][player.y].setPlayer(player);
    return player;
  }, this);
  this.player_states = {};

  if (!this.sim) {
    this.stage = new createjs.Stage("main_canvas");
    //setAnimationInterval(100);
    this.render();
  }
};

Game.prototype.run = function(callback) {
  _.each(this.players, function(p) {
    this.player_states[p.name] = {};
  }, this);
  this.rounds = 0;
  this.round(callback);
};

Game.prototype.winner = function() {
  living_players = _.reject(this.players, function(p) { return !p.alive; });
  if (living_players.length == 1) {
    return living_players[0];
  } else if (living_players <= 0) {
    return true;
  } else {
    return false;
  }
};

Game.prototype.round = function(callback) {
  var wp = this.winner();
  if (wp) {
    callback(wp);
  } else if (this.rounds > 1000) {
    callback({
      error: "TOO MANY ROUNDS"
    });
  } else {
    this.rounds++;
    this.next_turn(this.round.bind(this, callback));
  }
};

Game.prototype.render = function() {
  var width_radius = (this.stage.canvas.width - 4) / (1.5 * this.board.hexes[0].length);
  var height_radius = (this.stage.canvas.height - 4) / ((this.board.hexes.length + .5) * Math.sqrt(3));
  var radius = Math.min(width_radius, height_radius);

  _.each(this.board.hexes, function(row) {
    _.each(row, function(hex) {
      hex.draw(this.stage, radius);
    }, this);
  }, this);
  this.stage.update();
}

Game.prototype.setAnimationInterval = function(interval) {
  createjs.Ticker.addEventListener('tick', function() {
    //console.log("Tick");
    stage.update();
  });
  createjs.Ticker.setInterval(interval);
};

Game.prototype.placePlayers = function(player_list) {
  for (var i = 0; i < player_list.length; i++) {
    var p = player_list[i];
    this.players.push(new Player(p.id, p.name, p.moveFunction));
    this.players[i].renderOnGrid();
  }
  stage.update();
};

/* direction is an integer from 0 to 5 where 0 is moving to the hex in an
 * upper-right direction, 1 is moving to the hex above the current one, and so
 * on
 *
 * If there is a hex available in that direction for the player to move onto
 * (regardless of whether there is a Trail or another player at that hex) this
 * returns true; otherwise it returns false.
 */
Game.prototype.move_player = function(player, direction) {
  if (!player.alive) {
    console.log("Player " + player.name + " is dead");
    return false;
  }

  var x_cur = player.x;
  var y_cur = player.y;

  var x_new;
  var y_new;

  var even_col = x_cur % 2 === 0;

  switch (direction) {
    case 0:
      x_new = x_cur + 1;
      y_new = even_col ? y_cur - 1 : y_cur;
      break;

    case 1:
      y_new = y_cur - 1;
      x_new = x_cur;
      break;

    case 2:
      x_new = x_cur - 1;
      y_new = even_col ? y_cur - 1: y_cur;
      break;

    case 3:
      x_new = x_cur - 1;
      y_new = even_col ? y_cur: y_cur + 1;
      break;

    case 4:
      y_new = y_cur + 1;
      x_new = x_cur;
      break;

    case 5:
      x_new = x_cur + 1;
      y_new = even_col ? y_cur : y_cur + 1;
      break;

    default:
      return false;
  }

  if (this.board.hexes[x_new] && this.board.hexes[x_new][y_new]) {
    var hex = this.board.hexes[x_new][y_new];
    hex.player = player;
  }
  if (_.isUndefined(hex) || !_.isNull(hex.player)) {
    player.kill();
  }
  player.walls.push([player.x, player.y]);
  this.board.hexes[x_cur][y_cur].wall = true;
  player.x = x_new;
  player.y = y_new;
  return true;
};

Game.prototype.next_turn = function(done) {
  var needed_players = _.map(this.players, function(p) { return p.name; });

  var d = function(name) {
    needed_players = _.without(needed_players, name);
    if (needed_players.length === 0) {
      done();
    }
  };

  _.each(this.players, function(p) {
    p.get_next_move(this.board.get_copy(), this.player_states[p.name], _.once(function(move) {
      if (typeof move === 'undefined' || move < 0 || move > 5 || move == (p.last_move + 3) % 6) {
        console.log("Invalid move for player: " + p.name);
        next = p.last_move;
      }
      move = Math.floor(move);
      this.move_player(p, move);
      //p.renderOnGrid();
      d(p.name);
    }.bind(this)));

    // The simulation handles it's own logic for killing
    if (!this.sim)
      _.delay(d, 1000, p.name);
  }, this);
};
