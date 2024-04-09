package org.example.ct;

import com.intellij.openapi.vfs.VfsUtil;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.ui.jcef.JBCefBrowser;
import org.cef.browser.CefBrowser;
import org.example.actions.ShowHelloWorld;
import org.example.ct.event.CusCefLoadHandlerAdapter;
import org.example.ct.event.MessageBridge;

import javax.swing.*;
import java.awt.*;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URL;

public class HtmlFromJCEF {
    private final JPanel jPanel;

    public HtmlFromJCEF() {
//        Messages.showInfoMessage("Panel加载函数", "随便提示实时");
        System.out.println("Panel加载函数");
        jPanel = new JPanel();
        jPanel.setLayout(new BoxLayout(jPanel, BoxLayout.Y_AXIS));
        // 创建浏览器对象
        JBCefBrowser jbCefBrowser = new JBCefBrowser();
        // 浏览器加载事件(初始化通信桥梁)
        CusCefLoadHandlerAdapter cusCefLoadHandlerAdapter = new CusCefLoadHandlerAdapter(jbCefBrowser);
        jbCefBrowser.getJBCefClient().addLoadHandler(cusCefLoadHandlerAdapter, jbCefBrowser.getCefBrowser());

        // FIXME 初始化通信桥梁
        MessageBridge.setJbCefBrowser(jbCefBrowser);

        CefBrowser browser = jbCefBrowser.getCefBrowser();

        browser.executeJavaScript("console.log('Panel加载函数');", browser.getURL(), 0);

        SwingUtilities.invokeLater(() -> {
            // 将浏览器对象关联到自定义action上面
            ShowHelloWorld.setJbCefBrowser(jbCefBrowser);
        });

        // 将对象添加至panel
        jPanel.add(jbCefBrowser.getComponent(), BorderLayout.CENTER);

        /* 加载方式 */
        // 直接加载网络链接
        // jbCefBrowser.loadURL("www.google.com");
        // 直接加载物理路径（不推荐）
        // jbCefBrowser.loadURL(Paths.get("F:\\IdeaProject\\demo\\src\\main\\resources\\html\\index.html").toUri().toString());
         /*
          这段代码会从classpath
          （具体来说是从编译后的 target/classes 目录，IDEA会自动将 src/main/resources 中的文件拷贝至此）
          中查找 html/index.html 资源
         */
        URL url = getClass().getClassLoader().getResource("html/index.html");
        // 这里url.toURI().toString()读取出来是 jar:file/xxxxx的形式路径，jbCefBrowser无法识别会出现加载出来空白所以利用vfs虚拟文件系统
        //        jbCefBrowser.loadURL(url.toURI().toString());

        if (url != null) {
            // 通过url创建虚拟文件
            VirtualFile vf = VfsUtil.findFileByURL(url);
            if (vf != null) {
                try {
                    // 创建临时文件，并将虚拟文件写入
                    File tmpFile = File.createTempFile("index.html", ".html");
                    tmpFile.deleteOnExit();
                    try (OutputStream outputStream = new FileOutputStream(tmpFile)) {
                        outputStream.write(vf.contentsToByteArray());
                        // 加载临时文件
                        jbCefBrowser.loadURL(tmpFile.toURI().toURL().toString());
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }

                } catch (IOException e) {
                    throw new RuntimeException(e);
                }

            }
        }
    }

    public JComponent getContent() {
        return jPanel;
    }
}
