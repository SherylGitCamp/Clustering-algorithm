function exit() {
  process.exit();
}

function stop(e) {
  if (e) {
    console.log(e);
  }
  sparkSession.stop().then(exit).catch(exit);
}

function run(sparkSession, spark){
	return new Promise(function(resolve, reject) {

    var root = process.env.EXAMPLE_ROOT || __dirname + "/.."

    var savedModel = new spark.ml.classification.RandomForestClassificationModel()
        .load(root+"/model/saved_RF_gmm_0430_d4");

    var test = sparkSession.createDataFrame([{"60","1","1","1"}],{"RTT","PLIS","PL","NACK"});

    var prediction = savedModel.transform(test).then(resolve).catch(reject);

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
    console.log(results);
    stop();
  }).catch(stop);
}
