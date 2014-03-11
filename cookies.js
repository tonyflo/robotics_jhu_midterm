/* Tony Florida
 * EN 605.713 Robotics
 * Johns Hopkins University
 * Midterm Project
 * Given: 29 Jan 2014
 * Due: 12 Mar 2014
 * File: cookies.js
 * Description: save user input when page is reloaded using cookies
 */

 /****************************
 *
 * Cookies
 *
 ****************************/
 
 //list of input fields
var input = 
[
   "direction",
   "speed",
   "rotation",
   "w1",
   "w2",
   "w3",
   "w4",
   "pointX",
   "pointY",
   "time",
   "orientation",
   "circle_rad",
   "circle_inc",
   "circle_sec",
   "rect_w",
   "rect_h",
   "rect_inc",
   "rect_sec",
   "fig8_1_rad",
   "fig8_1_inc",
   "fig8_2_rad",
   "fig8_2_inc",
   "fig8_sec"
];

/* http://www.w3schools.com/js/js_cookies.asp
 */
function setCookie(cname,cvalue,exdays)
{
   var d = new Date();
   d.setTime(d.getTime()+(exdays*24*60*60*1000));
   var expires = "expires="+d.toGMTString();
   document.cookie = cname+"="+cvalue+"; "+expires;
}

/* http://www.w3schools.com/js/js_cookies.asp
 */
function getCookie(cname)
{
   var name = cname + "=";
   var ca = document.cookie.split(';');
   for(var i=0; i<ca.length; i++) 
   {
      var c = ca[i].trim();
      if (c.indexOf(name)==0) return c.substring(name.length,c.length);
   }
   return "";
}

function deleteAllCookies()
{
   for(var i = 0; i < input.length; i++)
   {
      setCookie(input[i],"",-1);
   }
}

/* @brief Add all input params to cookies
 */
function getInput()
{
   for(var i = 0; i < input.length; i++)
   {
      var val = document.getElementById(input[i]).value;
      setCookie(input[i],val,30);
   }
} //end getInput

/* @brief Get all input params from cookies
 */
function setInput()
{
   for(var i = 0; i < input.length; i++)
   {
      var val=getCookie(input[i]);
      document.getElementById(input[i]).value = val;
   }
} //end getInput