/* Tony Florida
 * EN 605.713 Robotics
 * Johns Hopkins University
 * Midterm Project
 * Given: 29 Jan 2014
 * Due: 12 Mar 2014
 * File: robotics_midterm.js
 * Description: Main logic for Robotics midterm project
 */
 
/****************************
 *
 * Browser Set-up
 *
 ****************************/
 
var BROWSER_WIDTH = 0;
var BROWSER_HEIGHT = 0;
var HEIGHT_PX = 0; //height of canvas
var WIDTH_PX = 0; //width of canvas

/* @brief Determine size of canvas based on width of browser window on load
 */
function getBroswerSize() 
{
   if(typeof( window.innerWidth ) == 'number') 
   {
       //Non-IE
       BROWSER_WIDTH = window.innerWidth;
       BROWSER_HEIGHT = window.innerHeight;
   }
   else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) 
   {
       //IE 6+ in 'standards compliant mode'
       BROWSER_WIDTH = document.documentElement.clientWidth;
       BROWSER_HEIGHT = document.documentElement.clientHeight;
   }
   else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) 
   {
       //IE 4 compatible
       BROWSER_WIDTH = document.body.clientWidth;
       BROWSER_HEIGHT = document.body.clientHeight;
   }
   console.log(BROWSER_WIDTH + " " + BROWSER_HEIGHT);

   //make sure the width of the simulation area takes up no more than half of the window
   if(BROWSER_HEIGHT/2 > BROWSER_WIDTH/2)
   {
      WIDTH_PX = BROWSER_WIDTH/2;
      HEIGHT_PX = WIDTH_PX * 2;
   }
   else
   {
      HEIGHT_PX = BROWSER_HEIGHT;
      WIDTH_PX = HEIGHT_PX/2;
   }
} //end getBrowserSize

getBroswerSize();

/****************************
 *
 * Global Variables
 *
 ****************************/
 
//state variables
 var animating = false; //state of animation
 var state = "loaded";

//control variables
var SPEED = 0;
var DIRECTION = 0;
var ROTATION = 0;
var TIME = 0;
var X = 0;
var Y = 0;
var ORIENTATION = 0;

//tracking variables
var GLOBAL_X = 0; //global vehicle x coordinate
var GLOBAL_Y = 0; //global vehicle y coordinate
var CANVAS_X = 0; //canvas vehicle x coordinate
var CANVAS_Y = 0; //canvas vehicle y coordinate

//requirements
var MAX_SPEED = 15; //ft per second
 
//canvas variables
var WIDTH_FT = 10; //simulated width of canvas in feet
var HEIGHT_FT = 20; //simulated height of canvas in feet
var FT_2_CELL = 2; //2 cells make up a foot
var NUM_VERT_GRIDS = WIDTH_FT * FT_2_CELL; //number of vertical grid-lines
var NUM_HORIZ_GRIDS = HEIGHT_FT * FT_2_CELL; //number of horizontal grid-lines
var VEHICLE_WIDTH_FT = 2; //vehcile width ft
var VEHICLE_HEIGHT_FT = 4; //vehicle height ft
var VEHICLE_WIDTH_PX = VEHICLE_WIDTH_FT*FT_2_CELL*(WIDTH_PX/NUM_VERT_GRIDS); //width pixels
var VEHICLE_HEIGHT_PX = VEHICLE_HEIGHT_FT*FT_2_CELL*(WIDTH_PX/NUM_VERT_GRIDS); //height pixels
var SECOND_MS = 1000; //number of milliseconds in a second
var CENTER_X = WIDTH_PX /2; //center of canvas x
var CENTER_Y = HEIGHT_PX/2; //center of canvas y
var DEG_IN_CIRCLE = 360; //degrees in a circle
var NUM_DEC_PLACES = 2; //number of decimals places to show
var X_MULT = 1; //used to determine which quadrant
var Y_MULT = 1; //used to determine which quadrant

//waypoint variables
var waypointCols = ["pointX", "pointY", "time", "orientation"];
var waypoints = [];
var cur_waypoint = 0;
var MAX_WAYPOINTS = 3;

//mecanum variables
var RADIUS = 0.25; //wheel radius in feet
var CIRCUMFERENCE = 2 * RADIUS * Math.PI;
var FT_TRAVELED_PER_RADIAN = ((180/Math.PI)/360)*CIRCUMFERENCE;
var wheel_rotations = [0, 0, 0, 0];
var inverse_kinematic = [[ 1, 1, -(VEHICLE_WIDTH_FT + VEHICLE_HEIGHT_FT)],
                         [-1, 1,  (VEHICLE_WIDTH_FT + VEHICLE_HEIGHT_FT)],
                         [-1, 1, -(VEHICLE_WIDTH_FT + VEHICLE_HEIGHT_FT)],
                         [ 1, 1,  (VEHICLE_WIDTH_FT + VEHICLE_HEIGHT_FT)]];
var forward_kinematic = [[1, -1, -1, 1],
                         [1,  1,  1, 1],
                         [-(1/(VEHICLE_WIDTH_FT + VEHICLE_HEIGHT_FT)),
                           (1/(VEHICLE_WIDTH_FT + VEHICLE_HEIGHT_FT)),
                          -(1/(VEHICLE_WIDTH_FT + VEHICLE_HEIGHT_FT)),
                           (1/(VEHICLE_WIDTH_FT + VEHICLE_HEIGHT_FT))]];

//path variables
var CIRCLE_RADIUS = 0;
var INCLINATION = 0;
var RECT_W = 0;
var RECT_H = 0;
var cur_loop = 0;
var loops = [];
                           
//single stage that contains the grid and vehicle
var stage = new Kinetic.Stage({
  container: 'container',
  width: WIDTH_PX,
  height: HEIGHT_PX
});

//the layer of the vehicle
var vehicleLayer = new Kinetic.Layer();
var pathLayer = new Kinetic.Layer();
var waypointLayer = new Kinetic.Layer();

//the vehicle shape
var rect = new Kinetic.Rect({
  x: WIDTH_PX /2 - VEHICLE_WIDTH_PX/2,
  y: HEIGHT_PX/2 - VEHICLE_HEIGHT_PX/2,
  width: VEHICLE_WIDTH_PX,
  height: VEHICLE_HEIGHT_PX,
  offset: {x:VEHICLE_WIDTH_PX/2, y:VEHICLE_HEIGHT_PX/2} //set center as vehicle reference
}); //end rect

var BUFFER = 3; //if vehicle is within this number of feet, the view will center
var BOUNDS_LEFT = 0; //left edge of the canvas
var BOUNDS_RIGHT = WIDTH_PX; //right edge of the canvas
var BOUNDS_TOP = 0; //top edge of the canvas
var BOUNDS_BOTTOM = HEIGHT_PX; //bottom edge of the canvas

//brx=bounds right x, bty=bounds top y, etc
var brx = rect.getPosition().x + feetToPixels(BUFFER) + VEHICLE_WIDTH_PX/2;
var bry = rect.getPosition().y + VEHICLE_HEIGHT_PX/2;
var blx = rect.getPosition().x - feetToPixels(BUFFER) + VEHICLE_WIDTH_PX/2;
var bly = rect.getPosition().y  + VEHICLE_HEIGHT_PX/2;
var btx = rect.getPosition().x + VEHICLE_WIDTH_PX/2;
var bty = rect.getPosition().y - feetToPixels(BUFFER) + VEHICLE_HEIGHT_PX/2;
var bbx = rect.getPosition().x + VEHICLE_WIDTH_PX/2;
var bby = rect.getPosition().y + feetToPixels(BUFFER) + VEHICLE_HEIGHT_PX/2;

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
} //end debug

/****************************
 *
 * Paths
 *
 ****************************/
var frames = 0; //number of frames executed
var NEW_POINT = 1; //draw new point every NEW_POINT frames
var recentered = true; //toggle to detect when view was recentered
var PATH_LEN = 1000000; //length of path to be executed
var pathx = 0;
var pathy = 0;

//path that has been traveled
var done = new Kinetic.Line({
   points: [CENTER_X, CENTER_Y, CENTER_X, CENTER_Y],
   stroke: 'red',
   strokeWidth: 6,
   lineCap: 'round',
   lineJoin: 'round'
});

/* @brief Draw the path that the vehicle has already traveled
 */
function drawPrevPath(x, y)
{
   var points = done.getPoints();
   points[points.length-2]=x - pathx; // new x point 
   points[points.length-1]=y - pathy; // new y point
   done.setPoints(points);
   
   pathLayer.draw();
}

/* @brief Draw the path that the vehicle has already traveled for a circle
 */
function drawPrevPathCircle(x, y)
{
   var points = done.getPoints();
   points.push(x - pathx); // new x point 
   points.push(y - pathy); // new y point
   done.setPoints(points);
   
   pathLayer.draw();
}

/* @brief Draw path for vref and mecanum
 * @param dir Direction in degrees
 * @param speed Speed in ft / sec
 */
function drawPathToBeExec(dir, speed)
{
   console.log("DDD: " + dir);
   if(recentered == true)
   {
      if(speed > 0)
      {
         var toBeExecuted = new Kinetic.Line({
            points: [CENTER_X, CENTER_Y, CENTER_X + (PATH_LEN * Math.cos(toRadians(dir))), CENTER_Y + (PATH_LEN * Math.sin(toRadians(dir)))],
            stroke: 'green',
            strokeWidth: 2,
            lineCap: 'round',
            lineJoin: 'round'
         });

         waypointLayer.add(toBeExecuted);
         waypointLayer.draw();
         
         recentered = false;
      }
   }
} //end drawPathToBeExec


/* @brief Draw path for vref and mecanum
 * @param rad Radius of circle in feet
 * @param inc Inclination of radius in degrees
 */
function drawPathToBeExecCircle(rad, inc)
{
   var circle = new Kinetic.Circle({
     x: CENTER_X,
     y: CENTER_Y,
     radius: rad,
     stroke: 'green',
     strokeWidth: 2
   });
   
   inc += 180; //realign coordinate systems
   circle.setX(Math.sin(toRadians(inc)) * rad + CENTER_X);
   circle.setY(-Math.cos(toRadians(inc)) * rad + CENTER_Y);

   waypointLayer.add(circle);
   waypointLayer.draw();
} //end drawPathToBeExec

/* @brief Draw waypoint path
 */
function drawPointsPathToBeExec()
{
   var pts = [CENTER_X, CENTER_Y]; //way points as coordinates
   for(var i = 0; i < waypoints.length; i++)
   {
      var x = waypoints[i][0]; 
      var y = waypoints[i][1];
      var to = coordFt2Px(x, y); //coordinates
      var toX = to[0]; //x in px
      var toY = to[1]; //y in px
      pts.push(toX);
      pts.push(toY);
   }
   console.log("Points: " + pts);
   
   var toBeExecuted = new Kinetic.Line({
      points: pts,
      stroke: 'green',
      strokeWidth: 2,
      lineCap: 'round',
      lineJoin: 'round'
   });
   
   waypointLayer.add(toBeExecuted);
   waypointLayer.draw();
   
   recentered = false;

} //end drawPointsPathToBeExec

/****************************
 *
 * Animations
 *
 ****************************/
 
/* @brief The main animation object that moves the vehicle reference point
 */
var anim = new Kinetic.Animation(function(frame) 
{
   //update time
   document.getElementById("cur_time").innerHTML=(frame.time/SECOND_MS).toFixed(NUM_DEC_PLACES);
   
   //determine x component of speed value
   var speedX = feetToPixels(SPEED) * Math.cos(toRadians(DIRECTION));
   var newX = rect.getPosition().x + (X_MULT * (speedX * frame.timeDiff) / SECOND_MS);
   
   //determine y component of speed value
   var speedY = feetToPixels(SPEED) * Math.sin(toRadians(DIRECTION));
   var newY = rect.getPosition().y + (Y_MULT * (speedY * frame.timeDiff) / SECOND_MS);
   
   //move the vehicle
   rect.setX(newX);
   rect.setY(newY);
      
   //draw path traveled
   if(frames >= NEW_POINT)
   {
      drawPrevPath(newX, newY);
      frames=0;
   }
   frames++;
   
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


/* @brief The main animation object that moves the vehicle in a circle
 */
var animCircle = new Kinetic.Animation(function(frame) 
{
   //update time
   document.getElementById("cur_time").innerHTML=(frame.time/SECOND_MS).toFixed(NUM_DEC_PLACES);
   
   //set direction based on time
   DIRECTION += (frame.timeDiff * (360/TIME)) / SECOND_MS;
   
   //determine x component of speed value
   var speedX = feetToPixels(SPEED) * Math.cos(toRadians(DIRECTION));
   var newX = rect.getPosition().x + (X_MULT * (speedX * frame.timeDiff) / SECOND_MS);
   
   //determine y component of speed value
   var speedY = feetToPixels(SPEED) * Math.sin(toRadians(DIRECTION));
   var newY = rect.getPosition().y + (Y_MULT * (speedY * frame.timeDiff) / SECOND_MS);
   
   //move the vehicle
   rect.setX(newX);
   rect.setY(newY);
   
   //draw path traveled
   if(frames >= NEW_POINT)
   {
      drawPrevPathCircle(newX, newY);
      frames=0;
   }
   frames++;
   
   //update global vehicle coordinates
   CANVAS_X = pixelsToFeet(newX - CENTER_X);
   CANVAS_Y = pixelsToFeet(Math.abs(newY - CENTER_Y))
   
   //update the diagnostic coordinates text on the page
   document.getElementById("x_coord").innerHTML=(GLOBAL_X + CANVAS_X).toFixed(NUM_DEC_PLACES);
   document.getElementById("y_coord").innerHTML=-(GLOBAL_Y + CANVAS_Y).toFixed(NUM_DEC_PLACES);

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
      animating = "done";
      document.getElementById("state").innerHTML="Finished, Reload";
      frame.time = 0;
      
      //execute another waypoint if need be
      cur_loop++;
      if(cur_loop < loops.length)
      {
         circleExecution(true);
      }
      else
      {
         animating = "reload";
         animCircle.stop();
      }
   }

}, vehicleLayer); //end animCircle

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
   
   //draw path traveled
   if(frames >= NEW_POINT)
   {
      drawPrevPath(newX, newY);
      frames=0;
   }
   frames++;
   
   //update global vehicle coordinates
   CANVAS_X = pixelsToFeet(newX - CENTER_X);
   CANVAS_Y = pixelsToFeet(newY - CENTER_Y);
   
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
      animating = "done";
      document.getElementById("state").innerHTML="Finished, Reload";
      frame.time = 0;
      
      //execute another waypoint if need be
      cur_waypoint++;
      if(cur_waypoint < waypoints.length)
      {
         pointExecution(true);
         
         var points = done.getPoints();
         points.push(newX); // new x point 
         points.push(newY); // new y point
         done.setPoints(points);
      }
      else
      {
         animating = "reload";
      }
   }
}, vehicleLayer); //end animPointExecution 


var resetAnim = new Kinetic.Animation(function(frame)
{
   rect.setX(CENTER_X);
   rect.setY(CENTER_Y);
   rect.rotation(0);
}, vehicleLayer); //end resetAnim

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
   if(checkReload() == true)
   {
      return;
   }

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

/* @brief Action taken when the Go button is pressed for mecanum wheel mode
 */
function mecanumExecution()
{
   if(checkReload() == true)
   {
      return;
   }

   reset();
   
   //get user input
   for(var i = 0; i < wheel_rotations.length; i++)
   {
      wheel_rotations[i] = document.getElementById("w" + (i + 1)).value;
   }

   if(validateMecanum() == true)
   {
      animateMecanum();
   }
   else
   {
      document.getElementById("state").innerHTML="Invalid Input";
   }
} //end mecanumExecution

/*
   CIRCLE_RADIUS = document.getElementById("fig8_1_rad").value;
   INCLINATION = document.getElementById("fig8_1_inc").value;
   CIRCLE_RADIUS2 = document.getElementById("fig8_2_rad").value;
   INCLINATION2 = document.getElementById("fig8_2_inc").value;
   TIME = document.getElementById("fig8_sec").value;
*/

/* @brief Action taken when the Go button is pressed for circle mode
 */
function circleExecution(figure8Mode)
{
   if(checkReload() == true)
   {
      return;
   }

   //figure 8 mode
   if(figure8Mode)
   {
      var status = true;
      
      //validate and add loop data to array
      if(animating != "done" && animating != "reload")
      {
         console.log("here: " + animating);
         //validate first loop of figure 8
         CIRCLE_RADIUS = document.getElementById("fig8_1_rad").value;
         INCLINATION = document.getElementById("fig8_1_inc").value;
         TIME = document.getElementById("fig8_sec").value; 
         if(validateUserInputCircle() == true)
         {
            //fill in input
            document.getElementById("fig8_1_rad").value=CIRCLE_RADIUS;
            document.getElementById("fig8_1_inc").value=INCLINATION;
            document.getElementById("fig8_sec").value=TIME;
            loops.push([CIRCLE_RADIUS, INCLINATION]);
            
            DIRECTION = parseFloat(INCLINATION) -180; //adjust direction to align with vehicle coordinate system
            drawPathToBeExecCircle(feetToPixels(CIRCLE_RADIUS), DIRECTION);
         }
         else
         {
            status = false;
         }
         
         //validate second loop of figure 8
         CIRCLE_RADIUS = document.getElementById("fig8_2_rad").value;
         INCLINATION = document.getElementById("fig8_2_inc").value;
         TIME = document.getElementById("fig8_sec").value; 
         if(validateUserInputCircle() == true)
         {
            //fill in input
            document.getElementById("fig8_2_rad").value=CIRCLE_RADIUS;
            document.getElementById("fig8_2_inc").value=INCLINATION;
            document.getElementById("fig8_sec").value=TIME;
            loops.push([CIRCLE_RADIUS, INCLINATION]);
            
            DIRECTION = parseFloat(INCLINATION) -180; //adjust direction to align with vehicle coordinate system
            drawPathToBeExecCircle(feetToPixels(CIRCLE_RADIUS), DIRECTION);
         }
         else
         {
            status = false;
         }
      } //end pre animation check
      
      if(status == true)
      {
         console.log("loop : " + cur_loop);
         animateCircle(loops[cur_loop][0], loops[cur_loop][1], TIME);
      }
   }
   //single circle mode
   else
   {
      CIRCLE_RADIUS = document.getElementById("circle_rad").value;
      INCLINATION = document.getElementById("circle_inc").value;
      TIME = document.getElementById("circle_sec").value;
      
      if(validateUserInputCircle() == true)
      {
         //fill in input
         document.getElementById("circle_rad").value=CIRCLE_RADIUS;
         document.getElementById("circle_inc").value=INCLINATION;
         document.getElementById("circle_sec").value=TIME;
         
         //draw path
         DIRECTION = parseFloat(INCLINATION) -180; //adjust direction to align with vehicle coordinate system
         drawPathToBeExecCircle(feetToPixels(CIRCLE_RADIUS), DIRECTION);
         
         animateCircle(CIRCLE_RADIUS, INCLINATION, TIME);
      }
      else
      {
         document.getElementById("state").innerHTML="Invalid Input";
      }
   }


} //end circleExecution

/* @brief Action taken when the Go button is pressed for rectangle mode
 */
function rectangleExecution()
{
   if(checkReload() == true)
   {
      return;
   }

   reset();

   if(validateUserInputRectangle() == true)
   {
      animateRectangle();
   }
   else
   {
      document.getElementById("state").innerHTML="Invalid Input";
   }
} //end rectangleExecution

/* @brief Action taken when the Go button is pressed for point 
 * execution
 */
function pointExecution(waypointMode)
{
   if(checkReload() == true)
   {
      return;
   }
   
   if(waypointMode == true)
   {
      //animate
      animatePointExecution(waypoints[cur_waypoint][0], waypoints[cur_waypoint][1], waypoints[cur_waypoint][2], waypoints[cur_waypoint][3]);
   }
   else
   {
      //add valid waypoint
      validateWaypoint();
      
      //animate
      animatePointExecution(waypoints[cur_waypoint][0], waypoints[cur_waypoint][1], waypoints[cur_waypoint][2], waypoints[cur_waypoint][3]);
   }
} //end pointExecution

/* @brief Validate waypoint
 * destination
 */
function validateWaypoint()
{
   //check for max waypoints entered
   if(MAX_WAYPOINTS > waypoints.length)
   {
      X = document.getElementById('pointX').value;
      Y = document.getElementById('pointY').value;
      TIME = document.getElementById('time').value;
      ORIENTATION = document.getElementById('orientation').value;
      
      if(validateUserInputPointExecution() == true)
      {
         if(determineWaypointData(X, Y, TIME, ORIENTATION) == true)
         {
            addWaypoint();
         }
         return true;
      }
      else
      {
         document.getElementById("state").innerHTML="Invalid Input";
         return false;
      }
   }
   else
   {
      alert("Sorry but you can only enter a max of " + MAX_WAYPOINTS + " waypoints.");
      return false;
   }
} //end validateWaypoint

/* @brief Add waypoint
 */
function addWaypoint()
{
   //get the waypoint table element
   var table = document.getElementById("waypoints");

   //create an empty <tr> element and add it to the 1st position of the table:
   //plus one to start after table header row
   var row = table.insertRow(waypoints.length + 1);

   //array to hold waypoint
   var waypoint = [];
   
   //add the waypoint
   for(var i = 0; i < waypointCols.length; i++)
   {
      var cell = row.insertCell(i);
      //get the data from the validated form
      var data = parseInt(document.getElementById(waypointCols[i]).value);
      cell.innerHTML = data;
      waypoint.push(data);
   }
   
   pushAndDrawWaypoint(waypoint);
} //end addWaypoint

/* @brief Push the waypoint to the array and draw it on the screen
 */
function pushAndDrawWaypoint(waypoint)
{
   //clear path
   waypointLayer.removeChildren();
   waypointLayer.draw();
   
   //add the waypoint to the array of waypoints
   waypoints.push(waypoint);
   drawPointsPathToBeExec();
   console.log("Waypoint data: " + waypoint);
}

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

/* @brief Validate user input for circle mode
 */
 function validateUserInputCircle()
 {
   var status = new Boolean(1);
   
   //check for numeric input
   if(isNaN(CIRCLE_RADIUS))
   {
      alert("Please enter a valid value for radius)");
      status = false;
   }
   if(isNaN(INCLINATION))
   {
      alert("Please enter a valid value for inclination");
      status = false;
   }
   if(isNaN(TIME))
   {
      alert("Please enter a valid value for time");
      status = false;
   }
   
   //check negatives
   if(CIRCLE_RADIUS < 0)
   {
      alert("Radius cannot be negative");
      status = false;
   }
   if(TIME <= 0)
   {
      alert("Time must be positive");
      status = false;
   }
   
   //set defaults
   if(!CIRCLE_RADIUS)
   {
      CIRCLE_RADIUS = 0;
   }
   if(!INCLINATION)
   {
      INCLINATION = 0;
   }
   if(!TIME)
   {
      TIME = 0;
   }

   return status;
 } //end validateUserInputCircle
 
 /* @brief Validate user input for figure 8
 */
 function validateUserInputFigure8()
 {
    var status = new Boolean(1);
   
   CIRCLE_RADIUS = document.getElementById("fig8_1_rad").value;
   INCLINATION = document.getElementById("fig8_1_inc").value;
   CIRCLE_RADIUS2 = document.getElementById("fig8_2_rad").value;
   INCLINATION2 = document.getElementById("fig8_2_inc").value;
   TIME = document.getElementById("fig8_sec").value;
   
   //check for numeric input
   if(isNaN(CIRCLE_RADIUS) || isNaN(CIRCLE_RADIUS2))
   {
      alert("Please enter a valid value for radius)");
      status = false;
   }
   if(isNaN(INCLINATION) || isNaN(INCLINATION2))
   {
      alert("Please enter a valid value for inclination");
      status = false;
   }
   if(isNaN(TIME))
   {
      alert("Please enter a valid value for time");
      status = false;
   }
   
   //check negatives
   if(CIRCLE_RADIUS <= 0 || CIRCLE_RADIUS2 <= 0)
   {
      alert("Radius must be positive");
      status = false;
   }
   if(TIME <= 0)
   {
      alert("Time must be positive");
      status = false;
   }
   
   //set defaults
   if(!CIRCLE_RADIUS)
   {
      CIRCLE_RADIUS = 0;
   }
   if(!CIRCLE_RADIUS2)
   {
      CIRCLE_RADIUS2 = 0;
   }
   if(!INCLINATION)
   {
      INCLINATION = 0;
   }
   if(!INCLINATION2)
   {
      INCLINATION2 = 0;
   }
   if(!TIME)
   {
      TIME = 0;
   }
   
   //fill in input
   document.getElementById("fig8_1_rad").value = CIRCLE_RADIUS;
   document.getElementById("fig8_1_inc").value = INCLINATION;
   document.getElementById("fig8_2_rad").value = CIRCLE_RADIUS2;
   document.getElementById("fig8_2_inc").value = INCLINATION2;
   document.getElementById("fig8_sec").value = TIME;

   return status;
 } //end validateUserInputFigure8
 
 /* @brief Validate user input for circle mode
 */
 function validateUserInputRectangle()
 {
   var status = new Boolean(1);
   
   RECT_W = document.getElementById("rect_w").value;
   RECT_H = document.getElementById("rect_h").value;
   INCLINATION =  document.getElementById("rect_inc").value;
   TIME = document.getElementById("rect_sec").value;
   
   //check for numeric input
   if(isNaN(RECT_W))
   {
      alert("Please enter a valid value for width)");
      status = false;
   }
   if(isNaN(RECT_H))
   {
      alert("Please enter a valid value for height)");
      status = false;
   }
   if(isNaN(INCLINATION))
   {
      alert("Please enter a valid value for inclination");
      status = false;
   }
   if(isNaN(TIME))
   {
      alert("Please enter a valid value for time");
      status = false;
   }
   
   //check negatives
   if(RECT_W <= 0)
   {
      alert("Width must be positive");
      status = false;
   }
   if(RECT_H <= 0)
   {
      alert("Height must be positive");
      status = false;
   }
   if(TIME <= 0)
   {
      alert("Time must be positive");
      status = false;
   }
   
   //set defaults
   if(!RECT_W)
   {
      RECT_W = 0;
   }
   if(!RECT_H)
   
   {
      RECT_H = 0;
   }
   if(!INCLINATION)
   {
      INCLINATION = 0;
   }
   if(!TIME)
   {
      TIME = 0;
   }
   
   //fill in input
   document.getElementById("rect_w").value=RECT_W;
   document.getElementById("rect_h").value=RECT_H;
   document.getElementById("rect_inc").value=INCLINATION;
   document.getElementById("rect_sec").value=TIME;

   return status;
 } //end validateUserInputRectangle
 
/* @brief Validate user input for point execution mode
 */
 function validateUserInputPointExecution()
 {
   var status = new Boolean(1);
   
   //check for numeric input
   if(isNaN(X))
   {
      alert("Please enter a valid value for x");
      status = false;
   }
   if(isNaN(Y))
   {
      alert("Please enter a valid value for y");
      status = false;
   }
   if(isNaN(TIME))
   {
      alert("Please enter a valid value for time");
      status = false;
   }
   if(isNaN(ORIENTATION))
   {
      alert("Please enter a valid value for orientation");
      status = false;
   }
   
   //check negatives
   if(TIME <= 0)
   {
      alert("Time must be positive");
      status = false;
   }
   
   //set defaults
   if(!X)
   {
      X = 0;
   }
   if(!Y)
   {
      Y = 0;
   }
   if(!TIME)
   {
      TIME = 0;
   }
   if(!ORIENTATION)
   {
      ORIENTATION = 0;
   }
   
   //fill in input
   document.getElementById("pointX").value=X;
   document.getElementById("pointY").value=Y;
   document.getElementById("time").value=TIME;
   document.getElementById("orientation").value=ORIENTATION;
   
   return status;
 } //end validateUserInputPointExecution
 
function validateMecanum()
{
   var status = new Boolean(1);
   
   //check for numeric input
   for(var i = 0; i < wheel_rotations.length; i++)
   {
      if(isNaN(wheel_rotations[i]))
      {
         alert("Please enter a valid value for wheel " + (i + 1));
         status = false;
      }
   }

   //set defaults
   for(var i = 0; i < wheel_rotations.length; i++)
   {
      if(!wheel_rotations[i])
      {
         wheel_rotations[i] = 0;
      }
   }
   
   //fill in input
   for(var i = 0; i < wheel_rotations.length; i++)
   {
      document.getElementById("w" + (i + 1)).value=wheel_rotations[i];
   }
   
   return status;
} //end validateMecanum
 
/* @brief Animate the vehicle in vehicle reference point mode
 */
function animate()
{
   //get validated values from form
   DIRECTION = parseInt(document.getElementById("direction").value);
   SPEED = parseInt(document.getElementById("speed").value);
   ROTATION = parseInt(document.getElementById("rotation").value);
   
   //adjust angles so that vehicle and global coordinate systems line up
   DIRECTION -= 90;
   
   //draw path to be executed
   drawPathToBeExec(DIRECTION, SPEED);
   
   //set state of animation to animating
   animating = "vref";
   anim.start();
   document.getElementById("state").innerHTML="Animating Vehicle Reference Point";
   document.getElementById("cur_speed").innerHTML=(SPEED).toFixed(NUM_DEC_PLACES);
} //end animate

/* @brief Animate the vehicle in mecanum mode 
 */
function animateMecanum()
{
   //determine x and y component of velocity using forward kinematic equation
   //as well as rotation
   var matrix_mult_x = 0;
   var matrix_mult_y = 0;
   var matrix_mult_w = 0;
   for(var i = 0; i < wheel_rotations.length; i++)
   {
      matrix_mult_x += forward_kinematic[0][i] * wheel_rotations[i];
      matrix_mult_y += forward_kinematic[1][i] * wheel_rotations[i];
      matrix_mult_w += forward_kinematic[2][i] * wheel_rotations[i];
      console.log(matrix_mult_w + "+=" +  forward_kinematic[2][i] + "*" + wheel_rotations[i]);
   }

   var Vx = (RADIUS/4) * matrix_mult_x;
   var Vy = (RADIUS/4) * matrix_mult_y;
   var Vw = (RADIUS/4) * matrix_mult_w;
   
   //rotation in degrees
   ROTATION = -toDegrees(Vw);
   
   if(DEBUG == true)
   {
      console.log("Vx: " + Vx);
      console.log("Vy: " + Vy);
      console.log("Vw: " + Vw);
      console.log("dg: " + toDegrees(Vw));
   }
   
   //determine velocity using Pythagoras' Theorem
   SPEED = Math.sqrt(Math.pow(Vy,2) + Math.pow(Vx,2));
   
   if(speedLimit() == false)
   {
      return;
   }
   
   //avoid dividing by negative
   if(Vx != 0)
   {
      if(Vy != 0)
      {
         //there is movement in both x and y direction
         DIRECTION = toDegrees(Math.atan(Vy/Vx));
      }
      else
      {
         //there is only movement in the x direction
         DIRECTION = 0;
      }
   }
   else
   {
      if(Vy != 0)
      {
         //there is only movement in the y direction
         DIRECTION = -toDegrees(Math.atan(Vy/Vx));
      }
      else
      {
         //there is no movement
         DIRECTION = 0;
      }
   }
   
   //adjust for upper-left origin canvas coordinate system
   setSignMecanum(Vx, Vy);
   
   if(DEBUG == true)
   {
      console.log("DIR: " + DIRECTION);
   }
   
   //draw path to be executed
   drawPathToBeExec(DIRECTION, SPEED);
   
   //set state of animation to animating
   animating = "mecanum";
   anim.start();
   document.getElementById("state").innerHTML="Animating Wheel Mecanum mode";
   document.getElementById("cur_speed").innerHTML=(SPEED).toFixed(NUM_DEC_PLACES);
} //end animateMecanum

/* @brief Animate the vehicle in a circle
 */
function animateCircle(rad, inc, time)
{
   CIRCLE_RADIUS = rad;
   INCLINATION = inc;
   TIME = time;
   DIRECTION = parseFloat(INCLINATION) -180; //adjust direction to align with vehicle coordinate system

   //calculated distance and speed
   var circumference = 2 * Math.PI * CIRCLE_RADIUS;
   SPEED = circumference / TIME;
   
   if(DEBUG == true)
   {
      console.log("CIRCLE_RADIUS: " + CIRCLE_RADIUS);
      console.log("INCLINATION: " + INCLINATION);
      console.log("TIME: " + TIME);
      console.log("SPEED: " + SPEED);
      console.log("circumference: " + circumference);
   }
   
   if(speedLimit() == true)
   {
      //set state of animation to animating
      animating = true;
      animCircle.start();
      document.getElementById("state").innerHTML="Animating Circle";
      document.getElementById("cur_speed").innerHTML=(SPEED).toFixed(NUM_DEC_PLACES);
   }
} //end animateCircle

/* @brief Animate the vehicle in a rectangle
 */
function animateRectangle()
{
   RECT_W = document.getElementById("rect_w").value;
   RECT_H = document.getElementById("rect_h").value;
   INCLINATION = toRadians(document.getElementById("rect_inc").value - 180);
   TIME = document.getElementById("rect_sec").value;
   
    //calculated distance and time per side
   var distance = (RECT_W * 2) + (RECT_H * 2);
   var time_side = [(RECT_H/distance)*TIME, (RECT_W/distance)*TIME]; //height, width
   
   //trig
   var hyp = Math.sqrt(Math.pow(RECT_W,2) + Math.pow(RECT_H,2)); //hypotenuse of rectangle
   var theta = Math.atan(RECT_H/RECT_W);
   var alpha = INCLINATION + theta;
   var omega = Math.atan(RECT_W/RECT_H);
   var beta =  omega - INCLINATION;

   if(DEBUG == true)
   {
      console.log("RECT_W: " + RECT_W);
      console.log("RECT_H: " + RECT_H);
      console.log("INCLINATION (rad): " + INCLINATION);
      console.log("TIME: " + TIME);
      console.log("time_w: " + time_side[0]);
      console.log("time_h: " + time_side[1]);
      console.log("distance: " + distance);
      console.log("theta: " + theta);
      console.log("beta: " + beta);
      console.log("alpha: " + alpha);
   }
   
   //find diagonal opposite corner coordinates using rotation matrix
   var first_corn_x = CENTER_X - (Math.sin(beta) * feetToPixels(RECT_H));
   var first_corn_y = CENTER_Y + (Math.cos(beta) * feetToPixels(RECT_H));
   var diag_op_corn_x = CENTER_X + (Math.sin(INCLINATION) * feetToPixels(hyp));
   var diag_op_corn_y = CENTER_Y + (Math.cos(INCLINATION) * feetToPixels(hyp));
   var third_corn_x = CENTER_X + (Math.sin(alpha) * feetToPixels(RECT_W));
   var third_corn_y = CENTER_Y + (Math.cos(alpha) * feetToPixels(RECT_W));

   
   //pixel coordinates   
   var corners = [
                  coordPx2Ft(first_corn_x, first_corn_y), 
                  coordPx2Ft(diag_op_corn_x, diag_op_corn_y),
                  coordPx2Ft(third_corn_x, third_corn_y),
                  coordPx2Ft(CENTER_X, CENTER_Y)
                 ];

   //construct the waypoint data
   for(var i = 0; i < corners.length; i ++)
   {
      var waypoint = [];
      waypoint.push(corners[i][0]);  //x
      waypoint.push(corners[i][1]);  //y
      waypoint.push(time_side[i%2]); //time
      waypoint.push(0);              //orientation

      pushAndDrawWaypoint(waypoint);
   }
   
   if(speedLimit() == false)
   {
      return;
   }

   animatePointExecution(waypoints[0][0], waypoints[0][1], waypoints[0][2], waypoints[0][3]);
} //end animateRectangle

/* @brief Animate the vehicle given point execution parameters
 * @param x The destination x coordinate
 * @param y The destination y coordinate
 * @param time The value that the user entered for time
 * @param orientation The orientation that the vehicle will be at the 
 * destination
 */
function animatePointExecution(x, y, time, orientation)
{
   var status = determineWaypointData(x, y, time, orientation);
   
   if(status == true)
   {
      animating = true;
      animPointExecution.start();
      document.getElementById("state").innerHTML="Animating Point Execution";
      document.getElementById("cur_speed").innerHTML=(SPEED).toFixed(NUM_DEC_PLACES);
   }

} //end animatePointexecution

/* @brief Get waypoint animation data prior to execution
 * @param x The destination x coordinate
 * @param y The destination y coordinate
 * @param time The value that the user entered for time
 * @param orientation The orientation that the vehicle will be at the 
 * @return true if waypoint is valid, false otherwise
 * destination
 */
function determineWaypointData(x, y, time, orientation)
{
   //determine the direction to the end point
   var whereAmI_x = GLOBAL_X + pixelsToFeet(rect.getPosition().x - CENTER_X);
   var whereAmI_y = -(GLOBAL_Y + pixelsToFeet(rect.getPosition().y - CENTER_Y)); //negate y

   var whereAmIGoing_x = x;
   var whereAmIGoing_y = y;
   
   deltaX = whereAmIGoing_x - whereAmI_x;
   deltaY = whereAmI_y - whereAmIGoing_y;

   if(DEBUG == true)
   {
      console.log("x:" + x);
      console.log("y:" + y);
      console.log("whereAmI_x:" + whereAmI_x);
      console.log("whereAmI_y:" + whereAmI_y);
      console.log("whereAmIGoing_x:" + whereAmIGoing_x);
      console.log("whereAmIGoing_y:" + whereAmIGoing_y);
      console.log("deltaX:" + deltaX);
      console.log("deltaY:" + deltaY);
      console.log("time:" + time);
   }

   //determine how the sign of x and y will change
   setSign(deltaX, deltaY);

   //set animation variable for time
   TIME = parseFloat(time);
   
   //avoid divide by zero!
   var distance = 0;
   if(deltaX != 0)
   {
      if(deltaY != 0)
      {
         //there is movement in both x and y direction
         DIRECTION = Math.atan(deltaY/deltaX);
         //use Pythagoras' Theorem to get the distance to travel
         distance = Math.sqrt(Math.pow(deltaY,2) + Math.pow(deltaX,2));
         console.log("A");
      }
      else
      {  
         //there is only movement in the x direction
         DIRECTION = 0;
         distance = deltaX;
         console.log("B");
      }
   }
   else
   {
      if(deltaY != 0)
      {
         //there is only movement in the y direction
         DIRECTION = Math.atan(deltaY/deltaX);
         distance = deltaY;
         console.log("C");
      }
      else
      {  
         //there is no movement
         DIRECTION = 0;
         distance = 0;
         console.log("D");
      }
   }

   //calculate the drive speed in ft/sec to destination
   if(TIME != 0)
   {
      SPEED = Math.abs(distance / TIME);
   }
   else
   {
      console.log("TIME is zero!!!!!");
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
      return true;
   }
   
   document.getElementById("state").innerHTML="Finished, Reload";
   animating = "reload";
   return false;
} //end determineWaypointData

function speedLimit()
{
   if(SPEED > MAX_SPEED)
   {
      alert("The vehicle would travel at " + SPEED.toFixed(NUM_DEC_PLACES) + " ft/sec given the configuration that you entered. Unfortunately, the max speed of the vehicle is " + MAX_SPEED.toFixed(NUM_DEC_PLACES) + " ft/sec. Try again.");
      document.getElementById("state").innerHTML="Invalid Input";      
      return false;
   }
   
   return true;
}

/* @brief Determine what value to give the x and y multipliers. These
 * multipliers will be used to increase or decrease the x and y 
 * coordinates of the vehicle during animation.
 * @note The delta values are in pixels where y increases down and x
 * increases right.
 * @param deltaX The requested change in x
 * @param deltaY The requested change in y
 */
function setSign(deltaX, deltaY)
{
  //1st quadrant
  if(deltaY > 0 && deltaX > 0)
  {
     X_MULT = 1;
     Y_MULT = 1;
  }
  //2nd quadrant
  else if(deltaY > 0 && deltaX < 0)
  {
     X_MULT = -1;
     Y_MULT = -1;
  }
  //3rd quadrant
  else if(deltaY < 0 && deltaX < 0)
  {
     X_MULT = -1;
     Y_MULT = -1;
  }
  //4th quadrant
  else if(deltaY < 0 && deltaX > 0)
  {
     X_MULT = 1;
     Y_MULT = 1;
  }
  else
  {
      Y_MULT = 1;
      if(deltaX == 0)
      {
         X_MULT = 1;
      }
      else if(deltaY == 0)
      {
         if(deltaX < 0)
         {
            X_MULT = -1;
         }
      }
      else
      {
         //impossible
      }
  }
}

/* @brief Adjust for upper-left origin canvas coordinate system
 * @note The delta values are in pixels where y increases down and x
 * increases right.
 * @param deltaX The requested change in x
 * @param deltaY The requested change in y
 */
function setSignMecanum(Vx, Vy)
{
   if(Vx > 0)
   {
      DIRECTION = -DIRECTION;
   }
   else if(Vx < 0 && Vy < 0)
   {
      DIRECTION += 90;
   }
   else if(Vx < 0 && Vy == 0)
   {
      DIRECTION += 180;
   }
   else if(Vx < 0 && Vy > 0)
   {
      DIRECTION += 270;
   }
} //end setSignMecanum

/* @brief Reposition viewable area when vehicle reference point travels within
 * 3 feet of screen edge
 */
function checkRepositionView()
{ 
   //determine buffer planes
   brx = rect.getPosition().x + (Math.cos(toRadians(rect.getRotation())) * feetToPixels(BUFFER));
   bry = rect.getPosition().y + (Math.sin(toRadians(rect.getRotation())) * feetToPixels(BUFFER));
   blx = rect.getPosition().x - (Math.cos(toRadians(rect.getRotation())) * feetToPixels(BUFFER));
   bly = rect.getPosition().y - (Math.sin(toRadians(rect.getRotation())) * feetToPixels(BUFFER));
   btx = rect.getPosition().x + (Math.sin(toRadians(rect.getRotation())) * feetToPixels(BUFFER));
   bty = rect.getPosition().y - (Math.cos(toRadians(rect.getRotation())) * feetToPixels(BUFFER));
   bbx = rect.getPosition().x - (Math.sin(toRadians(rect.getRotation())) * feetToPixels(BUFFER));
   bby = rect.getPosition().y + (Math.cos(toRadians(rect.getRotation())) * feetToPixels(BUFFER));

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
   
   var diffx = -rect.x() + CENTER_X;
   var diffy = rect.y() - CENTER_Y;
   
   //center the vehicle
   rect.setX(CENTER_X);
   rect.setY(CENTER_Y);
   
   pathx = waypointLayer.getPosition().x + diffx;
   pathy = waypointLayer.getPosition().y - diffy;
   
   waypointLayer.setX(pathx);
   waypointLayer.setY(pathy);
   
   var points = done.getPoints();
   points.push(CENTER_X - pathx); // new x point 
   points.push(CENTER_Y - pathy); // new y point
   done.setPoints(points);
   
   pathLayer.setX(pathx);
   pathLayer.setY(pathy);
   pathLayer.draw();
   
   //pathLayer.removeChildren();
   waypointLayer.draw();
   donePoints = [[CENTER_X, CENTER_Y]];
   recentered = true;
}

/* @brief Convert feet x, y to pixels x, y 
 */
function coordFt2Px(x, y)
{
   var pxX = CENTER_X + feetToPixels(x); 
   var pxY = CENTER_Y - feetToPixels(y);
   var px = [];
   px[0] = pxX;
   px[1] = pxY;
   
   return px;
} //end coordFt2Px

/* @brief Convert pixels x, y to feet x, y 
 */
function coordPx2Ft(x, y)
{
   var ftX = pixelsToFeet(CENTER_X) - pixelsToFeet(x); 
   var ftY = pixelsToFeet(CENTER_Y) - pixelsToFeet(y);
   var ft = [];
   ft[0] = ftX;
   ft[1] = ftY;
   
   return ft;
} //end coordPx2Ft

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
   getInput();
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
   X = 0;
   Y = 0;
   ORIENTATION = 0;
   GLOBAL_X = 0;
   GLOBAL_Y = 0;
   CANVAS_X = 0;
   CANVAS_Y = 0;
   X_MULT = 1;
   Y_MULT = 1;
   CIRCLE_RADIUS = 0;
   INCLINATION = 0;
   RECT_W = 0;
   RECT_H = 0;
   recentered = true;
   frames = 0; //number of frames executed
   donePoints = [[CENTER_X, CENTER_Y]];
   
   animating = false;
   document.getElementById("state").innerHTML="Not Animating";
   anim.stop();
   animCircle.stop();
   animPointExecution.stop();
   
   //delete waypoint rows
   for(var i = 0; i < waypoints.length; i++)
   {
      //delete the first row
      document.getElementById("waypoints").deleteRow(1);
   }
   waypoints = [];
   cur_waypoint = 0;
   
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
   document.getElementById("x_coord").innerHTML="0.00";
   document.getElementById("y_coord").innerHTML="0.00";
   document.getElementById("cur_speed").innerHTML="0.00";
   document.getElementById("cur_time").innerHTML="0.00";
   document.getElementById("cur_rot").innerHTML="0.00";

   //update state
   document.getElementById("state").innerHTML="Not Animating";
} //end reset

/****************************
 *
 * Main
 *
 ****************************/
 
 //set input fields with any previous values
 setInput();

//draw grid
drawGridlines();

//draw vehicle
var imageObj = new Image();
imageObj.src = "car.png";
imageObj.onload = function() {
    rect.setFillPatternImage(imageObj);
    rect.fillPatternScaleX(VEHICLE_WIDTH_PX/100);
    rect.fillPatternScaleY(VEHICLE_HEIGHT_PX/200);
   
    stage.draw();
}
drawVehicle();
stage.add(waypointLayer);

pathLayer.add(done);
stage.add(pathLayer);

/****************************
 *
 * Listeners
 *
 ****************************/
 
/* @brief Detect a key press and stop animation
 */
document.onkeypress = function (e) 
{
   if(animating == "vref" || animating == "mecanum")
   {
      notAnimating();
   }
}; //end key press

/* @brief Detect a mouse click and stop animation
 */
document.onclick = function (e) 
{
   //if click is not on a button, stop the animation
   if(e.target.id != "button" && (animating == "vref" || animating == "mecanum"))
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
   animating = "reload";
   document.getElementById("state").innerHTML="'Stop' Command Received";
} //end notAnimating

function checkReload()
{
   if(animating == "reload")
   {
      alert("Please click Reset to perform another simulation.");
      return true;
   }
   
   return false;
}