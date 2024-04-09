package org.example.ct.inlay;

import com.intellij.codeInsight.daemon.LineMarkerInfo;
import com.intellij.codeInsight.daemon.LineMarkerProvider;
import com.intellij.openapi.editor.markup.GutterIconRenderer;
import com.intellij.openapi.util.IconLoader;
import com.intellij.psi.PsiElement;
import com.intellij.psi.PsiMethod;
import com.intellij.util.Function;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;
import java.awt.event.MouseEvent;


public class LineMarkerProviderImpl implements LineMarkerProvider {

    private static final Icon CUSTOM_ICON = IconLoader.getIcon("icons/example.svg");

    private void onIconClock(MouseEvent event, PsiElement psiElement) {
        System.out.println("Clicked on icon!======== ^_^");
    }
    @Override
    public LineMarkerInfo getLineMarkerInfo(@NotNull PsiElement psiElement) {
        if (psiElement instanceof PsiMethod) {
            // 这里添加代码上方提示的元素判断
            Function<PsiElement, String> tooltipProvider = element -> "Hello, I am a custom inlay!";
            return new LineMarkerInfo<PsiElement>(psiElement, psiElement.getTextRange(),
                    CUSTOM_ICON,
                    tooltipProvider,
                    this::onIconClock,
                    GutterIconRenderer.Alignment.CENTER);
        }
        return null;
    }

}
