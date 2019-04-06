//script to execute when window is loaded
(function(){
//pseudo-global variables
//variables for data join
var attrArray = ["GEOID", "ENROLL", "TOTAL_REVENUE", "FEDERAL_REVENUE",
"STATE_REVENUE", "LOCAL_REVENUE", "TOTAL_EXPENDITURE", "INSTRUCTION_EXPENDITURE",
"SUPPORT_SERVICES_EXPENDITURE", "AVG_READING_4_SCORE", "AVG_READING_8_SCORE",
"AVG_MATH_4_SCORE", "AVG_MATH_8_SCORE"];

var expressed = attrArray[7];

//set chart dimensions
var chartWidth = 900,
    chartHeight = 460;
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate("+ leftPadding +"," + topBottomPadding+ ")";
//create linear scale for proportional bar sizing
var yScale = d3.scale.linear()
    .range([450, 0])
    .domain([0, 25]); // set for min/max values of TOTAL_REVENUE

window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width =900,
        height = 475;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area projection
    var projection = d3.geo.albersUsa()
        // .center([0,37.24])
        // .rotate([99.18, 0, 0])
        // .parallels([29.5, 45.5])
        .scale(999)
        .translate([width/2, height/2]);

    var path = d3.geo.path()
      .projection(projection);

    // use d3.queue to parallelize async data load
    d3_queue.queue()
        .defer(d3.csv, "data/2015_allStates.csv") //load attributes from csv file
        .defer(d3.json, "data/us_states.topojson") //load us background map
        .await(callback);

    function callback(error, csvData, usa){

      setGraticule(map, path);

      //translate us topojson
      var usa = topojson.feature(usa, usa.objects.US_states).features;

      //create the color scale
      var colorScale = makeColorScale(csvData);

      //join data
      stateData = joinData(usa, csvData);

      //function to create enumeration units
      setEnumerationUnits(usa, map, path, colorScale);

      createDropdown(csvData);

      //add coordinated viz to the map - bar chart
      setChart(csvData, colorScale);
    };
  };// end of setMap function

  function setGraticule(map, path){
    //create graticule generator
    var graticule = d3.geo.graticule()
        .step([5,5]); //lines every 5 degrees

    //create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline())
        .attr("class", "gratBackground")
        .attr("d", path);

    var gratLines = map.selectAll(".gratLines")
        .data(graticule.lines())
        .enter()
        .append("path")
        .attr("class", "gratLines")
        .attr("d", path);
  }; // end of setGraticule

  function joinData(usa, csvData){
    //loop through csv to assign each set of values to geojson region
    for (var i=0; i<csvData.length; i++){
      var csvState = csvData[i]; //assign csv row to variable
      var csvKey = csvState.GEOID; //the primary key for states

      //loop through geojson states  to find correct state
      for (var a=0; a<usa.length;a++){
        var geojsonProps = usa[a].properties; //the properties for current state in geojson
        var geojsonKey = geojsonProps.GEOID;
        //console.log(geojsonKey);

        //when keys match, transfer csv data to geojson properties objects
        if (geojsonKey==csvKey){
          //assign all attributes and values
          attrArray.forEach(function(attr){
            var val = parseFloat(csvState[attr]).toFixed(2); //get csv attribute value
            geojsonProps[attr] = val; //add that value to the geojson properties
          });
        //console.log(geojsonProps);
        };
      };
    };
   console.log(usa);
   return usa;
 };// end of joinData

 function setEnumerationUnits(usa, map, path, colorScale){

         //add US states to map
         var states = map.selectAll(".states")
             .data(usa)
             .enter()
             .append("path")
             .attr("class", function(d){
               return "states " + d.properties.GEOID;
             })
             .attr("d", path)
             .style("fill", function(d){
               return choropleth(d.properties, colorScale);
             });
 };

 function makeColorScale(data){
   var colorClasses = [
     "#edf8e9",
     "#bae4b3",
     "#74c476",
     "#31a354",
     "#006d2c"
   ];

   //create color scale generator
   var colorScale = d3.scale.threshold()
      .range(colorClasses);

  //build array of all values of the expressed attribute
  var domainArray = [];
  for (var i=0; i<data.length; i++){
    var val = parseFloat(data[i][expressed]);
    domainArray.push(val);
  };

  //cluster data using ckmeans clustering algorithm to create natural breaks
  var clusters = ss.ckmeans(domainArray, 5);
  console.log(clusters);

  //reset domain array to cluster minimums
  domainArray = clusters.map(function(d){
    return d3.min(d);
  });
  //remove first value from domain array to create class break points
  domainArray.shift();

  //assign array of expressed values as scale domain
  colorScale.domain(domainArray);

  return colorScale;
};

function choropleth(props, colorScale){
  //make sure attribute value is a number
  var val = parseFloat(props[expressed]);
  //if attribute value exists, assign a color, otherwise assign gray
  if (typeof val == 'number' && !isNaN(val)){
    return colorScale(val);
  } else {
    return "#CCC";
  };
};

function setChart(csvData, colorScale){


  //create second svg element for the chart
  var chart = d3.select("body")
      .append("svg")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("class", "chart");

  //create a rectangle for chart background fill
  var chartBackground = chart.append("rect")
      .attr("class", "chartBackground")
      .attr("width", chartInnerWidth)
      .attr("height", chartInnerHeight)
      .attr("transform", translate);



  //set bars for each state
  var bars = chart.selectAll(".bars")
      .data(csvData)
      .enter()
      .append("rect")
      .sort(function(a, b){
        return b[expressed]-a[expressed]
      })
      .attr("class", function(d){
        return "bars " + d.GEOID;
      })
      .attr("width", chartInnerWidth/csvData.length-1);

  //create a text element for the chart title
  var chartTitle = chart.append("text")
      .attr("x", 80)
      .attr("y", 40)
      .attr("class", "chartTitle")


  //create a vertical axis generator
  var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient("left");

  //place yAxis
  var axis = chart.append("g")
      .attr("class", "axis")
      .attr("transform", translate)
      .call(yAxis);

  //create frame for chart border
  var chartFrame = chart.append("rect")
      .attr("class", "chartFrame")
      .attr("width", chartInnerWidth)
      .attr("height", chartInnerHeight)
      .attr("transform", translate);

  updateChart(bars, csvData.length, colorScale);
}; //end of setChart

function createDropdown(csvData){
    //add select Element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
          //console.log("the attribute selection changed");
          changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){return d})
        .text(function(d){return d});
};//end of createDropdown

function changeAttribute(attribute, csvData){
  //change the expressed attribute
  expressed = attribute;

  //recreate the color scale
  var colorScale = makeColorScale(csvData);

  //recolor enumeration units
  var states = d3.selectAll(".states")
      .style("fill", function(d){
        return choropleth(d.properties, colorScale)
      });

  var bars = d3.selectAll(".bars")
      //re-sort bars
      .sort(function(a, b){

        return b[expressed]-a[expressed]
      });

  updateChart(bars, csvData.length, colorScale);
};//end of changeAttribute

function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d,i){
      return i * (chartInnerWidth / n) + leftPadding;
    })
    .attr("height", function(d, i){
      return 450 - yScale(parseFloat(d[expressed]));
    })
    .attr("y", function(d, i){
      return yScale(parseFloat(d[expressed])) +topBottomPadding;
    })
    //recolor bars
    .style("fill", function(d){
      return choropleth(d, colorScale);
    });

    var chartTitle = d3.select(".chartTitle")
        .text(expressed + " per student");
}; //end of updateChart
})();
