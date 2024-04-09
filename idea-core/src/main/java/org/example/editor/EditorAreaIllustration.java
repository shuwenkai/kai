package org.example.editor;

import com.intellij.openapi.actionSystem.ActionUpdateThread;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.actionSystem.CommonDataKeys;
import com.intellij.openapi.command.WriteCommandAction;
import com.intellij.openapi.editor.Caret;
import com.intellij.openapi.editor.Document;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.project.Project;
import org.jetbrains.annotations.NotNull;

public class EditorAreaIllustration extends AnAction  {
    @Override
    public void actionPerformed(@NotNull AnActionEvent anActionEvent) {

        // 获取必须的对象（编辑器、项目、文档）
        final Editor editor = anActionEvent.getRequiredData(CommonDataKeys.EDITOR);
        Project project = anActionEvent.getProject();
        Document document = editor.getDocument();

        // 获取已选文本的起始位置
        // 从CaretModel中获取到的文本插入符(caret) 对象可以提供 文本插入符(caret) 的相关信息。
        Caret primaryCaret = editor.getCaretModel().getPrimaryCaret();
        int start = primaryCaret.getSelectionStart();
        int end = primaryCaret.getSelectionEnd();

        // 替换文本
        // Document的replaceString() 方法可以执行文本替换。
        // 为了保证文本替换不出错，Document 对象必须加锁，
        // 所以必须在一个write action里执行修改。
        WriteCommandAction.runWriteCommandAction(project, () -> {
            document.replaceString(start, end, "替换文本");
        });

        // 替换后取消选择
        primaryCaret.removeSelection();

    }

    @Override
    public void update(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        // 获取编辑器实例
        Editor editor = e.getData(CommonDataKeys.EDITOR);

        // 存在project对象，编辑器实例时，并且选中文本启用该action，
        // 即打开项目，且右侧编辑器打开了文件并且选中文本的时候启用action
        e.getPresentation().setEnabledAndVisible(project != null && editor != null && editor.getSelectionModel().hasSelection());
    }

    @Override
    public @NotNull ActionUpdateThread getActionUpdateThread() {
        return super.getActionUpdateThread();
    }
}
