/****************************
 *
 * Global Variables
 *
 ****************************/
 var animating = false; //state of animation
 
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

//single stage that contains the grid and vehicle
var stage = new Kinetic.Stage({
  container: 'container',
  width: WIDTH_PX,
  height: HEIGHT_PX
});

//the layer of the vehicle
var vehicleLayer = new Kinetic.Layer(); 

//the vehicle shape
var rect = new Kinetic.Rect({
  x: WIDTH_PX /2 - VEHICLE_WIDTH/2,
  y: HEIGHT_PX/2 - VEHICLE_HEIGHT/2,
  width: VEHICLE_WIDTH,
  height: VEHICLE_HEIGHT,
  fill: 'green',
  stroke: 'black',
  strokeWidth: 4,
  offset: [VEHICLE_WIDTH/2, VEHICLE_HEIGHT/2] //set center as vehicle reference
});

var BUFFER = 3; //if vehicle is within this number of feet, the view will center
var BOUNDS_LEFT = 0; //left edge of the canvas
var BOUNDS_RIGHT = WIDTH_PX; //right edge of the canvas
var BOUNDS_TOP = 0; //top edge of the canvas
var BOUNDS_BOTTOM = HEIGHT_PX; //bottom edge of the canvas

//brx=bounds right x, bty=bounds top y, etc
var brx = rect.getPosition().x + feetToPixels(BUFFER);
var bry = rect.getPosition().y;
var blx = rect.getPosition().x - feetToPixels(BUFFER);
var bly = rect.getPosition().y;
var btx = rect.getPosition().x;
var bty = rect.getPosition().y - feetToPixels(BUFFER);
var bbx = rect.getPosition().x;
var bby = rect.getPosition().y + feetToPixels(BUFFER);

/****************************
 *
 * Debug
 *
 ****************************/

var DEBUG = true;
 
//draw bounds markers
if(DEBUG)
{
   var a = new Kinetic.Rect({
     x: brx,
     y: bry,
     width: 5,
     height: 5,
     fill: 'green',
     stroke: 'black',
     strokeWidth: 1,
   });
   var b = new Kinetic.Rect({
     x: blx,
     y: bly,
     width: 5,
     height: 5,
     fill: 'green',
     stroke: 'black',
     strokeWidth: 1,
   });
   var c = new Kinetic.Rect({
     x: btx,
     y: bty,
     width: 5,
     height: 5,
     fill: 'green',
     stroke: 'black',
     strokeWidth: 1,
   });
   var d = new Kinetic.Rect({
     x: bbx,
     y: bby,
     width: 5,
     height: 5,
     fill: 'green',
     stroke: 'black',
     strokeWidth: 1,
   });
   
   vehicleLayer.add(a);
   vehicleLayer.add(b);
   vehicleLayer.add(c);
   vehicleLayer.add(d);
}

/****************************
 *
 * Functions
 *
 ****************************/
 
 /* @brief Draws the grid-lines on the canvas
  */
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
} //end drawGridlines

/* @brief Adds the vehicle to the canvas
 */
function drawVehicle()
{
   // add the shape to the layer
   vehicleLayer.add(rect);
   
   //put vehicle in the center
   rect.setX(WIDTH_PX/2);
   rect.setY(HEIGHT_PX/2);

   // add the layer to the stage
   stage.add(vehicleLayer);
} //end drawVehicle

/* @brief Action taken when the Go button is pressed
 * @param direction The value that the user entered for direction
 * @param speed The value that the user entered for speed
 * @param rotation the value that the user entered for rotation
 */
function goPressed(direction, speed, rotation)
{
   if(validateUserInput(direction, speed, rotation) == true)
   {
      //adjust angles so that vehicle and global coordinate systems initially line up
      direction -= 90;
      animating = true;
      animate(direction, speed, rotation);
   }
} //end goPressed

/* @brief Validate user input
 * @param direction The value that the user entered for direction
 * @param speed The value that the user entered for speed
 * @param rotation the value that the user entered for rotation
 */
 function validateUserInput(direction, speed, rotation)
 {
   //check for numeric input
   if(isNaN(direction))
   {
      alert("Please enter a valid value for direction");
      return false;
   }
   if(isNaN(speed))
   {
      alert("Please enter a valid value for speed");
      return false;
   }
   if(isNaN(rotation))
   {
      alert("Please enter a valid value for rotation");
      return false;
   }

   //max speed is 15
   if(speed > 15)
   {
      alert("Max value for speed is 15");
      return false;
   }
   
   return true;
 } //end validateUserInput

/* @brief Loop that animates the vehicle given parameters
 * @param direction The value that the user entered for direction
 * @param speed The value that the user entered for speed
 * @param rotation the value that the user entered for rotation
 */
function animate(direction, speed, rotation)
{
   console.log("speed: " + speed);
   console.log("direction: " + direction);

   var anim = new Kinetic.Animation(function(frame) 
   {
      //var time = frame.time,
      //timeDiff = frame.timeDiff,
      //frameRate = frame.frameRate;
      
      //determine x component of speed value
      var speedX = feetToPixels(speed) * Math.cos(toRadians(direction));
      var newX = (speedX * frame.timeDiff) / SECOND_MS;
      
      //determine y component of speed value
      var speedY = feetToPixels(speed) * Math.sin(toRadians(direction));
      var newY = (speedY * frame.timeDiff) / SECOND_MS;
      
      //move the vehicle
      rect.setX(rect.getPosition().x + newX);
      rect.setY(rect.getPosition().y + newY);

      //TODO: this isn't actually deg/sec
      //rotate the vehicle
      rect.rotate(rotation/1000);
      
      //check to see if view needs to be repositioned
      checkRepositionView()

   }, vehicleLayer);
  
  anim.start();

} //end animate

//reposition viewable area when vehicle reference point travels within 3 feet of screen edge
function checkRepositionView()
{ 
   brx = rect.getPosition().x + feetToPixels(BUFFER);
   bry = rect.getPosition().y;
   blx = rect.getPosition().x - feetToPixels(BUFFER);
   bly = rect.getPosition().y;
   btx = rect.getPosition().x;
   bty = rect.getPosition().y - feetToPixels(BUFFER);
   bbx = rect.getPosition().x;
   bby = rect.getPosition().y + feetToPixels(BUFFER);
   
   a.setX(brx);
   a.setY(bry);
   b.setX(blx);
   b.setY(bly);
   c.setX(btx);
   c.setY(bty);
   d.setX(bbx);
   d.setY(bby);

   if(blx < BOUNDS_LEFT || brx < BOUNDS_LEFT || btx < BOUNDS_LEFT || bbx < BOUNDS_LEFT ||
      blx > BOUNDS_RIGHT || brx > BOUNDS_RIGHT || btx > BOUNDS_RIGHT || bbx > BOUNDS_RIGHT || 
      bly > BOUNDS_BOTTOM || bry > BOUNDS_BOTTOM || bty > BOUNDS_BOTTOM || bby > BOUNDS_BOTTOM ||
      bly < BOUNDS_TOP || bry < BOUNDS_TOP || bty < BOUNDS_TOP || bby < BOUNDS_TOP)
   {
      console.log("outa");
   }
} //end checkRepositionView

/* @brief Helper function to convert an angel in degrees to radians
 * @param angle The angle to be converted to radians
 * @return The angle in radians
 */
function toRadians (angle) {
  return angle * (Math.PI / 180);
} //end toRadians

/* @brief Helper function to convert feet to pixels
 * @param feet The number of feet
 * @return Number of pixels in feet
 */
function feetToPixels(feet)
{
   return feet * (WIDTH_PX/WIDTH_FT);
} //end feetToPixels

/* @brief Reload the page
 */
function reset()
{
   location.reload();
} //end reset

/****************************
 *
 * Main
 *
 ****************************/
drawGridlines();
drawVehicle();