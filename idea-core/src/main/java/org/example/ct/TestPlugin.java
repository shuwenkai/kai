package org.example.ct;

import com.intellij.ui.jcef.JBCefBrowser;
import com.intellij.ui.jcef.JBCefBrowserBase;
import com.intellij.ui.jcef.JBCefJSQuery;
import org.cef.browser.CefBrowser;
import org.cef.handler.CefLoadHandlerAdapter;

import javax.swing.*;
import java.awt.*;

@Deprecated
public class TestPlugin {
    public void setupBrowser(JPanel jPanel) {
        JBCefBrowser jbCefBrowser = new JBCefBrowser();
        JBCefJSQuery jsQuery = JBCefJSQuery.create((JBCefBrowserBase) jbCefBrowser);

        // 注册回调监听器
        jsQuery.addHandler(message -> {
            System.out.println("Message from HTML: " + message);
            return null;
        });

        jPanel.setLayout(new BorderLayout());
        jPanel.add(jbCefBrowser.getComponent(), BorderLayout.CENTER);

        // 让页面可以访问JavaPanel对象，并设置别名为JavaPanel
        jbCefBrowser.getJBCefClient().addLoadHandler(new CefLoadHandlerAdapter() {
            @Override
            public void onLoadingStateChange(CefBrowser browser, boolean isLoading, boolean canGoBack, boolean canGoForward) {
                if (!isLoading) {
                    System.out.println("Page loaded.");
                    browser.executeJavaScript("window.JavaPanel=" + jsQuery.inject("JavaPanel") + ";", browser.getURL(), 0);
                }
            }
        }, jbCefBrowser.getCefBrowser());

        // 装载定制的HTML页面
        String html = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <title>MyPlugin</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <button id=\"myButton\">Click me!</button>\n" +
                "    <script>\n" +
                "        document.getElementById(\"myButton\").addEventListener(\"click\", function() {\n" +
                "            console.log('Button clicked.');\n" +
                "            document.write(window.JavaPanel);\n" +
                "            window.JavaPanel.postMessage(\"abc\");\n" +
                "        });\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>";

        jbCefBrowser.loadHTML(html);
    }
}
