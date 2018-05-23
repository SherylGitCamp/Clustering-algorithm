import io.netty.bootstrap.ServerBootstrap
import io.netty.channel.Channel
import io.netty.channel.EventLoopGroup
import io.netty.channel.nio.NioEventLoopGroup
import io.netty.channel.socket.nio.NioServerSocketChannel



object Main {
  def main(args: Array[String]): Unit = {
    val bossGroup = new NioEventLoopGroup
    val workGroup = new NioEventLoopGroup
    try {
      val b = new ServerBootstrap
      b.group(bossGroup, workGroup)
      b.channel(classOf[NioServerSocketChannel])
      b.childHandler(new MyWebSocketChannelHandler)
      System.out.println("服务端开启等待客户端连接....")
      val ch = b.bind(8888).sync.channel
      ch.closeFuture.sync
    } catch {
      case e: Exception =>
        e.printStackTrace()
    } finally {
      //优雅的退出程序
      bossGroup.shutdownGracefully()
      workGroup.shutdownGracefully()
    }
  }
}