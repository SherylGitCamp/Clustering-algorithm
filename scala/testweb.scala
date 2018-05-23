import javax.websocket._

object testweb {
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
