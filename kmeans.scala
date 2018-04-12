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


object test {
  def main(args: Array[String]) {
    val conf: SparkConf = new SparkConf()
      .setMaster("local")
      .setAppName("elastic_test")
      .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

    val sc: SparkContext = new SparkContext(conf)
    val sqlContext = new SQLContext(sc)

    import sqlContext.implicits._
    import sqlContext._

//    write to elasticsearch
//    val numbers = Map("one" -> 1, "two" -> 2, "three" -> 3)
//    val airports = Map("arrival" -> "Otopeni", "SFO" -> "San Fran")
//    sc.makeRDD(Seq(numbers, airports)).saveToEs("spark/docs")
//
//     Read data from elasticsearch with filtering
//        val data2018 = sc.esRDD("data2018", "?q=@timestamp:2018-01-08 AND mediaType:video AND reportType:sender")
//    bank.foreach(println)
//
//        val dataRemain = data2018.map(_._2.filterKeys(Set("googRtt", "packetsLost", "googNacksReceived", "googPlisReceived").contains))
//        val columnNames = dataRemain.take(1).flatMap(a => a.keys)
     //@timestamp:2018-01-08 AND
    val data2018DF = sqlContext.esDF("data2018", "?q=mediaType:video AND reportType:sender")

    // remove unused fields
    val columnNames = Seq("@timestamp", "googRtt", "packetsLost", "googNacksReceived", "googPlisReceived", "pcId", "ssrc")
    // using the string column names:
    val dataRemain = data2018DF.select(columnNames.head, columnNames.tail: _*).orderBy("ssrc","@timestamp")

       // dataRemain.sqlContext.sql("SELECT * FROM dataRemain ORDER BY @timestamp")
       //   orderBy(DataFormat("@timestamp"))
    //   dataRemain.sqlContext.sql("DESC @timestamp")
    //remove rtt=0, 29344 data left

 //   val dataRemainDF = dataRemain.filter("googRtt != 0").withColumn("prev_packetsLost", lag(dataRemain("packetsLost"),1,null).over(Window.orderBy("ssrc","@timestamp")))
    val my_window = Window.orderBy("ssrc")
    val dataRemainDF = dataRemain.filter("googRtt != 0")
      .withColumn("prev_PL", lag(dataRemain("packetsLost"),1,0).over(my_window))
      .withColumn("prev_Nacks", lag(dataRemain("googNacksReceived"),1,0).over(my_window))
      .withColumn("prev_Plis", lag(dataRemain("googPlisReceived"),1,0).over(my_window))

    //  val dataRemainDF_v1 = dataRemainDF.withColumn("PL","packetsLost"-$"prev_packetsLost")

    val dataRemainDF_v1 = dataRemainDF
      .withColumn("PL", when(col("packetsLost")<col("prev_PL"),$"packetsLost").otherwise($"packetsLost"-$"prev_PL"))
      .withColumn("Nacks", when(col("googNacksReceived")<col("prev_Nacks"),$"googNacksReceived").otherwise($"googNacksReceived"-$"prev_Nacks"))
      .withColumn("Plis", when(col("googPlisReceived")<col("prev_Plis"),$"googPlisReceived").otherwise($"googPlisReceived"-$"prev_Plis"))
      .drop("packetsLost","googNacksReceived", "googPlisReceived","prev_PL","prev_Nacks","prev_Plis")



  //  val dataRemainDF_v1 = dataRemainDF.withColumn("PL1", when("PL" < 0),lit(0).otherwise("PL"))


    //dataRemainDF_v1.show(5)

    //assemble all the features together
    val assembler =  new VectorAssembler()
        .setInputCols(Array("googRtt", "PL", "Nacks", "Plis"))
        .setOutputCol("features")
    val inputDF = assembler.transform(dataRemainDF_v1)

    //inputDF.show(5)

//
//
    val scaler = new StandardScaler()
        .setInputCol("features")
        .setOutputCol("scaledFeatures")
        .setWithMean(true)
        .setWithStd(true)
        .fit(inputDF)
    // Scale features using the scaler model
    val scaledFeatures = scaler.transform(inputDF)


    //scaledFeatures.show(5)
//    println(dataRemainDF.count())
//    val numClusters = 10
//    val numIterations = 20
//    val clusters = KMeans.train(dataRemainDF,numClusters,numIterations)//train(dataRemainDF, numClusters, numIterations)
    val kmeansmodel = new KMeans()
      .setK(10)
      .setFeaturesCol("scaledFeatures")
      .setPredictionCol("prediction")
      .setMaxIter(3000)
      .fit(scaledFeatures)

    val results = kmeansmodel.transform(scaledFeatures)

    results.show(20)
//results.show(kmeansmodel.clusterCenters.foreach(println))

    println("Cluster centers:")
    kmeansmodel.clusterCenters.foreach(println)
  //results.toDF.where("scaleFeatures=
  //  results.where("scaleFeatures && kmeansmodel.clusterCenters != 0")
  //  kmeansmodel.clusterCenters.map()
    println(results.where("prediction == 9").toDF().count())
    results.where("prediction == 9").toDF.show(15)
    println(results.where("prediction == 8").toDF().count())
    results.where("prediction == 8").toDF.show(15)
    println(results.where("prediction == 7").toDF().count())
    results.where("prediction == 7").toDF.show(15)
    println(results.where("prediction == 6").toDF().count())
    results.where("prediction == 6").toDF.show(15)
    println(results.where("prediction == 5").toDF().count())
    results.where("prediction == 5").toDF.show(15)
    println(results.where("prediction == 4").toDF().count())
    results.where("prediction == 4").toDF.show(15)
    println(results.where("prediction == 3").toDF().count())
    results.where("prediction == 3").toDF.show(15)
    println(results.where("prediction == 2").toDF().count())
    results.where("prediction == 2").toDF.show(15)
    println(results.where("prediction == 1").toDF().count())
    results.where("prediction == 1").toDF.show(15)
    println(results.where("prediction == 0").toDF().count())
    results.where("prediction == 0").toDF.show(15)

  }
}
