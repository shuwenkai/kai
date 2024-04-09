package org.example.ct.inlay;

import com.intellij.openapi.editor.Editor;
import com.intellij.psi.PsiClass;
import com.intellij.psi.PsiElement;
import com.intellij.psi.PsiMethod;
import kotlin.Unit;
import kotlin.jvm.functions.Function2;
import org.example.ct.event.MessageBridge;

import java.awt.event.MouseEvent;

public class CodeVisionHandler implements Function2<MouseEvent, Editor, Unit> {
    private final PsiElement psiElement;

    CodeVisionHandler(PsiElement psiElement) {
        this.psiElement = psiElement;
    }

    /**
     * 点击后的响应
     *
     * @param mouseEvent 鼠标事件
     * @param editor     编辑器
     * @return 无
     */
    @Override
    public Unit invoke(MouseEvent mouseEvent, Editor editor) {
        if(psiElement instanceof PsiMethod || psiElement instanceof PsiClass) {
            MessageBridge.sendMessage(psiElement.getText());
        }
        return null;
    }
}
