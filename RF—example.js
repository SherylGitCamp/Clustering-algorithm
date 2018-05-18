function exit() {
  process.exit();
}

function stop(e) {
  if (e) {
    console.log(e);
  }
  sparkSession.stop().then(exit).catch(exit);
}



function run(sparkSession, spark) {
  return new Promise(function(resolve, reject) {

    var root = process.env.EXAMPLE_ROOT || __dirname + "/.."
    // Load and parse the data file, converting it to a DataFrame.
    var data = sparkSession.read().format("libsvm").load(root+"/mllib/data/sample_libsvm_data.txt");

    // Index labels, adding metadata to the label column.
    // Fit on whole dataset to include all labels in index.
    var labelIndexer = new spark.ml.feature.StringIndexer()
      .setInputCol("label")
      .setOutputCol("indexedLabel")
      .fit(data);

    // Automatically identify categorical features, and index them.
    // Set maxCategories so features with > 4 distinct values are treated as continuous.
    var featureIndexer = new spark.ml.feature.VectorIndexer()
      .setInputCol("features")
      .setOutputCol("indexedFeatures")
      .setMaxCategories(4)
      .fit(data);

    // Split the data into training and test sets (30% held out for testing)
    data.randomSplit([0.7, 0.3]).then(function(splits) {
      var trainingData = splits[0];
      var testData = splits[1];


      // Train a RandomForest model.
      var rf = new spark.ml.classification.RandomForestClassifier()
        .setLabelCol("indexedLabel")
        .setFeaturesCol("indexedFeatures");

      labelIndexer.labels().then(function(labels) {
        // Convert indexed labels back to original labels.
        var labelConverter = new spark.ml.feature.IndexToString()
          .setInputCol("prediction")
          .setOutputCol("predictedLabel")
          .setLabels(labels);

        // Chain indexers and forest in a Pipeline
        var pipeline = new spark.ml.Pipeline()
          .setStages([labelIndexer, featureIndexer, rf, labelConverter]);

        // Train model. This also runs the indexers.
        var model = pipeline.fit(trainingData);

        // Make predictions.
        var predictions = model.transform(testData);

        // Select (prediction, true label) and compute test error
        var evaluator = new spark.ml.evaluation.MulticlassClassificationEvaluator()
          .setLabelCol("indexedLabel")
          .setPredictionCol("prediction")
          .setMetricName("accuracy");
        var accuracy = evaluator.evaluate(predictions).then(resolve).catch(reject);

      });
    }).catch(reject);
  });
}

if (global.SC) {
  // we are being run as part of a test
  module.exports = run;
} else {
  var eclairjs = require('eclairjs');
  var spark = new eclairjs();
  var sparkSession = spark.sql.SparkSession
            .builder()
            .appName("Random Forest Classifier")
            .getOrCreate();

  run(sparkSession, spark).then(function(results) {
    console.log("Test error:", 1-results);
    stop();
  }).catch(stop);
}