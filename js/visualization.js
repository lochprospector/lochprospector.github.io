// Immediately Invoked Function Expression to limit access to our 
// variables and prevent name clashes
let viz = ((() => {

  // D3 dispath events
  const dispatchString = "selectionUpdated";
  const dispatchString2 = "hoverUpdated";
  // Variables defined here have a scope that spans the whole file
  var scatter, histograms;
  var data_attributes = ["no_of_rows", "no_of_columns", "percent_null_values_total", "percent_unique_values_total"];

  //read data from file
  let data = []
  d3.csv("data/final_metadata.csv").then(csv_data => {
    data = csv_data
    // First reduce the size of the data to a feasible number (200)
    // TODO: implement a better MDS algorithm in order to include all the data
    var dataset_size = Math.min(data.length, 200) 
    data = data.slice(0, dataset_size)

    // Draw the initial histograms that include all possible data points
    histograms = create_histograms(data)

    // Draw an initial scatterplot according to the default weights
    scatter = updateScatterplot(data)
    link_charts()
    // When the weights are changed, redraw the scatterplot
    const weight_settings = d3.selectAll('.weight_setting');
    weight_settings.on('change', function(d) {
      scatter = updateScatterplot(data)
      link_charts()
    })

    // Redraw and link again when user filters data 
    d3.selectAll('#filters').on('data_filtered', function(context, abv){
      data = d3.event.detail["new_data"]
      scatter = updateScatterplot(data)
      histograms = create_histograms(data)
      link_charts()
    });

    // Button selections change the data_attributes to the corresponding columns of our data
    // and also update the HTML text of the weight input
    const buttons = d3.selectAll('input[name="dataType"]');
    buttons.on('change', function(d) {
      if (this.value === "All")
      {
        data_attributes = ["no_of_rows", "no_of_columns", "percent_null_values_total", "percent_unique_values_total"];
        document.getElementById('weight_ncols_text').innerHTML = "Number of columns (Total):";
        document.getElementById('weight_null_text').innerHTML = "Null Values (Total):";
        document.getElementById('weight_unique_text').innerHTML = "Unique Values (Total):";
      }
      else if (this.value === "Numerical")
      {
        data_attributes = ["no_of_rows", "no_of_numerical_columns", "percent_null_values_numeric", "percent_unique_values_numeric"];
        document.getElementById('weight_ncols_text').innerHTML = "Number of columns (Numerical):";
        document.getElementById('weight_null_text').innerHTML = "Null Values (Numerical):";
        document.getElementById('weight_unique_text').innerHTML = "Unique Values (Numerical):";
      }
      else if (this.value === "Categorical")
      {
        data_attributes = ["no_of_rows", "no_of_string_columns", "percent_null_values_string", "percent_unique_values_string"];
        document.getElementById('weight_ncols_text').innerHTML = "Number of columns (Categorical):";
        document.getElementById('weight_null_text').innerHTML = "Null Values (Categorical):";
        document.getElementById('weight_unique_text').innerHTML = "Unique Values (Categorical):";
      }
      else
        console.log("Error: DataType selection not found")

      // Redraw and link
      histograms = create_histograms(data)
      scatter = updateScatterplot(data)
      link_charts()
    });
    
  })


  //create the histogram bar charts that show the distribution
  function create_histograms(data, filters=null){

    // The columns we need are those currently stored in data_attributes
    let numOfRows = d => parseInt(d[data_attributes[0]]);
    let numOfCol = d => parseInt(d[data_attributes[1]]);
    let nullPerc = d => parseFloat(d[data_attributes[2]]);
    let uniqPerc = d => parseFloat(d[data_attributes[3]]);

    // Draw the 4 histograms
    let histR = histogram()
      .selector("#num-rows")
      .attribute(numOfRows)
      .hoverDispatcher(d3.dispatch(dispatchString2))
      .xAxisLabel("Number of Rows")
      (data);
    let histC = histogram()
      .selector("#num-col")
      .attribute(numOfCol)
      .hoverDispatcher(d3.dispatch(dispatchString2))
      .xAxisLabel("Number of Columns")
      (data);
    let histN = histogram()
      .selector("#null-perc")
      .attribute(nullPerc)
      .hoverDispatcher(d3.dispatch(dispatchString2))
      .xAxisLabel("Percentage of Null Values")
      (data);
    let histU = histogram()
      .selector("#uniq-perc")
      .attribute(uniqPerc)
      .hoverDispatcher(d3.dispatch(dispatchString2))
      .xAxisLabel("Percentage of Unique Values")
      (data);    

    return {histR : histR, histC : histC, histN : histN, histU : histU};
  }


  function link_charts(){

    // When the scatterplot selection is updated via brushing, 
    // tell the histograms to update their selection (linking)
    scatter.selectionDispatcher().on(dispatchString.concat(".sc_to_hist"), selectedData => 
      {
        if (selectedData.length === 0) histograms = create_histograms(data)
        else histograms = create_histograms(selectedData)
        histograms.histR.hoverDispatcher().on(dispatchString2.concat(".histR_to_sc"), scatter.updateHover);
        histograms.histC.hoverDispatcher().on(dispatchString2.concat(".histC_to_sc"), scatter.updateHover);
        histograms.histN.hoverDispatcher().on(dispatchString2.concat(".histN_to_sc"), scatter.updateHover);
        histograms.histU.hoverDispatcher().on(dispatchString2.concat(".histU_to_sc"), scatter.updateHover);
      }
    );
    // When the scatterplot hover is updated, 
    // tell the histograms to update their hover (linking)    
    scatter.hoverDispatcher().on(dispatchString2.concat(".sc_to_hist"), hoveredData => 
      {
        histograms.histR.updateHover(hoveredData)
        histograms.histC.updateHover(hoveredData)
        histograms.histN.updateHover(hoveredData)
        histograms.histU.updateHover(hoveredData)
      }
    );

    // When the histograms hover is updated, 
    // tell the scatterplot to update their hover (linking)        
    histograms.histR.hoverDispatcher().on(dispatchString2.concat(".histR_to_sc"), scatter.updateHover);
    histograms.histC.hoverDispatcher().on(dispatchString2.concat(".histC_to_sc"), scatter.updateHover);
    histograms.histN.hoverDispatcher().on(dispatchString2.concat(".histN_to_sc"), scatter.updateHover);
    histograms.histU.hoverDispatcher().on(dispatchString2.concat(".histU_to_sc"), scatter.updateHover);

  }


  //create MDS scatterplot based on given data
  function updateScatterplot(data){

    // First find the number of tables we are going to plot
    var dataset_size = data.length
    
    // Normalize data
    // For every attribute we normalize from range (min, max) to (0, 100) with the formula:
    // new_value = (old_value -min) *((100-0)/(max-min))
    normalized_data = Array(dataset_size)
    min = Object()
    max = Object()
    // Find the max and min values for each attribute
    for (attr_index =0; attr_index < data_attributes.length; attr_index++){
      a = data_attributes[attr_index]
      min[a] = Number.POSITIVE_INFINITY
      max[a] = Number.NEGATIVE_INFINITY
      for (i=0; i<dataset_size; i++){
        normalized_data[i]= Object()
        min[a] = Math.min(data[i][a] , min[a])
        max[a] = Math.max(data[i][a], max[a])
      }
    }
    // Apply scaling to normalize
    for (attr_index =0; attr_index < data_attributes.length; attr_index++){
      a = data_attributes[attr_index]
      for (i=0; i<dataset_size; i++){
        normalized_data[i][a] = ((data[i][a] - min[a])*100.00) / (1.0* (max[a]- min[a]))
      }
    }

    // Save weights from HTML form to use in MDS algorithm
    weight_nrows = d3.select("#weight_nrows").property("value")
    weight_ncols = d3.select("#weight_ncols").property("value")
    weight_null = d3.select("#weight_null").property("value")
    weight_unique = d3.select("#weight_unique").property("value")
    weight = [weight_nrows, weight_ncols, weight_null, weight_unique]

    // As an input to the MDS algorithm we need a square dataset_size * dataset_size matrix
    // that contains the distances between the tables
    var distances = new Array(dataset_size);
    for (var i = 0; i < dataset_size; i++) {
      distances[i] = new Array(dataset_size);
      for (var j = 0; j < dataset_size; j++){
        // Calculate the distance of elements i and j
        // Use Euclidean distance
        // Use weighted differnce of each attribute pre-specified
        weighted_sum_square = 0 
        for (attr_index =0; attr_index < data_attributes.length; attr_index++){
          a = data_attributes[attr_index]
          val_i = parseInt(normalized_data[i][a])* weight[attr_index]
          val_j = parseInt(normalized_data[j][a])* weight[attr_index]
          weighted_sum_square += Math.pow(val_i-val_j , 2)
        }
        distances[i][j] = Math.sqrt(weighted_sum_square)
      }
    }

    // Call the MDS algorithm
    //console.log(distances);
    var positions = []
    if( dataset_size > 0) positions = mds.classic(distances);
    for (i=0; i<dataset_size; i++){
      data[i]["PosX"] = positions[i][0]
      data[i]["PosY"] = positions[i][1]
    }

    // Draw the scatterplot using the output of MDS
    let scatter = scatterplot()
      .x(d => d["PosX"])
      .y(d => d["PosY"])
      .attributes(data_attributes)
      .selectionDispatcher(d3.dispatch(dispatchString))
      .hoverDispatcher(d3.dispatch(dispatchString2))
      ("#vis-svg-1", data);
  
    return scatter;
  }
  
})());
