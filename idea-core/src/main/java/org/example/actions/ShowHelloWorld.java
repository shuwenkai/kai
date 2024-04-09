package org.example.actions;

import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.project.Project;
import com.intellij.ui.jcef.JBCefBrowser;
import org.jetbrains.annotations.NotNull;


public class ShowHelloWorld extends AnAction {

    private static JBCefBrowser jbCefBrowser;

    public static void setJbCefBrowser(JBCefBrowser browser) {
        jbCefBrowser = browser;
    }

    @Override
    public void actionPerformed(@NotNull AnActionEvent e) {
        // Project project = e.getData(CommonDataKeys.PROJECT);
        // 两个操作一样的效果，内部调用就是上面的
        Project project = e.getProject();
//
//        String username = Messages.showInputDialog(project, "(标题)你的名字是？", "输入你的名字", Messages.getQuestionIcon());
//
//        Messages.showMessageDialog(project, "你好， " + username, "Information", Messages.getInformationIcon());

        if (jbCefBrowser != null) {

            jbCefBrowser.getCefBrowser().executeJavaScript("console.log('自定义触发')", jbCefBrowser.getCefBrowser().getURL(), 0);

        }

    }
}
