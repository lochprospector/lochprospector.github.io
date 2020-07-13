/* global D3 */

// Initialize a scatterplot. Modeled after Mike Bostock's
// Reusable Chart framework https://bost.ocks.org/mike/chart/
function scatterplot() {

    // Based on Mike Bostock's margin convention
    // https://bl.ocks.org/mbostock/3019563
    let margin = {
        top: 60,
        left: 50,
        right: 30,
        bottom: 20
      },
      width = 500 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      xValue = d => d[0],
      yValue = d => d[1],
      xScale = d3.scaleLinear(),
      yScale = d3.scaleLinear(),
      ourBrush = null,
      selectableElements = d3.select(null),
      data_attributes = null,
      dispatcherSelection, dispatcherHover;
  
    // Create the chart by adding an svg to the div with the id 
    // specified by the selector using the given data
    function chart(selector, data) {
      let svg = d3.select(selector)
          .attr("preserveAspectRatio", "xMidYMid meet")
          .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom].join(' '))
          .classed("svg-content", true);

      // Delete any previous elements
      // but store any selections on them
      let previous_selected_data = svg.selectAll(".selected").data()
      svg.selectAll("*").remove();


      svg = svg.append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
      // Define scales
      xScale
        .domain([
          d3.min(data, d => xValue(d)),
          d3.max(data, d => xValue(d))
        ])
        .rangeRound([0, width]);

      yScale
        .domain([
          d3.min(data, d => yValue(d)),
          d3.max(data, d => yValue(d))
        ])
        .rangeRound([height, 0]);

      //Creating tooltip element for hover text
      var tooltip = d3.select("body")
        .append("div")
        .append("p")
        .style("position", "absolute")
        .style("background-color","white")
        .style("padding","2px")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("a simple tooltip");

      svg.append("g")
          .attr("class", "brush")
          .call(brush);

      //console.log(data.length)
      if( data.length == 0){
        //console.log('Nothing to show')
        svg.append("text")
        .text("No dataset matches your criteria")
        .attr('y',height/2)
        .attr('x', width/8)
      }

      // Add the points
      let points = svg.selectAll(".scatterPoint");

      points = points
        .data(data)
        .enter()
        .append("a")
          .attr("xlink:href", d => "https://catalog.data.gov/dataset?q=" + d['title']
            .replace(':', '')
            .replace(/[{()}]/g, '')
            .split(' ')
            .join('+') + "&sort=score+desc%2C+name+asc")
          .attr("target", "blank")
        .append("circle")
          .attr("class", "point scatterPoint")
          .attr("cx", X)
          .attr("cy", Y)
          .attr("r", 7)
          .attr("pointer-events", "all"); //added to make hover+brushing possible together
      
      selectableElements = points;

      //mouseover text
      selectableElements
      .attr("pointer-events", "all")
      .on("mouseover", function(d, i){ 
        tooltip.html(data[i].title+"<br>"+
                      tooltip_text(data_attributes[0])+data[i][data_attributes[0]]+"<br>"+
                      tooltip_text(data_attributes[1])+data[i][data_attributes[1]]+"<br>"+
                      tooltip_text(data_attributes[2])+parseFloat(data[i][data_attributes[2]]).toFixed(2)+"%<br>"+
                      tooltip_text(data_attributes[3])+parseFloat(data[i][data_attributes[3]]).toFixed(2)+"%"); 
        //console.log(data_values[i]); 
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(d, i, elements){
        // Mark the point as hovered so that its color changes
        d3.select(elements[i]).classed("hover", true)
        // Also dipatch this event so that the other charts update their hover
        // Get the name of the hover dispatcher's event
        let dispatchStringHover = Object.getOwnPropertyNames(dispatcherHover._)[0];
        // Let other charts know about our hover
        dispatcherHover.call(dispatchStringHover, this, svg.selectAll(".hover").data());
        // Display a tooltip message
        return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function(d, i, elements){
        // Remove the hover class from the point
        d3.select(elements[i]).classed("hover", false)
        // Also dipatch this event so that the other charts update their hover
        // Get the name of the hover dispatcher's event
        let dispatchStringHover = Object.getOwnPropertyNames(dispatcherHover._)[0];
        // Let other charts know about our (end of) hover
        dispatcherHover.call(dispatchStringHover, this, svg.selectAll(".hover").data());
        // Stop displaying the tooltip message
        return tooltip.style("visibility", "hidden");
      })
      .on('mousedown', function(){
        // Because we appended the brush before the data points, 
        // any brushes that start on the data points don't work, because the data/tooltip is catching the pointer event. 
        // To fix this, we create our own event and dispatch it to the brush layer 
        brush_elm = svg.select('.brush > .overlay').node();
        const new_click_event = new MouseEvent('mousedown', {
          pageX: d3.event.pageX,
          pageY: d3.event.pageY,
          clientX: d3.event.clientX,
          clientY: d3.event.clientY,
          layerX: d3.event.layerX,
          layerY: d3.event.layerY,
          bubbles: true,
          cancelable: true,
          view: window });
        brush_elm.dispatchEvent(new_click_event);
      });

      // If any elements were previously selected, select them again
      chart.updateSelection(previous_selected_data)

      // Highlight points when brushed
      function brush(g) {
        const brush = d3.brush() // Create a 2D interactive brush
          .on("start brush", highlight) // When the brush starts/continues do...
          // By commenting out the line below, we get a persistent rectangular selection
          //.on("end", brushEnd) // When the brush ends do...
          .extent([
            [-margin.left, -margin.top],
            [width + margin.right, height + margin.bottom]
          ]);
          
        ourBrush = brush;
        g.call(brush); // Adds the brush to this element
  
        // Highlight the selected circles
        function highlight() {
          if (d3.brushSelection(this) === null) return;
          const [
            [x0, y0],
            [x1, y1]
          ] = d3.brushSelection(this);
  
          // If within the bounds of the brush, select it
          points.classed("selected", d =>
            x0 <= X(d) && X(d) <= x1 && y0 <= Y(d) && Y(d) <= y1
          );
  
          // Get the name of the selection dispatcher's event
          let dispatchStringSelection = Object.getOwnPropertyNames(dispatcherSelection._)[0];
  
          // Let other charts know about our selection
          dispatcherSelection.call(dispatchStringSelection, this, svg.selectAll(".selected").data());
        }
        
        function brushEnd(){
          // We don't want infinite recursion
          if(d3.event.sourceEvent.type!="end"){
            d3.select(this).call(brush.move, null);
          }         
        }
      }
  
      return chart;
    }
  
    // The x-accessor from the datum
    function X(d) {
      return xScale(xValue(d));
    }

    // The y-accessor from the datum
    function Y(d) {
      return yScale(yValue(d));
    }
  
    chart.x = function (_) {
      if (!arguments.length) return xValue;
      xValue = _;
      return chart;
    };
  
    chart.y = function (_) {
      if (!arguments.length) return yValue;
      yValue = _;
      return chart;
    };

    // Gets or sets the data attributes that have been used for the MDS distances
    chart.attributes = function (_) {
      if (!arguments.length) return data_attributes;
      data_attributes = _;
      return chart;
    };
  
    // Gets or sets the dispatcher we use for selection events
    chart.selectionDispatcher = function (_) {
      if (!arguments.length) return dispatcherSelection;
      dispatcherSelection = _;
      return chart;
    };

    // Gets or sets the dispatcher we use for hover events
    chart.hoverDispatcher = function (_) {
      if (!arguments.length) return dispatcherHover;
      dispatcherHover = _;
      return chart;
    };
  
    // Given selected data from another visualization 
    // select the relevant elements here (linking)
    chart.updateSelection = function (selectedData) {
      if (!arguments.length) return;
  
      // Select an element if its datum was selected
      selectableElements.classed("selected", d =>
        selectedData.includes(d)
      );
  
    };

    // Given hovered data from another visualization 
    // highlight them as hovered here (linking)
    chart.updateHover = function (hoveredData) {

      if (!arguments.length) return;
      if (typeof(hoveredData[0]) === "undefined")
      {
        selectableElements.classed("hover", false);
        return;
      }
  
      let hovered_serial_numbers = hoveredData[0].map(d => d["sr_no"]);

      // Select an element if its datum was selected
      selectableElements.classed("hover", d =>
        hovered_serial_numbers.includes(d["sr_no"])        
      );
  
    };
  
    // Returns the appropriate text to display on hover for each attribute
    function tooltip_text(a) {
      if (a === "no_of_rows") return "Rows: ";
      else if (a === "no_of_columns") return "Columns(Total) : ";
      else if (a === "percent_null_values_total") return "Null Values(Total): ";
      else if (a === "percent_unique_values_total") return "Unique Values(Total): ";

      else if (a === "no_of_numerical_columns") return "Columns(Numerical) : ";
      else if (a === "percent_null_values_numeric") return "Null Values(Numerical): ";
      else if (a === "percent_unique_values_numeric") return "Unique Values(Numerical): ";

      else if (a === "no_of_string_columns") return "Columns(Categorical) : ";
      else if (a === "percent_null_values_string") return "Null Values(Categorical): ";
      else if (a === "percent_unique_values_string") return "Unique Values(Categorical): ";
    }


    return chart;
  }