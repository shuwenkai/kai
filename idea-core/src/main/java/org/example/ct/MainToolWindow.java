package org.example.ct;

import com.intellij.openapi.project.Project;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowFactory;
import com.intellij.ui.content.Content;
import com.intellij.ui.content.ContentFactory;
import org.jetbrains.annotations.NotNull;

public class MainToolWindow implements ToolWindowFactory {
    @Override
    public void createToolWindowContent(@NotNull Project project, @NotNull ToolWindow toolWindow) {

        ContentFactory contentFactory = ContentFactory.getInstance();
        HtmlFromJCEF htmlFromJCEF = new HtmlFromJCEF();
        Content content = contentFactory.createContent(htmlFromJCEF.getContent(), "", false);
        toolWindow.getContentManager().addContent(content);
        /*
          ToolWindowContent toolWindowContent = new ToolWindowContent();
          Content content = contentFactory.createContent(toolWindowContent.getContent(), "", false);
          toolWindow.getContentManager().addContent(content);
        */
    }
}
