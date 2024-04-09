package org.example.ct.event;

//import com.alibaba.fastjson2.

import com.alibaba.fastjson2.JSONObject;
import com.intellij.ui.jcef.JBCefBrowser;
import com.intellij.ui.jcef.JBCefJSQuery;
import org.cef.browser.CefBrowser;
import org.example.ct.dto.TypeJSONDto;

import java.util.function.Function;

public class MessageBridge {
    private static CefBrowser jbCefBrowser;

//    public MessageBridge(@NotNull JBCefBrowser jb) {
//        CefBrowser browser = jb.getCefBrowser();
//        jbCefBrowser = browser;
//        browser.executeJavaScript("console.log('MessageBridge初始化');", browser.getURL(), 0);
//    }

    /**
     * 接收js消息,根据type进行操作
     *
     * @return s
     */
    public static Function<? super String, ? extends JBCefJSQuery.Response> acceptJsMessage() {
        return (link -> {
            try {
                TypeJSONDto obj = JSONObject.parseObject(link, TypeJSONDto.class);
                System.out.println(obj.getType());
            } catch (Exception e) {
                System.out.println("转换出错");
                throw new RuntimeException(e);
            }
            return new JBCefJSQuery.Response("the send message is:" + link);
        });
    }

    public static void setJbCefBrowser(JBCefBrowser jbCefBrowser) {
        MessageBridge.jbCefBrowser = jbCefBrowser.getCefBrowser();
    }

    private static void sendToJs(String message) {
        CefBrowser browser = MessageBridge.jbCefBrowser;

        if (MessageBridge.jbCefBrowser == null) {
            return;
        }

        JSONObject json = new JSONObject();
        json.put("message", message);
        json.put("type", "send psi");
        /*
         * Fastjson 的 json.toJSONString() 方法默认会将 \\ 转义为 \\\\ ， \n 转义为 \\n，这是正确的 JSON 字符串格式
         * 但是executeJavaScript
         * 执行的是 JavaScript 代码，其中的字符串中的转义符 \\ 会被 JavaScript解析成 \
         * 所以需要将JSON 字符串进行二次转义
         * 也可以使用 net.minidev.json.JSONValue.escape(json.toString());
         */
        String str = json.toJSONString().replace("\\", "\\\\");
        //        String channelCode = "const chan = new BroadcastChannel('java-to-js');" +
        //                "chan.postMessage('send to js any sth')";
        // fixme 这里不需要再次初始化chan,因为前面加载完毕初始化了
        String channelCode = "chan.postMessage('" + str + "');";
        browser.executeJavaScript(channelCode, browser.getURL(), 0);
    }

    static public void sendMessage(String message) {
        if (MessageBridge.jbCefBrowser != null) {
            MessageBridge.sendToJs(message);
        } else {
            System.out.println("browser not init.");
        }
    }
}
