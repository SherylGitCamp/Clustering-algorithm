
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


//    val conf: SparkConf = new SparkConf()
//    .setMaster("local")
//    .setAppName("elastic_test")
//    .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
//    val sc: SparkContext = new SparkContext(conf)
    val sc = InitializedModel.sc
    val sqlContext = new SQLContext(sc)

    import sqlContext.implicits._

    case class Row(i: Int, i1: Int, i2: Int, i3: Int)
    val rate_Map = Map(0 -> 0, 1 -> 0, 2 -> 1, 3 -> 6, 4 -> 0, 5 -> 4, 6 -> 5, 7 -> 0, 8 -> 3, 9 -> 2)



    def createDF(input:Array[Array[Int]],SavedModel: RandomForestClassificationModel): Int ={
//      val a:Array[Int] = input(0)
//      val b:Array[Int] = input(1)
//      val c:Array[Int] = input(2)
//      val d:Array[Int] = input(3)
//      System.out.println(b.mkString(" "))
//      System.out.println(c.mkString(" "))

      var rate_Count = Array.fill[Int](7)(0)
      val x = input.transpose
      val rdd = sc.parallelize(x).map(ys => Row(ys(0), ys(1), ys(2), ys(3)))
      val dataframe = rdd.toDF("RTT","PL","NACK","Plis")
      //dataframe.show(20)


      val assembler =  new VectorAssembler()
        .setInputCols(Array("RTT","PL","NACK","Plis"))
        .setOutputCol("features")
      val inputDF = assembler.transform(dataframe)

      SavedModel.transform(inputDF).toDF().drop("features","rawPrediction","probability").show()
      var result = SavedModel.transform(inputDF).where("prediction != 3").select("prediction").map(r => r.getDouble(0).toInt).collect.toList
      if(result.length < 2 )
        return 6;
      result = result.map(x => rate_Map(x))
      result.foreach(x => labelcount(rate_Count,x))
      //rate_Count.foreach(println)

      return rate_Count.zipWithIndex.maxBy(_._1)._2;
    }

    def labelcount(rate_Count:Array[Int], index: Int): Unit={
        rate_Count(index) = rate_Count(index) + 1
    }
    //SavedModel.transform(inputDF).toDF().show()

}
