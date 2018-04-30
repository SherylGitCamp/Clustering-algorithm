import org.apache.spark.{SparkConf, SparkContext}
import org.elasticsearch.spark._
import org.elasticsearch.spark.sql._
import org.apache.spark.ml.feature.VectorAssembler
import org.apache.spark.sql.SQLContext
import org.apache.spark.ml.clustering.{GaussianMixture, GaussianMixtureModel, KMeans}
import org.apache.spark.ml.feature.StandardScaler
import org.apache.spark.sql.functions.{stddev_pop, stddev_samp}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.expressions.Window


object emClustering {
  def main(args: Array[String]) {
    val conf: SparkConf = new SparkConf()
      .setMaster("local")
      .setAppName("elastic_test")
      .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

    val sc: SparkContext = new SparkContext(conf)
    val sqlContext = new SQLContext(sc)

    import sqlContext.implicits._
    import sqlContext._

    val data2018DF = sqlContext.esDF("data2018", "?q=mediaType:video AND reportType:sender")


    val columnNames = Seq("@timestamp", "googRtt", "packetsLost", "googNacksReceived", "googPlisReceived", "pcId", "ssrc")
    // using the string column names:
    val dataRemain = data2018DF.select(columnNames.head, columnNames.tail: _*).orderBy("ssrc", "@timestamp")


    val my_window = Window.orderBy("ssrc")
    val dataRemainDF = dataRemain.filter("googRtt != 0").drop("googRTT > 7000000")
      .withColumn("prev_PL", lag(dataRemain("packetsLost"), 1, 0).over(my_window))
      .withColumn("prev_Nacks", lag(dataRemain("googNacksReceived"), 1, 0).over(my_window))
      .withColumn("prev_Plis", lag(dataRemain("googPlisReceived"), 1, 0).over(my_window))

    val dataRemainDF_v1 = dataRemainDF
      .withColumn("PL", when(col("packetsLost") < col("prev_PL"), $"packetsLost").otherwise($"packetsLost" - $"prev_PL"))
      .withColumn("Nacks", when(col("googNacksReceived") < col("prev_Nacks"), $"googNacksReceived").otherwise($"googNacksReceived" - $"prev_Nacks"))
      .withColumn("Plis", when(col("googPlisReceived") < col("prev_Plis"), $"googPlisReceived").otherwise($"googPlisReceived" - $"prev_Plis"))
      .drop("packetsLost", "googNacksReceived", "googPlisReceived", "prev_PL", "prev_Nacks", "prev_Plis")


    // filter the data
    val data4 = dataRemainDF_v1.filter("Nacks != 0 OR PL != 0 OR Plis != 0").toDF()
    val Array(data1, data2) = dataRemainDF_v1.filter("Nacks == 0 AND PL == 0 AND Plis == 0").toDF().randomSplit(Array(0.006, 0.994), 3213)
    val Array(data_a, data_b) = dataRemainDF_v1.filter("Nacks == 1 AND PL == 0 AND Plis == 0").toDF().randomSplit(Array(0.2, 0.8), 3213)
    val data3 = data1.union(data4).union(data_a).toDF()


    //assemble all the features together
    val assembler = new VectorAssembler()
      .setInputCols(Array("googRtt", "PL", "Nacks", "Plis"))
      .setOutputCol("features")
    val inputDF = assembler.transform(data3)

    val scaler = new StandardScaler()
      .setInputCol("features")
      .setOutputCol("scaledFeatures")
      .setWithMean(true)
      .setWithStd(true)
      .fit(inputDF)
    // Scale features using the scaler model
    val scaledFeatures = scaler.transform(inputDF)


    //em clustering
    val gmmModel = new GaussianMixture()
      .setK(10)
      .setFeaturesCol("scaledFeatures")
      .setPredictionCol("label")
      .setMaxIter(5000)
      .fit(scaledFeatures)

//    val kmeansmodel = new KMeans()
//      .setK(10)
//      .setFeaturesCol("scaledFeatures")
//      .setPredictionCol("label")
//      .setMaxIter(5000)
//      .fit(scaledFeatures)

    val results = gmmModel.transform(scaledFeatures)

    //results.toDF.where("scaleFeatures=
    //  results.where("scaleFeatures && kmeansmodel.clusterCenters != 0")
//    //  kmeansmodel.clusterCenters.map()
//    println(results.where("label == 9").toDF().count())
//    results.where("label == 9").toDF.show(1500)
//    println(results.where("label == 8").toDF().count())
//    results.where("label == 8").toDF.show(1500)
//    println(results.where("label == 7").toDF().count())
//    results.where("label == 7").toDF.show(1500)
//    println(results.where("label == 6").toDF().count())
//    results.where("label == 6").toDF.show(1500)
//    println(results.where("label == 5").toDF().count())
//    results.where("label == 5").toDF.show(1500)
//    println(results.where("label == 4").toDF().count())
//    results.where("label == 4").toDF.show(1500)
//    println(results.where("label == 3").toDF().count())
//    results.where("label == 3").toDF.show(1500)
//    println(results.where("label == 2").toDF().count())
//    results.where("label == 2").toDF.show(1500)
//    println(results.where("label == 1").toDF().count())
//    results.where("label == 1").toDF.show(1500)
//    println(results.where("label == 0").toDF().count())
//    results.where("label == 0").toDF.show(1500)

    //save in the desktop
    results.drop("features").drop("scaledFeatures").write.json("/home/v/Desktop/gmmJSON_10class_0427/")


    val kmeansmodel = new KMeans()
      .setK(10)
      .setFeaturesCol("scaledFeatures")
      .setPredictionCol("label")
      .setMaxIter(5000)
      .fit(scaledFeatures)

    val results_k = kmeansmodel.transform(scaledFeatures)

//    //results.toDF.where("scaleFeatures=
//    //  results.where("scaleFeatures && kmeansmodel.clusterCenters != 0")
//    //  kmeansmodel.clusterCenters.map()
//    println(results_k.where("label == 9").toDF().count())
//    results_k.where("label == 9").toDF.show(1500)
//    println(results_k.where("label == 8").toDF().count())
//    results_k.where("label == 8").toDF.show(1500)
//    println(results_k.where("label == 7").toDF().count())
//    results_k.where("label == 7").toDF.show(1500)
//    println(results_k.where("label == 6").toDF().count())
//    results_k.where("label == 6").toDF.show(1500)
//    println(results_k.where("label == 5").toDF().count())
//    results_k.where("label == 5").toDF.show(1500)
//    println(results_k.where("label == 4").toDF().count())
//    results_k.where("label == 4").toDF.show(1500)
//    println(results_k.where("label == 3").toDF().count())
//    results_k.where("label == 3").toDF.show(1500)
//    println(results_k.where("label == 2").toDF().count())
//    results_k.where("label == 2").toDF.show(1500)
//    println(results_k.where("label == 1").toDF().count())
//    results_k.where("label == 1").toDF.show(1500)
//    println(results_k.where("label == 0").toDF().count())
//    results_k.where("label == 0").toDF.show(1500)

    //save in the desktop
    results_k.drop("features").drop("scaledFeatures").write.json("/home/v/Desktop/kmeanJSON_10class_0427/")

  }
}
