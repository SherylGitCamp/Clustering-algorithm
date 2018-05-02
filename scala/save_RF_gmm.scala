import org.apache.spark.sql.functions.{min, max}
import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.ml.classification.RandomForestClassifier
import org.apache.spark.ml.evaluation.MulticlassClassificationEvaluator
import org.apache.spark.ml.feature.VectorAssembler
import org.apache.spark.sql.SQLContext
import SMOTE._

object save_RF_gmm {
  def main(args: Array[String]) {
    val conf: SparkConf = new SparkConf()
      .setMaster("local")
      .setAppName("elastic_test")
      .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
    //
    val sc: SparkContext = new SparkContext(conf)
    val sqlContext = new SQLContext(sc)

    // read labeled data
    val readDF = sqlContext.read.json("/home/v/Desktop/gmmJSON_10class_0430/reshaped_data_0430.json")
        readDF.show(10)


//    println(readDF.where("label = 1").count())
//    val rttColumn = readDF.columns("googRtt")
//    val nackColumn = readDF.columns("Nacks")
//    val plColumn = readDF.columns("PL")
//    val plisColumn = readDF.columns("Plis")


    val assembler = new VectorAssembler()
      .setInputCols(Array("googRtt", "PL", "Nacks", "Plis"))
      .setOutputCol("features")
    val inputDF = assembler.transform(readDF)
        inputDF.show(10)

    val splitSeed = 5043
    val Array(trainingData, testData) = inputDF.randomSplit(Array(0.70, 0.30), splitSeed)
    // testData.where("label == 4").show(10)

    //train the model
    val classifier = new RandomForestClassifier()
      .setFeaturesCol("features")
      .setLabelCol("label")
      .setImpurity("gini")
      .setMaxDepth(4)
      .setNumTrees(100)
      .setFeatureSubsetStrategy("auto")
      .setSeed(5043)
    val model = classifier.fit(trainingData)
    model.write.save("/home/v/Downloads/saved_RF_gmm_0430_d4")

    //predict
    val predictions = model.transform(testData)
    predictions.select("features", "label", "prediction").show(40)

    // evaluation
    val evaluator = new MulticlassClassificationEvaluator()
      .setLabelCol("label")
      .setPredictionCol("prediction")
      .setMetricName("accuracy")
    val accuracy = evaluator.evaluate(predictions)

    println(accuracy)


  }
}
