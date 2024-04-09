package org.example.ct.inlay;


import com.intellij.codeInsight.codeVision.CodeVisionAnchorKind;
import com.intellij.codeInsight.codeVision.CodeVisionEntry;
import com.intellij.codeInsight.codeVision.CodeVisionRelativeOrdering;
import com.intellij.codeInsight.codeVision.ui.model.ClickableTextCodeVisionEntry;
import com.intellij.codeInsight.codeVision.ui.model.CodeVisionPredefinedActionEntry;
import com.intellij.codeInsight.hints.InlayHintsUtils;
import com.intellij.codeInsight.hints.codeVision.DaemonBoundCodeVisionProvider;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.util.TextRange;
import com.intellij.psi.*;
import kotlin.Pair;
import org.jetbrains.annotations.Nls;
import org.jetbrains.annotations.NotNull;

import java.util.ArrayList;
import java.util.List;


/**
 * 基于DaemonBoundCodeVisionProvider实现
 */
public class DaemonCodeVisionProviderImpl implements DaemonBoundCodeVisionProvider {

    public static final String GROUP_ID = "com.demo";
    public static final String ID = "customPlugin";
    public static final String NAME = "CustomPlugin";

    @NotNull
    @Override
    public String getId() {
        return ID;
    }

    /**
     * 默认展示在元素顶部
     *
     * @return 元素展示位置
     */
    @NotNull
    @Override
    public CodeVisionAnchorKind getDefaultAnchor() {
        return CodeVisionAnchorKind.Top;
    }

    @Nls
    @NotNull
    @Override
    public String getName() {
        return NAME;
    }

    @NotNull
    @Override
    public String getGroupId() {
        return GROUP_ID;
    }

    /**
     * 在所有Inlay中的展示位置,展示顺序
     *
     * @return 默认展示第一个
     */
    @NotNull
    @Override
    public List<CodeVisionRelativeOrdering> getRelativeOrderings() {
        // 第一个
        return List.of(CodeVisionRelativeOrdering.CodeVisionRelativeOrderingFirst.INSTANCE);
    }


    @NotNull
    @Override
    public List<Pair<TextRange, CodeVisionEntry>> computeForEditor(@NotNull Editor editor, @NotNull PsiFile file) {
        List<Pair<TextRange, CodeVisionEntry>> lences = new ArrayList<>();
        String languageId = file.getLanguage().getID();
//        System.out.println("compute--------------------ForEditor" + languageId);
        if (!"JAVA".equals(languageId)) {
            return lences;
        }
        SyntaxTraverser<PsiElement> traverser = SyntaxTraverser.psiTraverser(file);
        for (PsiElement psiElement : traverser) {
            // 如果不是函数或者类，直接跳过
            if (!(psiElement instanceof PsiMethod) && !(psiElement instanceof PsiClass)) {
                continue;
            }
            if (!InlayHintsUtils.isFirstInLine(psiElement)) {
                continue;
            }
            String hint = getName();
            TextRange range = InlayHintsUtils.INSTANCE.getTextRangeWithoutLeadingCommentsAndWhitespaces(psiElement);
            lences.add(new Pair<>(range,
                    new ClickableTextCodeVisionEntry(hint, getId(),
                            new CodeVisionHandler(psiElement),
                            null,
                            hint,
                            "This is ‘这是提示信息’",
                            List.of())));
        }

        return lences;
    }

    /**
     * 点击Inlay后的处理逻辑
     */
    @Override
    public void handleClick(@NotNull Editor editor, @NotNull TextRange textRange, @NotNull CodeVisionEntry entry) {
        System.out.println("handleClick out put--------------->");
        if (entry instanceof CodeVisionPredefinedActionEntry) {
            ((CodeVisionPredefinedActionEntry) entry).onClick(editor);
        }
    }

}
