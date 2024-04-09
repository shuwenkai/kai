package org.example.settings;

import com.intellij.ui.components.JBCheckBox;
import com.intellij.ui.components.JBLabel;
import com.intellij.ui.components.JBTextField;
import com.intellij.util.ui.FormBuilder;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;

/**
 * 定义了包含文本框和checkbox的表单，映射到了类AppSettingsState
 */
public class AppSettingsComponent {
    private JPanel myMainPanel;

    // 文本框
    private  final JBTextField myUsername = new JBTextField();
    // 多选框
    private final JBCheckBox myIdeaUserStatus = new JBCheckBox("checkbox 提示文本");

    /**
     * 构造函数
     */
    public AppSettingsComponent(){
        // TODO 尚未明白
        myMainPanel = FormBuilder.createFormBuilder()
                .addLabeledComponent(new JBLabel("输入名字："), myUsername, 1, false)
                .addComponent(myIdeaUserStatus, 1)
                .addComponentFillVertically(new JBLabel(), 0)
                .getPanel();
    }

    /**
     *  获取数据的get / set方法
     * @return
     */

    public  JPanel getMyMainPanel() {
        return myMainPanel;
    }
    public JComponent getMyUsernameComponent() {
        return myUsername;
    }

    @NotNull
    public  String getMyUsernameText() {
        return myUsername.getText();
    }

    public void setMyUsername(@NotNull String text) {
        myUsername.setText(text);
    }

    public boolean getIdeaUserStatus() {
        return myIdeaUserStatus.isSelected();
    }

    public void setMyIdeaUserStatus(boolean status) {
        myIdeaUserStatus.setSelected(status);
    }

}
