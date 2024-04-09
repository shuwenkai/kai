package org.example.ct;

import com.intellij.codeInsight.hints.InlayParameterHintsProvider;
import org.jetbrains.annotations.NotNull;

import java.util.Set;

public class BeforeFunctionTitle implements InlayParameterHintsProvider {
    private static final String NAME_OF_HINT = "custom-hint";

    @Override
    public @NotNull Set<String> getDefaultBlackList() {

        String hintText = "Your Hint Text"; // 替换为你想要显示的提示文本
        return null;

    }
}
