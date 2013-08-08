var Gol = Gol || {};

(function() {
  'use strict';

  /*
   * A proper modulus operator.
   */
  Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
  };

  /*
   * A mouse object, which maintains an internal state and is responsible for
   * attaching the relevant mouse event handlers.
   */
  var Mouse = function() {
    this.x = 0,
    this.y = 0,
    this.leftDown = false;
    this.rightDown = false;

    /*
     * Given a mouse object, create a new cell if the mouse is positioned over a
     * cell.
     */
    function spawnCellUnderMouse(mouse) {

      /*
       * Returns the cell at the mouse point, or null if the mouse is not over
       * one.
       */
      function getCellAtMouse(mouse) {
        for (var i = 0; i < cells.length; i++)
          if (cells[i].isInBounds(mouse.x, mouse.y))
            return cells[i];

        return null;
      }

      var cell = getCellAtMouse(mouse);

      if (cell !== null)
        cell.spawn();
    }

    /* Event listeners */
    canvas.addEventListener('mousemove', function(event) {
      this.x = event.clientX - bounds.left;
      this.y = event.clientY - bounds.top;

      if (this.leftDown)
        spawnCellUnderMouse(this);
    }, false);

    canvas.addEventListener('mousedown', function(event) {
      if (event.button == 0) {
        this.leftDown = true;
        spawnCellUnderMouse(this);
      } else if (event.button == 2) {
        this.rightDown = true;
        paused = true;
      }
    }, false);

    canvas.addEventListener('mouseup', function(event) {
      if (event.button == 0)
        this.leftDown = false;
      else if (event.button == 2) {
        this.rightDown = false;
        paused = false;
      }
    }, false);
  }

  /*
   * A cell object.
   */
  var Cell = function(i, j) {
    /* Grid coordinates */
    this.i = i, this.j = j;

    /* Geometry coordinates */
    this.x = i * (tile.size + tile.margin) + tile.offX;
    this.y = j * (tile.size + tile.margin) + tile.offY;

    this.xMax = this.x + tile.size;
    this.yMax = this.y + tile.size;

    /* The current state of the cell. 'true' for alive, else 'false' if dead. */
    this.current = false;

    /* The state of the cell at the next turn. 'true' for alive, else 'false' if
     * dead. */
    this.next = false;

    this.timestamp = new Date().getTime();
  }

  Cell.prototype.spawn = function() {
    this.create();
    this.current = this.next;
  }

  Cell.prototype.create = function() {
    this.next = true;
    this.timestamp = new Date().getTime();
  }

  Cell.prototype.destroy = function() {
    this.next = false;
    this.timestamp = new Date().getTime();
  }

  Cell.prototype.isAlive = function() {
    return this.current;
  }

  Cell.prototype.isInBounds = function(x, y) {
    return (x >= this.x && x <= this.xMax &&
            y >= this.y && y <= this.yMax);
  }

  Cell.prototype.update = function(n) {

    if (this.current === true) {

      /* RULE: Any live cell with fewer than two live neighbours dies, as if
       * caused by under-population.
       */
      if (n < 2)
        this.destroy();

      /*
       * RULE: Any live cell with more than three live neighbours dies, as if by
       * overcrowding.
       */
      if (n > 3)
        this.destroy();

      /* RULE: Any live cell with two or three live neighbours lives on to the
       * next generation. */
    } else {

      /* RULE: Any dead cell with exactly three live neighbours becomes a live
       * cell, as if by reproduction.
       */
      if (n === 3)
        this.create();
    }
  }

  Cell.prototype.draw = function() {
    if (this.current) {
      renderer.fillStyle = '#dad7a7';
      renderer.fillRect(this.x, this.y, tile.size, tile.size);
    } else {
      renderer.clearRect(this.x, this.y, tile.size, tile.size);
    }
  }

  /*
   * A time object, responsible for keeping track of the simulation clocks and
   * rate of simulation.
   */
  var Time = function(fps) {
    this.fps = fps;
    this.minFps = Math.max(0, Math.floor(this.fps / 2));
    this.dt = 1000 / this.fps;
    this.maxTickTime = 1000 / this.minFps;
    this.current = new Date().getTime();
    this.accumulator = 0;
  }

  /*
   * Run time variables.
   */
  var container = document.getElementById('container');
  var canvas = document.createElement('canvas')
  var renderer = canvas.getContext('2d');
  var bounds = canvas.getBoundingClientRect()
  var mouse = new Mouse();
  var paused = false;
  var time = new Time(5);
  var tile = {
    size: 7,
    margin: 1,
    offX: 5,
    offY: 5
  };
  var grid = {
    i: 0,
    j: 0,
    size: 0
  };
  var cells = [];

  /*
   * The main event loop. This updates the simulation state by the desired
   * amount, then draws the new state to the canvas, before queuing up another
   * tick.
   *
   * @timestamp A numerical timestamp provided by the requestAnimationFrame()
   * API.
   */
  function tick(timestamp) {

    /*
     * Update simulation state by one step.
     */
    function update() {

      /*
       * Update a given cell.
       *
       * @n The index into the array of cells of the cell to be updated.
       */
      function updateCell(n) {
        var neighbours = [];
        var aliveNeighbours = 0;

        /* Top row */
        neighbours.push(cells[(n - grid.w - 1).mod(grid.size)]);
        neighbours.push(cells[(n - grid.w).mod(grid.size)]);
        neighbours.push(cells[(n - grid.w + 1).mod(grid.size)]);

        /* Current row */
        neighbours.push(cells[(n - 1).mod(grid.size)]);
        neighbours.push(cells[(n + 1).mod(grid.size)]);

        /* Bottom row */
        neighbours.push(cells[(n + grid.w - 1).mod(grid.size)]);
        neighbours.push(cells[(n + grid.w).mod(grid.size)]);
        neighbours.push(cells[(n + grid.w + 1).mod(grid.size)]);

        for (var i = 0; i < neighbours.length; i++) {
          if (neighbours[i].isAlive())
            aliveNeighbours++;
        }

        cells[n].update(aliveNeighbours);
      }

      for (var i = 0; i < cells.length; i++)
        cells[i].current = cells[i].next;

      /* Update each cell in turn */
      for (var i = 0; i < cells.length; i++)
        updateCell(i);
    }

    /*
     * Draw the simulation state.
     */
    function draw() {
      for (var i = 0; i < cells.length; i++)
        cells[i].draw();
    }

    /* Update the clocks */
    var newTime = new Date().getTime();
    var tickTime = newTime - time.current;

    /* Enforce a maximum frame time to prevent the "spiral of death" when
     * operating under heavy load */
    if (tickTime > time.maxTickTime)
      tickTime = time.maxTickTime;

    time.current = newTime;

    if (paused !== true) {
      time.accumulator += tickTime;

      /* Update the simulation state as required */
      for ( ; time.accumulator >= time.dt; time.accumulator -= time.dt)
        update();
    }

    draw();
    requestAnimationFrame(tick);
  }

  /*
   * Initialisation function. Set global variables, initialise canvas and attach
   * resize handlers etc.
   */
  function init() {

    /*
     * Event handler for window resizes.
     */
    function onWindowResize() {

      /*
       * Clear the current grid and create a new one.
       */
      function newGrid() {

        for (var i = 0; i < cells.length; i++) {
          cells.pop();
        }

        for (var j = 0; j < grid.h; j++) {
          for (var i = 0; i < grid.w; i++) {
            cells.push(new Cell(i, j));
          }
        }
      }

      var w = window.innerWidth - 2 * tile.offX;
      var h = window.innerHeight - 2 * tile.offY;

      grid.w = Math.floor(w / (tile.size + tile.margin)) - 1;
      grid.h = Math.floor(h / (tile.size + tile.margin)) - 1;
      grid.size = grid.w * grid.h;

      canvas.width = w;
      canvas.height = h;

      bounds = canvas.getBoundingClientRect();
      newGrid();
    }

    canvas.id = 'canvas';
    container.appendChild(canvas);
    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();
  }

  /*
   * Initialisation and setup phase:
   */
  init();

  /* Bootstrap the event loop */
  tick();

}).call(Gol);
