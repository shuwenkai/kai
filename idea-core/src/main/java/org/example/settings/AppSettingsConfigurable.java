package org.example.settings;

import com.intellij.openapi.options.Configurable;
import org.jetbrains.annotations.Nls;
import org.jetbrains.annotations.Nullable;

import javax.swing.*;

/**
 * 这个类给idea调用, 相当于入口，这个类再调用AppSettingsComponent和AppSettingsState
 * plugin.xml使用 applicationConfigurable应用级设置 扩展点注册的实现类，必须有默认无参构造器, 这里默认无参构造函数会自动生成，不用显示定义
 * plugin.xml使用 projectConfigurable项目级设置 扩展点注册的设置实现类，必须有带 Project 一个参数的构造器
 */
public class AppSettingsConfigurable implements Configurable {

    private AppSettingsComponent appSettingsComponent;

    @Nls(capitalization = Nls.Capitalization.Title)
    @Override
    public String getDisplayName() {
        // public  @NlsContexts.ConfigurableName String getDisplayName()
        // 暂时没发现这里的作用，因为plugin.xml里面也有类似设置，最终展示的plugin.xml设置的值
        return "左侧设置列表展示的名字";
    }

    @Override
    public JComponent getPreferredFocusedComponent() {
        return appSettingsComponent.getMyUsernameComponent();
    }

    /**
     * 打开设置时会自动调用
     * @return 展示的表单
     */
    @Nullable
    @Override
    public JComponent createComponent() {
        appSettingsComponent = new AppSettingsComponent();
        return appSettingsComponent.getMyMainPanel();
    }

    /**
     * 检查是否进行了变更
     * @return 变更
     */
    @Override
    public boolean isModified() {
        AppSettingsState settingsState = AppSettingsState.getInstance();
//        boolean modified = !appSettingsComponent.getMyUsernameText().equals(settingsState.userId);
//        modified |= appSettingsComponent.getIdeaUserStatus() != settingsState.ideaStatus;
        boolean modified = false;
        if (!appSettingsComponent.getMyUsernameText().equals(settingsState.userId) || appSettingsComponent.getIdeaUserStatus() != settingsState.ideaStatus) {
            modified = true;
        }

        return modified;
    }

    /**
     * 变更后对存储值的实例进行赋值操作
     */
    @Override
    public void apply() {
        AppSettingsState settingsState = AppSettingsState.getInstance();
        settingsState.userId = appSettingsComponent.getMyUsernameText();
        settingsState.ideaStatus = appSettingsComponent.getIdeaUserStatus();
    }

    /**
     *  变更赋值操作
     * 在调用了Configurable.createComponent() 方法后会立即调用 Configurable.reset() 方法。
     *  所以不需要在构造函数或 createComponent() 方法中初始化设置项相关组件
     */
    @Override
    public  void  reset(){
        AppSettingsState appSettingsState = AppSettingsState.getInstance();
        appSettingsComponent.setMyUsername(appSettingsState.userId);
        appSettingsComponent.setMyIdeaUserStatus(appSettingsState.ideaStatus);
    }

    /**
     * 卸载操作，将实例对象置为null进行垃圾回收
     * 当用户点击了设置对话框里的OK或Cancel时，Configurable实例的生命周期才会结束。
     * 关闭设置对话框时会调用Configurable.disposeUIResources() 方法
     */
    @Override
    public void disposeUIResources() {
        appSettingsComponent = null;
    }

}
