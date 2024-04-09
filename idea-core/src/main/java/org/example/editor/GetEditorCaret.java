package org.example.editor;

import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.actionSystem.CommonDataKeys;
import com.intellij.openapi.editor.*;
import com.intellij.openapi.ui.Messages;
import org.jetbrains.annotations.NotNull;

public class GetEditorCaret extends AnAction {

    @Override
    public void actionPerformed(AnActionEvent e) {
        Editor editor = e.getRequiredData(CommonDataKeys.EDITOR);

        // 通过编辑器获取文本插入对象caret
        CaretModel caretModel = editor.getCaretModel();

        Caret primaryCaret = caretModel.getPrimaryCaret();

        String message = getMessage(primaryCaret);

        Messages.showInfoMessage(message, "通过Caret获取位置信息");
    }

    private @NotNull String getMessage(Caret primaryCaret) {
        // 实际位置
        LogicalPosition logicalPosition = primaryCaret.getLogicalPosition();
        // 显示位置
        VisualPosition visualPosition = primaryCaret.getVisualPosition();

        // 拼接最后展示的信息,因为是从0开始，所以这里加了1
        String logicalPositionString = String.format("实际位置信息：第%d行, 第%d列 \n", logicalPosition.line + 1, logicalPosition.column + 1);
        String visualPositionString = String.format("展示位置信息：第%d行, 第%d列 \n", visualPosition.line + 1, visualPosition.column + 1);
        // 行尾的换行符计算偏移量，而换行符后的空格不计数
        String offetString = String.format("偏移量（当前document第一个字符到光标位置）：%d \n", primaryCaret.getOffset());
        return logicalPositionString + visualPositionString + offetString;

    }
}
