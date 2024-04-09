package org.example.settings;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.PersistentStateComponent;
import com.intellij.openapi.components.State;
import com.intellij.openapi.components.Storage;
import com.intellij.util.xmlb.XmlSerializerUtil;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

/**
 * 定义了持久化文件的存储地址，
 *  PersistentStateComponent<AppSettingsState>传入的泛型就是数据最终的持久化数据类
 */
@State(
        name="org.example.settings.AppSettingsState",
        storages = @Storage("SdkSettingsPlugin.xml")
)
public class AppSettingsState implements PersistentStateComponent<AppSettingsState>{
    public String userId = "Wk Shu. Development";

    public boolean ideaStatus = false;

    public static AppSettingsState getInstance(){
        return ApplicationManager.getApplication().getService(AppSettingsState.class);
    }

    /**
     * 保存数据时会调用该方法
     * @return
     */
    @Override
    public @Nullable AppSettingsState getState() {
        return this;
    }

    /**
     * 加载组件时会调用该方法
     * @param appSettingsState
     */
    @Override
    public void loadState(@NotNull AppSettingsState appSettingsState) {
        XmlSerializerUtil.copyBean(appSettingsState, this);
    }

}
