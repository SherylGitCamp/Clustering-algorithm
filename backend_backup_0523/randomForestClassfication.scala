
import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.ml.feature.VectorAssembler
import org.apache.spark.sql.SQLContext
import org.apache.spark.sql._
import org.apache.spark.SparkContext._
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

object randomForestClassfication {


    val conf: SparkConf = new SparkConf()
    .setMaster("local")
    .setAppName("elastic_test")
    .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
    val sc: SparkContext = new SparkContext(conf)
    val sqlContext = new SQLContext(sc)

    import sqlContext.implicits._

    case class Row(i: Int, i1: Int, i2: Int, i3: Int)
    val SavedModel = RandomForestClassificationModel.load("/home/v/Downloads/saved_RF_gmm_0430_d4")

    def createDF(input:Array[Array[Int]]): Unit ={
//      val a:Array[Int] = input(0)
//      val b:Array[Int] = input(1)
//      val c:Array[Int] = input(2)
//      val d:Array[Int] = input(3)
//      System.out.println(b.mkString(" "))
//      System.out.println(c.mkString(" "))
      val x = input.transpose
      val rdd = sc.parallelize(x).map(ys => Row(ys(0), ys(1), ys(2), ys(3)))
      val df = rdd.toDF("RTT","PL","NACK","Plis")
      df.show(20)
    }

    val assembler =  new VectorAssembler()
      .setInputCols(Array("RTT","PL","NACK","Plis"))
      .setOutputCol("features")
    //val inputDF = assembler.transform()

    //SavedModel.transform(inputDF).toDF().show()

}
