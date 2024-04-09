package org.example.editor;

import com.intellij.codeInsight.editorActions.ExtendWordSelectionHandler;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.util.TextRange;
import com.intellij.psi.PsiElement;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.List;

public class CustomTextSelect implements ExtendWordSelectionHandler {

    @Override
    public boolean canSelect(@NotNull PsiElement psiElement) {
        return false;
    }

    @Override
    public @Nullable List<TextRange> select(@NotNull PsiElement psiElement, @NotNull CharSequence charSequence, int i, @NotNull Editor editor) {
        return null;
    }
}
