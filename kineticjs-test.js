/****************************
 *
 * Global Variables
 *
 ****************************/
var WIDTH_PX = 500; //width of canvas
var HEIGHT_PX = 1000; //height of canvas
var WIDTH_FT = 10; //simulated width of canvas in feet
var HEIGHT_FT = 20; //simulated height of canvas in feet
var FT_2_CELL = 2; //2 cells make up a foot
var NUM_VERT_GRIDS = WIDTH_FT * FT_2_CELL; //number of vertical grid-lines
var NUM_HORIZ_GRIDS = HEIGHT_FT * FT_2_CELL; //number of horizontal grid-lines
var VEHICLE_WIDTH = 2*FT_2_CELL*(WIDTH_PX/NUM_VERT_GRIDS); //width pixels
var VEHICLE_HEIGHT = 4*FT_2_CELL*(WIDTH_PX/NUM_VERT_GRIDS); //height pixels
var SECOND_MS = 1000; //number of milliseconds in a second

var BUFFER = 3; //if vehicle is within this number of feet, the view will center
var BOUNDS_LEFT = 0; //left edge of the canvas
var BOUNDS_RIGHT = WIDTH_PX; //right edge of the canvas
var BOUNDS_TOP = 0; //top edge of the canvas
var BOUNDS_BOTTOM = HEIGHT_PX; //bottom edge of the canvas

var prevTime = 0;
var animating = false;

//single stage that contains the grid and vehicle
var stage = new Kinetic.Stage({
  container: 'container',
  width: WIDTH_PX,
  height: HEIGHT_PX
});

var vehicleLayer = new Kinetic.Layer(); //the layer of the vehicle
//the vehicle shape
var rect = new Kinetic.Rect({
  x: WIDTH_PX /2 - VEHICLE_WIDTH/2,
  y: HEIGHT_PX/2 - VEHICLE_HEIGHT/2,
  width: VEHICLE_WIDTH,
  height: VEHICLE_HEIGHT,
  fill: 'green',
  stroke: 'black',
  strokeWidth: 4
});

/****************************
 *
 * Functions
 *
 ****************************/
function drawGridlines()
{
   var gridLayer = new Kinetic.Layer();

   //draw horizontal grid-lines
   for(var i = 0; i < NUM_VERT_GRIDS; i++)
   {
      var col = i*(WIDTH_PX/NUM_VERT_GRIDS);
      var line = new Kinetic.Line({
        points: [col, 0, col, HEIGHT_PX],
        stroke: 'black',
        strokeWidth: 1
      });
      gridLayer.add(line);
   }

   //draw verticle grid-lines
   for(var i = 0; i < NUM_HORIZ_GRIDS; i++)
   {
      var row = i*(HEIGHT_PX/NUM_HORIZ_GRIDS);
      var line = new Kinetic.Line({
        points: [0, row, WIDTH_PX, row],
        stroke: 'black',
        strokeWidth: 1
      });
      gridLayer.add(line);
   }
   stage.add(gridLayer);
}

function drawVehicle()
{
   // add the shape to the layer
   vehicleLayer.add(rect);

   // add the layer to the stage
   stage.add(vehicleLayer);
}

/****************************
 *
 * Main
 *
 ****************************/
drawGridlines();
drawVehicle();