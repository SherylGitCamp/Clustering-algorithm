import org.apache.spark.ml.classification.RandomForestClassifier
import org.apache.spark.ml.evaluation.MulticlassClassificationEvaluator
import org.apache.spark.ml.feature.VectorAssembler
import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.sql.SQLContext

object save_RFmodel {
  def main(args: Array[String]) {
    val conf: SparkConf = new SparkConf()
      .setMaster("local")
      .setAppName("elastic_test")
      .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
    //
    val sc: SparkContext = new SparkContext(conf)
    val sqlContext = new SQLContext(sc)

    // read labeled data
    val readDF = sqlContext.read.json("/home/v/Desktop/kmeanJSON_10class/part*.json")
      //  readDF.show(10)
    val  data4 = readDF.filter("Nacks != 0 OR PL != 0 OR Plis != 0").toDF()
    val Array(data1, data2) = readDF.filter("Nacks == 0 AND PL == 0 AND Plis == 0").toDF().randomSplit(Array(0.005, 0.995), 3213)
    val data3 = data1.union(data4).toDF()
    println(data3.count())
    data3.show(10)

    val assembler = new VectorAssembler()
      .setInputCols(Array("googRtt", "PL", "Nacks", "Plis"))
      .setOutputCol("features")
    val inputDF = assembler.transform(data3)
      //.drop("probability")
       // inputDF.show(10)

    val splitSeed = 5043
    val Array(trainingData, testData) = inputDF.randomSplit(Array(0.6, 0.4), splitSeed)
    trainingData.where("label == 0").count()

    //train the model
    val classifier = new RandomForestClassifier()
      .setFeaturesCol("features")
      .setLabelCol("label")
      .setImpurity("gini")
      .setMaxDepth(5)
      .setNumTrees(100)
      .setFeatureSubsetStrategy("auto")
      .setSeed(5043)
    val model = classifier.fit(trainingData)
    model.write.save("/home/v/Downloads/saved_RF_kmeans")

    //predict
    val predictions = model.transform(testData)
    predictions.select("features", "label", "prediction").show(20)

    // evaluation
    val evaluator = new MulticlassClassificationEvaluator()
      .setLabelCol("label")
      .setPredictionCol("prediction")
      .setMetricName("accuracy")
    val accuracy = evaluator.evaluate(predictions)

    println(accuracy)


  }
}
