package org.example.ct.event;

import com.intellij.ui.jcef.JBCefBrowser;
import com.intellij.ui.jcef.JBCefBrowserBase;
import com.intellij.ui.jcef.JBCefJSQuery;
import org.cef.browser.CefBrowser;
import org.cef.browser.CefFrame;
import org.cef.handler.CefLoadHandlerAdapter;

public class CusCefLoadHandlerAdapter extends CefLoadHandlerAdapter {
    private final JBCefJSQuery jbCefJSQuery;

    public CusCefLoadHandlerAdapter(JBCefBrowser browser) {
        jbCefJSQuery = JBCefJSQuery.create((JBCefBrowserBase) browser);
        jbCefJSQuery.addHandler(MessageBridge.acceptJsMessage());
    }

    @Override
    public void onLoadEnd(CefBrowser browser, CefFrame frame, int httpStatusCode) {

        String jsCode = jbCefJSQuery.inject("str",
                "response => console.log('call java 成功', response)",
                "(code, msg) => console.log('call java 失败', code, msg)");
        browser.executeJavaScript("window.js2Java=function(str){ " + jsCode + "};", browser.getURL(), 0);

        // 不知道为啥，这样使用会报错，直接console window._cusMessageChannel 也是存在的
//                String channelCode = "window._cusMessageChannel.postMessage('java send')";
//                browser.executeJavaScript(channelCode, browser.getURL(), 0);

        String channelCode = "const chan = new BroadcastChannel('java-to-js');" +
                "chan.postMessage('test java send. success')";
        browser.executeJavaScript(channelCode, browser.getURL(), 0);

    }

    @Override
    public void onLoadingStateChange(CefBrowser browser, boolean isLoading, boolean canGoBack, boolean canGoForward) {
    }

}
