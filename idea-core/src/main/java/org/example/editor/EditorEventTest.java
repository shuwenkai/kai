package org.example.editor;

import com.intellij.openapi.actionSystem.*;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.actionSystem.EditorActionHandler;
import com.intellij.openapi.editor.actionSystem.EditorActionManager;
import com.intellij.openapi.project.Project;
import org.jetbrains.annotations.NotNull;

public class EditorEventTest extends AnAction {


    // EditorEventTest会在程序启动时被实例化，
    // 静态代码实例化的时候被执行
    // 静态代码块会在启动时执行
    static {
        // 将输入内容替换
//        EditorActionManager actionManager = EditorActionManager.getInstance();
//        TypedAction typedAction = actionManager.getTypedAction();
//        typedAction.setupHandler(new MyKeyTypedHandler());
    }

    @Override
    public void update(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        Editor editor = e.getData(CommonDataKeys.EDITOR);

        boolean menuAllowed = false;
        if (editor != null && project != null) {
            // 判断文本插入对象caret列表不为空
            menuAllowed = !editor.getCaretModel().getAllCarets().isEmpty();
        }

        // 没有caret 禁用当前action
        e.getPresentation().setEnabledAndVisible(menuAllowed);

    }

    @Override
    public void actionPerformed(@NotNull AnActionEvent anActionEvent) {
        Editor editor = anActionEvent.getRequiredData(CommonDataKeys.EDITOR);
        EditorActionManager actionManager = EditorActionManager.getInstance();

        EditorActionHandler actionHandler = actionManager.getActionHandler(IdeActions.ACTION_EDITOR_CLONE_CARET_BELOW);

        // 克隆文本插入符(克隆了一个光标在下一行)
        actionHandler.execute(editor, editor.getCaretModel().getPrimaryCaret(), anActionEvent.getDataContext());
    }


    @Override
    public @NotNull ActionUpdateThread getActionUpdateThread() {
        return super.getActionUpdateThread();
    }
}
