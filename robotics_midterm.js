/* Tony Florida
 * EN 605.713 Robotics
 * Johns Hopkins University
 * Midterm Project
 * Given: 29 Jan 2014
 * Due: 12 Mar 2014
 */

/****************************
 *
 * Global Variables
 *
 ****************************/
//state variables
 var animating = false; //state of animation

//control variables
var SPEED = 0;
var DIRECTION = 0;
var ROTATION = 0;
var TIME = 0;

//tracking variables
var GLOBAL_X = 0; //global vehicle x coordinate
var GLOBAL_Y = 0; //global vehicle y coordinate
var CANVAS_X = 0; //canvas vehicle x coordinate
var CANVAS_Y = 0; //canvas vehicle y coordinate

//requirements
var MAX_SPEED = 15; //ft per second
 
//canvas variables
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
var CENTER_X = WIDTH_PX /2; //center of canvas x
var CENTER_Y = HEIGHT_PX/2; //center of canvas y
var DEG_IN_CIRCLE = 360; //degrees in a circle
var NUM_DEC_PLACES = 2; //number of decimals places to show
var X_MULT = 1; //used to determine which quadrant
var Y_MULT = 1; //used to determine which quadrant

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
  offset: {x:VEHICLE_WIDTH/2, y:VEHICLE_HEIGHT/2} //set center as vehicle reference
}); //end rect

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
var DEBUG = false;
 
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
} //end debug

/****************************
 *
 * Animations
 *
 ****************************/
 
/* @brief The main animation object that moves the vehicle reference point
 */
var anim = new Kinetic.Animation(function(frame) 
{
   //var time = frame.time,
   //timeDiff = frame.timeDiff,
   //frameRate = frame.frameRate;
   
   //update time
   document.getElementById("cur_time").innerHTML=(frame.time/SECOND_MS).toFixed(NUM_DEC_PLACES);
   
   //determine x component of speed value
   var speedX = feetToPixels(SPEED) * Math.cos(toRadians(DIRECTION));
   var newX = rect.getPosition().x + (speedX * frame.timeDiff) / SECOND_MS;
   
   //determine y component of speed value
   var speedY = feetToPixels(SPEED) * Math.sin(toRadians(DIRECTION));
   var newY = rect.getPosition().y + (speedY * frame.timeDiff) / SECOND_MS;
   
   //move the vehicle
   rect.setX(newX);
   rect.setY(newY);
   
   //update global vehicle coordinates
   CANVAS_X = pixelsToFeet(newX - CENTER_X);
   CANVAS_Y = pixelsToFeet(Math.abs(newY - CENTER_Y))
   
   //update the diagnostic coordinates text on the page
   document.getElementById("x_coord").innerHTML=(GLOBAL_X + CANVAS_X).toFixed(NUM_DEC_PLACES);
   document.getElementById("y_coord").innerHTML=(GLOBAL_Y + CANVAS_Y).toFixed(NUM_DEC_PLACES);

   //rotate the vehicle
   if(ROTATION != 0)
   {
      var angleDiff = frame.timeDiff * ROTATION / SECOND_MS;     
      rect.rotate(angleDiff);
   }
   
   //update the diagnostic vehicle rotation
   document.getElementById("cur_rot").innerHTML=(rect.getRotationDeg() % DEG_IN_CIRCLE).toFixed(NUM_DEC_PLACES);

   //check to see if view needs to be repositioned
   checkRepositionView();

}, vehicleLayer); //end anim 

/* @brief The main animation object for point execution
 */
var animPointExecution = new Kinetic.Animation(function(frame) 
{
   //update time
   document.getElementById("cur_time").innerHTML=(frame.time/SECOND_MS).toFixed(NUM_DEC_PLACES);
   
   //determine x component of speed value
   var speedX = feetToPixels(SPEED) * Math.cos(DIRECTION);
   var newX = rect.getPosition().x + (X_MULT * ((speedX * frame.timeDiff) / SECOND_MS));
   
   //determine y component of speed value
   var speedY = feetToPixels(SPEED) * Math.sin(DIRECTION);
   var newY = rect.getPosition().y + (Y_MULT *((speedY * frame.timeDiff) / SECOND_MS));

   //move the vehicle
   rect.setX(newX);
   rect.setY(newY);
   
   //update global vehicle coordinates
   CANVAS_X = pixelsToFeet(newX - CENTER_X);
   CANVAS_Y = -pixelsToFeet(newY - CENTER_Y);
   
   //update the diagnostic coordinates text on the page
   document.getElementById("x_coord").innerHTML=(GLOBAL_X + CANVAS_X).toFixed(NUM_DEC_PLACES);
   document.getElementById("y_coord").innerHTML=(GLOBAL_Y + CANVAS_Y).toFixed(NUM_DEC_PLACES);

   //rotate the vehicle
   if(ROTATION != 0)
   {
      var angleDiff = frame.timeDiff * ROTATION / SECOND_MS;     
      rect.rotate(angleDiff);
   }
   
   //update the diagnostic vehicle rotation
   document.getElementById("cur_rot").innerHTML=(rect.getRotationDeg() % DEG_IN_CIRCLE).toFixed(NUM_DEC_PLACES);

   //check to see if view needs to be repositioned
   checkRepositionView();
   
   //check to see if the vehicle has reached it's destination
   if(frame.time > (TIME * SECOND_MS))
   {
      animPointExecution.stop();
      animating = false;
      document.getElementById("state").innerHTML="Finished";
      frame.time = 0;
   }
}, vehicleLayer); //end animPointExecution 


var resetAnim = new Kinetic.Animation(function(frame)
{
   rect.setX(CENTER_X);
   rect.setY(CENTER_Y);
   rect.rotation(0);
}, vehicleLayer); //end animPointExecution

/****************************
 *
 * Functions
 *
 ****************************/
 
function loadImage(sources, callback) {
  var images = {};
  var loadedImages = 0;
  var numImages = 0;
  // get num of sources
  for(var src in sources) {
    numImages++;
  }
  for(var src in sources) {
    images[src] = new Image();
    images[src].onload = function() {
      if(++loadedImages >= numImages) {
        callback(images);
      }
    };
    images[src].src = sources[src];
  }
} //end loadImage
 
 /* @brief Draws the grid-lines on the canvas
  */
function drawGridlines()
{
   var gridLayer = new Kinetic.Layer();

   //draw horizontal grid-lines
   for(var i = 0; i <= NUM_VERT_GRIDS; i++)
   {
      var col = i*(WIDTH_PX/NUM_VERT_GRIDS);
      var line = new Kinetic.Line({
        points: [col, 0, col, HEIGHT_PX],
        stroke: 'black',
        strokeWidth: 1
      });
      gridLayer.add(line);
   }

   //draw vertical grid-lines
   for(var i = 0; i <= NUM_HORIZ_GRIDS; i++)
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

/* @brief Action taken when the Go button is pressed for vehicle reference 
 * point
 * @param direction The value that the user entered for direction
 * @param speed The value that the user entered for speed
 * @param rotation the value that the user entered for rotation
 */
function goPressed(direction, speed, rotation)
{
   reset();
   
   if(validateUserInput(direction, speed, rotation) == true)
   {
      animate();
   }
   else
   {
      document.getElementById("state").innerHTML="Invalid Input";
   }
} //end goPressed

/* @brief Action taken when the Go button is pressed for point 
 * execution
 * @param x The destination x coordinate
 * @param y The destination y coordinate
 * @param time the value that the user entered for time
 * @param orientation The orientation that the vehicle will be at the 
 * destination
 */
function pointExecution(x, y, time, orientation)
{
   reset();
   
   if(validateUserInputPointExecution(x, y, time, orientation) == true)
   {
      animatePointExecution();
   }
   else
   {
      document.getElementById("state").innerHTML="Invalid Input";
   }
} //end pointExecution

/* @brief Validate user input
 * @param direction The value that the user entered for direction
 * @param speed The value that the user entered for speed
 * @param rotation the value that the user entered for rotation
 */
 function validateUserInput(direction, speed, rotation)
 {
   var status = new Boolean(1);
   
   //check for numeric input
   if(isNaN(direction))
   {
      alert("Please enter a valid value for direction");
      status = false;
   }
   if(isNaN(speed))
   {
      alert("Please enter a valid value for speed");
      status = false;
   }
   if(isNaN(rotation))
   {
      alert("Please enter a valid value for rotation");
      status = false;
   }

   //max speed is 15
   if(speed > MAX_SPEED)
   {
      alert("Max value for speed is 15");
      status = false;
   }
   
   //check negatives
   if(speed < 0)
   {
      alert("Speed cannot be negative");
      status = false;
   }
   
   //set defaults
   if(!direction)
   {
      direction = 0;
   }
   if(!speed)
   {
      speed = 0;
   }
   if(!rotation)
   {
      rotation = 0;
   }
   
   //fill in input
   document.getElementById("direction").value=direction;
   document.getElementById("speed").value=speed;
   document.getElementById("rotation").value=rotation;
   
   return status;
 } //end validateUserInput

/* @brief Validate user input
 * @param x The destination x coordinate
 * @param y The destination y coordinate
 * @param time The value that the user entered for time
 * @param orientation The orientation that the vehicle will be at the 
 * destination
 */
 function validateUserInputPointExecution(x, y, time, orientation)
 {
   var status = new Boolean(1);
   
   //check for numeric input
   if(isNaN(x))
   {
      alert("Please enter a valid value for x");
      status = false;
   }
   if(isNaN(y))
   {
      alert("Please enter a valid value for y");
      status = false;
   }
   if(isNaN(time))
   {
      alert("Please enter a valid value for time");
      status = false;
   }
   if(isNaN(orientation))
   {
      alert("Please enter a valid value for orientation");
      status = false;
   }
   
   //check negatives
   if(time <= 0)
   {
      alert("Time must be positive");
      status = false;
   }
   
   //set defaults
   if(!x)
   {
      x = 0;
   }
   if(!y)
   {
      y = 0;
   }
   if(!time)
   {
      time = 0;
   }
   if(!orientation)
   {
      orientation = 0;
   }
   
   //fill in input
   document.getElementById("pointX").value=x;
   document.getElementById("pointY").value=y;
   document.getElementById("time").value=time;
   document.getElementById("orientation").value=orientation;
   
   return status;
 } //end validateUserInputPointExecution
 
/* @brief Loop that animates the vehicle given parameters
 * @param direction The value that the user entered for direction
 * @param speed The value that the user entered for speed
 * @param rotation the value that the user entered for rotation
 */
function animate()
{
   //get validated values from form
   DIRECTION = parseInt(document.getElementById("direction").value);
   SPEED = parseInt(document.getElementById("speed").value);
   ROTATION = parseInt(document.getElementById("rotation").value);
   
   //adjust angles so that vehicle and global coordinate systems line up
   DIRECTION -= 90;
   
   //set state of animation to animating
   animating = "vref";
   anim.start();
   document.getElementById("state").innerHTML="Animating Vehicle Reference Point";
   document.getElementById("cur_speed").innerHTML=(SPEED).toFixed(NUM_DEC_PLACES);
   //document.getElementById("cur_dir").innerHTML=toDegrees(DIRECTION).toFixed(NUM_DEC_PLACES);
} //end animate

/* @brief Loop that animates the vehicle given point execution parameters
 * @param x The destination x coordinate
 * @param y The destination y coordinate
 * @param time The value that the user entered for time
 * @param orientation The orientation that the vehicle will be at the 
 * destination
 */
function animatePointExecution()
{
   //get validated values from form
   x = parseInt(document.getElementById("pointX").value);
   y = parseInt(document.getElementById("pointY").value);
   time = parseInt(document.getElementById("time").value);
   orientation = parseInt(document.getElementById("orientation").value);

   //determine the direction to the end point
   deltaX = (rect.getPosition().x + feetToPixels(x)) - rect.getPosition().x;
   deltaY = (rect.getPosition().y + feetToPixels(y)) - rect.getPosition().y;
   
   //determine how the sign of x and y will change
   setSign(deltaX, deltaY);

   //set animation variable for time
   TIME = parseInt(time);
   
   //avoid divide by zero!
   var distance = 0;
   if(deltaX != 0)
   {
      if(deltaY != 0)
      {
         //there is movement in both x and y direction
         DIRECTION = Math.atan(deltaY/deltaX);
         //use Pythagoras' Theorem to get the distance to travel
         distance = pixelsToFeet(Math.sqrt(Math.pow(deltaY,2) + Math.pow(deltaX,2)));
      }
      else
      {  
         //there is only movement in the x direction
         DIRECTION = 0;
         distance = pixelsToFeet(deltaX);
      }
   }
   else
   {
      if(deltaY != 0)
      {
         //there is only movement in the y direction
         DIRECTION = -Math.atan(deltaY/deltaX);
         distance = pixelsToFeet(deltaY);
      }
      else
      {  
         //there is no movement
         DIRECTION = 0;
         distance = 0;
      }
   }

   //calculate the drive speed in ft/sec to destination
   if(TIME != 0)
   {
      SPEED = Math.abs(distance / TIME);
   }
   else
   {
      SPEED = 0;
   }
   
   //Debug
   if(DEBUG == true)
   {
      console.log(deltaX + " " + deltaY);
      console.log("distance: " + distance);
      console.log("DIRECTION: " + DIRECTION);
      console.log("TIME: " + TIME);
      console.log("SPEED: " + SPEED);
   }
   
   //determine rotation rate
   if(orientation != 0)
   {
      ROTATION = orientation / TIME;
   }
   else
   {
      ROTATION = 0;
   }
   
   if(speedLimit() == true)
   {
      animating = true;
      animPointExecution.start();
      document.getElementById("state").innerHTML="Animating Point Execution";
      document.getElementById("cur_speed").innerHTML=(SPEED).toFixed(NUM_DEC_PLACES);
      //document.getElementById("cur_dir").innerHTML=toDegrees(DIRECTION).toFixed(NUM_DEC_PLACES);
   }
} //end animatePointexecution

function speedLimit()
{
   if(SPEED > MAX_SPEED)
   {
      alert("The vehicle would have to travel at " + SPEED.toFixed(NUM_DEC_PLACES) + " ft/sec in order to get to the end point in " + TIME + " seconds. Unfortunately, the max speed of the vehicle is " + MAX_SPEED.toFixed(NUM_DEC_PLACES) + " ft/sec. Try again.");
      document.getElementById("state").innerHTML="Invalid Input";      
      return false;
   }
   
   return true;
}

/* @brief Determine what value to give the x and y multipliers. These
 * multipliers will be used to increase or decrease the x and y 
 * coordinates of the vehicle during animation.
 * @param deltaX The requested change in x
 * @param deltaY The requested change in y
 */
function setSign(deltaX, deltay)
{
   //1st quadrant
   if(deltaY > 0 && deltaX > 0)
   {
      X_MULT = 1;
      Y_MULT = -1;
   }
   //2nd quadrant
   else if(deltaY > 0 && deltaX < 0)
   {
      X_MULT = -1;
      Y_MULT = 1;
   }
   //3rd quadrant
   else if(deltaY < 0 && deltaX < 0)
   {
      X_MULT = -1;
      Y_MULT = 1;
   }
   //4th quadrant
   else if(deltaY < 0 && deltaX > 0)
   {
      X_MULT = 1;
      Y_MULT = -1;
   }
   else
   {
      X_MULT = 1;
      Y_MULT = 1;
      
      if(deltaX < 0)
      {
         X_MULT = -1;
      }
   }
}

/* @brief Reposition viewable area when vehicle reference point travels within
 * 3 feet of screen edge
 */
function checkRepositionView()
{ 
   //determine buffer planes
   brx = rect.getPosition().x + (Math.cos(rect.getRotation()) * feetToPixels(BUFFER));
   bry = rect.getPosition().y + (Math.sin(rect.getRotation()) * feetToPixels(BUFFER));
   blx = rect.getPosition().x - (Math.cos(rect.getRotation()) * feetToPixels(BUFFER));
   bly = rect.getPosition().y - (Math.sin(rect.getRotation()) * feetToPixels(BUFFER));
   btx = rect.getPosition().x + (Math.sin(rect.getRotation()) * feetToPixels(BUFFER));
   bty = rect.getPosition().y - (Math.cos(rect.getRotation()) * feetToPixels(BUFFER));
   bbx = rect.getPosition().x - (Math.sin(rect.getRotation()) * feetToPixels(BUFFER));
   bby = rect.getPosition().y + (Math.cos(rect.getRotation()) * feetToPixels(BUFFER));

if(DEBUG)
{
   a.setX(brx);
   a.setY(bry);
   b.setX(blx);
   b.setY(bly);
   c.setX(btx);
   c.setY(bty);
   d.setX(bbx);
   d.setY(bby);
}

   if(blx < BOUNDS_LEFT || brx < BOUNDS_LEFT || btx < BOUNDS_LEFT || bbx < BOUNDS_LEFT ||
      blx > BOUNDS_RIGHT || brx > BOUNDS_RIGHT || btx > BOUNDS_RIGHT || bbx > BOUNDS_RIGHT || 
      bly > BOUNDS_BOTTOM || bry > BOUNDS_BOTTOM || bty > BOUNDS_BOTTOM || bby > BOUNDS_BOTTOM ||
      bly < BOUNDS_TOP || bry < BOUNDS_TOP || bty < BOUNDS_TOP || bby < BOUNDS_TOP)
   {
      repositionView();
   }
} //end checkRepositionView

function repositionView()
{
   //update the global vehicle reference coordinates
   GLOBAL_X += CANVAS_X;
   GLOBAL_Y += CANVAS_Y;
   
   //center the vehicle
   rect.setX(CENTER_X);
   rect.setY(CENTER_Y);
}

/* @brief Helper function to convert an angle in degrees to radians
 * @param angle The angle to be converted to radians
 * @return The angle in radians
 */
function toRadians (angle) {
  return angle * (Math.PI / 180);
} //end toRadians

/* @brief Helper function to convert an angle in radians to degrees
 * @param angle The angle to be converted to degrees
 * @return The angle in radians
 */
function toDegrees (angle) {
  return angle * (180 / Math.PI);
} //end toRadians

/* @brief Helper function to convert feet to pixels
 * @param feet The number of feet
 * @return Number of pixels in feet
 */
function feetToPixels(feet)
{
   return feet * (WIDTH_PX/WIDTH_FT);
} //end feetToPixels

/* @brief Helper function to convert pixels to feet
 * @param pixels The number of pixels
 * @return Number of pixels in feet
 */
function pixelsToFeet(pixels)
{
   return pixels / (WIDTH_PX/WIDTH_FT);
} //end pixelsToFeet

/* @brief Reload the page
 */
function reload()
{
   location.reload();
} //end reload

/* @brief Resets the page
 */
function reset()
{
   //reset variables
   SPEED = 0;
   DIRECTION = 0;
   ROTATION = 0;
   TIME = 0;
   GLOBAL_X = 0;
   GLOBAL_Y = 0;
   CANVAS_X = 0;
   CANVAS_Y = 0;
   
   //reposition vehicle
   resetAnim.start();
   resetAnim.stop();
   
   //clear input
   document.getElementById("direction").value="";
   document.getElementById("speed").value="";
   document.getElementById("rotation").value="";
   document.getElementById("pointX").value="";
   document.getElementById("pointY").value="";
   document.getElementById("time").value="";
   document.getElementById("orientation").value="";
   
   //clear info
   document.getElementById("x_coord").innerHTML=0;
   document.getElementById("y_coord").innerHTML=0;
   document.getElementById("cur_speed").innerHTML=SPEED;
   document.getElementById("cur_time").innerHTML=TIME;
   document.getElementById("cur_rot").innerHTML=ROTATION;

   //update state
   document.getElementById("state").innerHTML="Not Animating";
} //end reset

/****************************
 *
 * Main
 *
 ****************************/
//draw grid
drawGridlines();

//draw vehicle
var imageObj = new Image();
imageObj.src = "car.png";
imageObj.onload = function() {
    rect.setFillPatternImage(imageObj);
    stage.draw();
}
drawVehicle();

/****************************
 *
 * Listeners
 *
 ****************************/
 
/* @brief Detect a key press and stop animation
 */
document.onkeypress = function (e) 
{
   if(animating == "vref")
   {
      notAnimating();
   }
}; //end key press

/* @brief Detect a mouse click and stop animation
 */
document.onclick = function (e) 
{
   //if click is not on a button, stop the animation
   if(e.target.id != "button" && animating == "vref")
   {
     notAnimating();
   }
}; //end mouse click

/* @brief Stop the animation
 */
function notAnimating()
{
   //clear animation variables
   DIRECTION = 0;
   SPEED = 0;
   ROTATION = 0;

   //set animation state to not animating 
   anim.stop();
   animPointExecution.stop();
   animating = false;
   document.getElementById("state").innerHTML="Not Animating";
} //end notAnimating