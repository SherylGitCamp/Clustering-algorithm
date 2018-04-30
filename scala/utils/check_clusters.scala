package utils

import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.sql.SQLContext

object check_clusters {
  def main(args: Array[String]): Unit = {
    val conf: SparkConf = new SparkConf()
      .setMaster("local")
      .setAppName("elastic_test")
      .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
    //
    val sc: SparkContext = new SparkContext(conf)
    val sqlContext = new SQLContext(sc)
//   val readDF = sqlContext.read.json("/home/v/Desktop/kmeanJSON_10class_0427/part*.json")
//    //readDF.where("Nacks == 1 AND PL == 0 AND Plis == 0").show(100)
//    //println(readDF.where("Nacks == 1 AND PL == 0 AND Plis == 0").count())
//    readDF.where("label == 0").show(1000)
//    println(readDF.where("label == 0").count())
//    readDF.where("label == 1").show(1000)
//    println(readDF.where("label == 1").count())
//    readDF.where("label == 2").show(1000)
//    println(readDF.where("label == 2").count())
//    readDF.where("label == 3").show(1000)
//    println(readDF.where("label == 3").count())
//    readDF.where("label == 4").show(1000)
//    println(readDF.where("label == 4").count())
//    readDF.where("label == 5").show(1000)
//    println(readDF.where("label == 5").count())
//    readDF.where("label == 6").show(1000)
//    println(readDF.where("label == 6").count())
//    readDF.where("label == 7").show(1000)
//    println(readDF.where("label == 7").count())
//    readDF.where("label == 8").show(1000)
//    println(readDF.where("label == 8").count())
//    readDF.where("label == 9").show(1000)
//    println(readDF.where("label == 9").count())

   val readDF_gmm = sqlContext.read.json("/home/v/Desktop/gmmJSON_10class_0427/part*.json")
//    readDF_gmm.where("Nacks == 1 AND PL == 0 AND Plis == 0").show(100)
//    println(readDF_gmm.where("Nacks == 1 AND PL == 0 AND Plis == 0").count())

    readDF_gmm.where("label == 0").show(1000)
    println(readDF_gmm.where("label == 0").count())
    readDF_gmm.where("label == 1").show(1000)
    println(readDF_gmm.where("label == 1").count())
    readDF_gmm.where("label == 2").show(1000)
    println(readDF_gmm.where("label == 2").count())
    readDF_gmm.where("label == 3").show(1000)
    println(readDF_gmm.where("label == 3").count())
    readDF_gmm.where("label == 4").show(1000)
    println(readDF_gmm.where("label == 4").count())
    readDF_gmm.where("label == 5").show(1000)
    println(readDF_gmm.where("label == 5").count())
    readDF_gmm.where("label == 6").show(1000)
    println(readDF_gmm.where("label == 6").count())
    readDF_gmm.where("label == 7").show(1000)
    println(readDF_gmm.where("label == 7").count())
    readDF_gmm.where("label == 8").show(1000)
    println(readDF_gmm.where("label == 8").count())
    readDF_gmm.where("label == 9").show(1000)
    println(readDF_gmm.where("label == 9").count())


  }

}
