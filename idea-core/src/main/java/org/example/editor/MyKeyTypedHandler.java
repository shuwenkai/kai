package org.example.editor;

import com.intellij.openapi.actionSystem.DataContext;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.actionSystem.TypedActionHandler;
import org.jetbrains.annotations.NotNull;

public class MyKeyTypedHandler implements TypedActionHandler {
    @Override
    public void execute(@NotNull Editor editor, char c, @NotNull DataContext dataContext) {

//        Document document = editor.getDocument();
//        Project project = editor.getProject();

//        Runnable runnable = () -> document.insertString(0, "插入的字符串");
        // 写操作必须保证线程安全，所以使用 WriteCommandAction.runWriteCommandAction
//        WriteCommandAction.runWriteCommandAction(project, runnable);
    }
}
