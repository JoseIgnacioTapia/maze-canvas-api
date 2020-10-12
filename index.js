function playMaze() {
  const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
  
  // Setting important variables
  const cellsHorizontal = 6;
  const cellsVertical = 3;
  const width = window.innerWidth;
  const height = window.innerHeight;
  // Calculating cell sides
  const unitLengthX = width / cellsHorizontal;
  const unitLengthY = height / cellsVertical;
  // Setting the display 
  const engine = Engine.create();
  engine.world.gravity.y = 0;
  const { world } = engine;
  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      wireframes: false,
      width: width,
      height: height,
    },
  });
  Render.run(render);
  Runner.run(Runner.create(), engine);

  // Walls
  const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),       // Roof
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),  // Base
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),     // Left wall
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }), // Right Wall
  ];
  World.add(world, walls);

  // Maze generation
   
  const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);

      counter--;

      const temp = arr[counter];
      arr[counter] = arr[index];
      arr[index] = temp;
    }

    return arr;
  };

  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));   // Filling the grids with false

  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));  // Filling the wall verticals

  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));   // Filling the wall horizontals

  const startRow = Math.floor(Math.random() * cellsVertical);
  const startColumn = Math.floor(Math.random() * cellsHorizontal);

  const stepThroughCell = (row, column) => {
    // If i have visted the cell at [row, column], the return
    if (grid[row][column]) {
      return;
    }
    // Mark this cell as being visited
    grid[row][column] = true;
    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
      [row - 1, column, "up"],
      [row, column + 1, "right"],
      [row + 1, column, "down"],
      [row, column - 1, "left"],
    ]);

    // For each neighbor...
    for (let neighbor of neighbors) {
      const [nextRow, nextColumn, direction] = neighbor;

      // See if that neighbor is out of bounds
      if (
        nextRow < 0 ||
        nextRow >= cellsVertical ||
        nextColumn < 0 ||
        nextColumn >= cellsHorizontal
      ) {
        continue;    // If it is out of bounds, continue to the next neighbor
      }

      // If we have visited that neighbor, continue to the next neighbor
      if (grid[nextRow][nextColumn]) {
        continue;
      }

      // Remove a wall from either horizontals or verticals
      if (direction === "left") {
        verticals[row][column - 1] = true;
      } else if (direction === "right") {
        verticals[row][column] = true;
      } else if (direction === "up") {
        horizontals[row - 1][column] = true;
      } else if (direction === "down") {
        horizontals[row][column] = true;
      }

      // Visit that next cell
      stepThroughCell(nextRow, nextColumn);   // We start again to do the same procedure from the next row and next column
    }
  };

  stepThroughCell(startRow, startColumn);   // We call the function to create the raze

  horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {   // We check if there is no false
        return;
      }
      // If there is a false one then we draw a wall
      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX / 2,
        rowIndex * unitLengthY + unitLengthY,
        unitLengthX,
        5,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: 'red'
          }
        }
      );
      World.add(world, wall);    // We add the wall to the world
    });
  });

  verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      }

      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX,
        rowIndex * unitLengthY + unitLengthY / 2,
        5,
        unitLengthY,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: 'red'
          }
        }
      );
      World.add(world, wall);
    });
  });

  // GOAL
  // We draw a square in the lower right corner
  const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
      label: 'goal',
      isStatic: true,
      render: {
        fillStyle: 'green'
      }
    }
  );
  World.add(world, goal);

  // BALL
  // We draw a ball in the upper left corner
  const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
  const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius, {
      label: 'ball',
      render: {
        fillStyle: 'blue'
      }
    });
  World.add(world, ball);
  
  // We configure the controls with the W, A, S and D keys
  document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;

    if(event.keyCode === 87) {
      Body.setVelocity(ball, { x, y: y - 5 });  // Move to up
    }

    if (event.keyCode === 68) {
      Body.setVelocity(ball, { x: x + 5, y });  // Move to right
    }

    if (event.keyCode === 83) {
      Body.setVelocity(ball, { x, y: y + 5 });  // Move to down 
    }

    if(event.keyCode === 65) {
      Body.setVelocity(ball, { x: x - 5, y });  // Move to left
    }
  });

  // Win Condition
  Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision) => {
      const labels = ['ball', 'goal'];
      // We check if the ball and the goal have collided
      if (
        labels.includes(collision.bodyA.label) &&   
        labels.includes(collision.bodyB.label)
      ) {
        document.querySelector('.winner').classList.remove('hidden');  // We show message
        // We make the inner walls fall down by gravity
        world.gravity.y = 1;   
        world.bodies.forEach(body => {
          if(body.label === 'wall') {
            Body.setStatic(body, false);
          }
        });
        // We added a button to restart the maze
        const btn = document.querySelector('.btn');
        btn.addEventListener('click', () => location.reload()); 
      }
    });
  });
}

playMaze();
