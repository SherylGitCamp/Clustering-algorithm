import java.util

import javafx.scene.input.DataFormat
import org.apache.arrow.vector.types.pojo.ArrowType.Timestamp
import org.apache.spark.{SparkConf, SparkContext}
import org.elasticsearch.spark._
import org.elasticsearch.spark.sql._
import org.apache.spark.ml.feature.VectorAssembler
import org.apache.spark.sql.SQLContext
import org.apache.spark.ml.clustering.{KMeans, KMeansModel}
import org.apache.spark.mllib.linalg.Vectors
import org.apache.spark.ml.feature.StandardScaler
import org.apache.spark.sql.functions.{stddev_pop, stddev_samp}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.expressions.Window
import org.apache.spark.ml.classification.{RandomForestClassificationModel, RandomForestClassifier}
import org.apache.spark.ml.evaluation.MulticlassClassificationEvaluator
import org.apache.spark.ml.util.{MLReader, MLWriter}
import java.util.Scanner


import scala.xml.dtd.Scanner

object random_forest{
  def main(args: Array[String]) {
    val conf: SparkConf = new SparkConf()
      .setMaster("local")
      .setAppName("elastic_test")
      .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
//
    val sc: SparkContext = new SparkContext(conf)
    val sqlContext = new SQLContext(sc)
//    // read labeled data
//    val readDF = sqlContext.read.json("/home/v/Desktop/kmeansCSV/part*.json")
//    //readDF.show(10)
//
//    val assembler =  new VectorAssembler()
//      .setInputCols(Array("googRtt", "PL", "Nacks", "Plis"))
//      .setOutputCol("features")
//    val inputDF = assembler.transform(readDF)

    //inputDF.show(10)

//    val scaler = new StandardScaler()
//      .setInputCol("features")
//      .setOutputCol("scaledFeatures")
//      .setWithMean(true)
//      .setWithStd(true)
//      .fit(inputDF)
//    // Scale features using the scaler model
//    val normalizedDF = scaler.transform(inputDF)
    //normalizedDF.show(10)

//    val splitSeed = 5043
//    val Array(trainingData, testData) = inputDF.randomSplit(Array(0.7, 0.3), splitSeed)
//
    //train the model
//    val classifier = new RandomForestClassifier()
//      .setFeaturesCol("features")
//      .setLabelCol("label")
//      .setImpurity("gini")
//      .setMaxDepth(3)
//      .setNumTrees(20)
//      .setFeatureSubsetStrategy("auto")
//      .setSeed(5043)
//    val model = classifier.fit(trainingData)
//    model.write.save("/home/v/Downloads/RF")

    val SavedModel = RandomForestClassificationModel.load("/home/v/Downloads/saved_RF_gmm_0430_d4")
    while(true)
    {
      println("RTT,PL,NACK,Plis:")
      val input = scala.io.StdIn.readLine()
      val line = new util.Scanner(input)
      val RTT = line.nextInt
      val PL = line.nextInt
      val NACK = line.nextInt
      val Plis = line.nextInt

      val dataframe = sqlContext.createDataFrame(Seq(
        (RTT, PL, NACK,Plis)
      )).toDF("RTT","PL","NACK","Plis")

      val assembler =  new VectorAssembler()
        .setInputCols(Array("RTT","PL","NACK","Plis"))
        .setOutputCol("features")
      val inputDF = assembler.transform(dataframe)

      SavedModel.transform(inputDF).toDF().show()
    }
    //predict
//    val predictions = SavedModel.transform(testData)
//    predictions.select("features", "label", "prediction").show(20)
//
//
//    // evaluation
//    val evaluator = new MulticlassClassificationEvaluator()
//      .setLabelCol("label")
//      .setPredictionCol("prediction")
//      .setMetricName("accuracy")
//    val accuracy = evaluator.evaluate(predictions)
//
//    println(accuracy)

  }
}
