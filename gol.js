var Gol = Gol || {};

(function() {
  'use strict';

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
    function createCellUnderMouse(mouse) {

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
        cell.create();
    }

    /* Event listeners */
    canvas.addEventListener('mousemove', function(event) {
      this.x = event.clientX - bounds.left;
      this.y = event.clientY - bounds.top;

      if (this.leftDown)
        createCellUnderMouse(this);
    }, false);

    canvas.addEventListener('mousedown', function(event) {
      if (event.button == 0) {
        this.leftDown = true;
        createCellUnderMouse(this);
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

    this.alive = false;
  }

  Cell.prototype.create = function() {
    this.alive = true;
  }

  Cell.prototype.isInBounds = function(x, y) {
    return (x >= this.x && x <= this.xMax &&
            y >= this.y && y <= this.yMax);
  }

  Cell.prototype.draw = function() {
    renderer.fillStyle = this.alive ? '#dad7a7' : '#eeeeee';
    renderer.fillRect(this.x, this.y, tile.size, tile.size);
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
    margin: 2,
    offX: 5,
    offY: 5
  };
  var grid = {
    i: 0,
    j: 0
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

        for (var i = 0; i < grid.i; i++) {
          for (var j = 0; j < grid.j; j++) {
            cells.push(new Cell(i, j));
          }
        }
      }

      var w = window.innerWidth - 2 * tile.offX;
      var h = window.innerHeight - 2 * tile.offY;

      grid.i = Math.floor(w / (tile.size + tile.margin)) - 1;
      grid.j = Math.floor(h / (tile.size + tile.margin)) - 1;

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
