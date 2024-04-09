package org.example.ct.inlay;

import com.intellij.codeInsight.codeVision.*;
import com.intellij.codeInsight.codeVision.ui.model.ClickableTextCodeVisionEntry;
import com.intellij.codeInsight.codeVision.ui.model.CodeVisionPredefinedActionEntry;
import com.intellij.codeInsight.hints.InlayHintsUtils;
import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.util.Computable;
import com.intellij.openapi.util.Key;
import com.intellij.openapi.util.KeyWithDefaultValue;
import com.intellij.openapi.util.TextRange;
import com.intellij.psi.*;
import kotlin.Pair;
import kotlin.Unit;
import org.jetbrains.annotations.Nls;
import org.jetbrains.annotations.NotNull;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * 基于VisionProvider实现
 */
public class CodeVisionProviderImpl implements CodeVisionProvider<Unit> {
    public static final String GROUP_ID = "com.demo2";
    public static final String ID = "customPlugin2";
    public static final String NAME = "CustomPlugin2";
    private static final Key<Long> MODIFICATION_STAMP_KEY = Key.create("customPlugin2.modificationStamp");
    private static final Key<Integer> MODIFICATION_STAMP_COUNT_KEY = KeyWithDefaultValue.create("customPlugin2.modificationStampCount");

    // 每次文档事件都会电泳两次shouldRecomputeForEditor，设置4是因为刚刚打开没关闭的文件首次刷新导致渲染了宽度为0的Inlay
    private static final int MAX_MODIFICATION_STAMP_COUNT = 4;

    /**
     * 展示位置
     */
    @NotNull
    @Override
    public CodeVisionAnchorKind getDefaultAnchor() {
        return CodeVisionAnchorKind.Top;
    }

    /**
     * 获取id
     */
    @NotNull
    @Override
    public String getId() {
        return ID;
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
     * 在所有Inlay中的展示位置
     *
     * @return
     */
    @NotNull
    @Override
    public List<CodeVisionRelativeOrdering> getRelativeOrderings() {
        // 设置在id为customPlugin的后面
        return List.of(new CodeVisionRelativeOrdering.CodeVisionRelativeOrderingAfter("customPlugin"));
//        return List.of(CodeVisionRelativeOrdering.CodeVisionRelativeOrderingFirst.INSTANCE);
    }


    @NotNull
    @Override
    public CodeVisionState computeCodeVision(@NotNull Editor editor, Unit uiData) {
        List<PsiElement> psiElements = getPsiMethodsOrPsiClass(editor);
        List<Pair<TextRange, CodeVisionEntry>> codes = new ArrayList<>();
//        System.out.println("compute--------------------ForEditor" + uiData);
        psiElements.forEach(psiElement -> {
            String hint = getName();
            TextRange range = InlayHintsUtils.INSTANCE.getTextRangeWithoutLeadingCommentsAndWhitespaces(psiElement);
            codes.add(new Pair<>(range,
                    new ClickableTextCodeVisionEntry(hint, getId(),
                            new CodeVisionHandler(psiElement),
                            null,
                            hint,
                            "This is ‘这是提示信息’",
                            List.of())));
        });
        return new CodeVisionState.Ready(codes);
    }

    @Override
    public void handleClick(@NotNull Editor editor, @NotNull TextRange textRange, @NotNull CodeVisionEntry entry) {
        System.out.println("这是code vision的点击了--------------->");
        if (entry instanceof CodeVisionPredefinedActionEntry) {
            ((CodeVisionPredefinedActionEntry) entry).onClick(editor);
        }
    }

    /**
     * 获取当前编辑器下的方法以及类
     *
     * @param editor 编辑器
     * @return psiElement
     */
    private List<PsiElement> getPsiMethodsOrPsiClass(Editor editor) {
        // 加了一层读取锁
        return ApplicationManager.getApplication().runReadAction((Computable<List<PsiElement>>) (() -> {
            List<PsiElement> psiElements = new ArrayList<>();
            PsiFile psiFile = PsiManager.getInstance(Objects.requireNonNull(editor.getProject())).findFile(editor.getVirtualFile());
            if (psiFile == null) {
                // psi为空
                return psiElements;
            }
            SyntaxTraverser<PsiElement> traverser = SyntaxTraverser.psiTraverser(psiFile);
            traverser.forEach(psiElement -> {
                if (!(psiElement instanceof PsiMethod) && !(psiElement instanceof PsiClass)) {
                    return;
                }
                if (InlayHintsUtils.isFirstInLine(psiElement)) {
                    psiElements.add(psiElement);
                }
            });

            return psiElements;
        }));

    }

    @Override
    public Unit precomputeOnUiThread(@NotNull Editor editor) {
        return null;
    }

}
