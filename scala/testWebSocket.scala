import javax.websocket._
import javax.websocket.server.ServerEndpoint


@ServerEndpoint("/hello")
class hellotest {
  @OnMessage def hello(message: String): String = {
    System.out.println("Received : " + message)
    message
  }

  @OnOpen def myOnOpen(session: Session): Unit = {
    System.out.println("WebSocket opened: " + session.getId)
  }

  @OnClose def myOnClose(reason: CloseReason): Unit = {
    System.out.println("Closing a WebSocket due to " + reason.getReasonPhrase)
  }
}

object testWebSocket{
  def main(args: Array[String]): Unit = {
    var hello = new hellotest()
    while(1){
      hello.myOnOpen();
    }
  }
}