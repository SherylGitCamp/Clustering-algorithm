import org.apache.spark.SparkConf;
import org.apache.spark.SparkContext;
import org.apache.spark.ml.classification.RandomForestClassificationModel;


public class InitializedModel {

    public static SparkConf conf = new SparkConf()
    .setMaster("local")
    .setAppName("elastic_test")
    .set("spark.serializer", "org.apache.spark.serializer.KryoSerializer");
    public static SparkContext sc = new SparkContext(conf);
    public static RandomForestClassificationModel SavedModel = RandomForestClassificationModel.load("/home/v/Downloads/saved_RF_gmm_0430_d4");

}
