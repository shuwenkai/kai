package org.example.ct;

import com.intellij.ui.components.JBLabel;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
@Deprecated
public class ToolWindowContent {
    private final JPanel jPanel;

    public ToolWindowContent() {
        jPanel = new JPanel();
        jPanel.setLayout(new BoxLayout(jPanel, BoxLayout.Y_AXIS));


        // 文本区域
        JPanel labelPanel = new JPanel();
        labelPanel.setLayout(new GridLayout(0, 1));
        labelPanel.add(new JBLabel("A输入名字"));
        JLabel fg = new JLabel("=========Label Text 文字信息========");
        labelPanel.add(fg);

        // 底部按钮区域
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JTextField name = new JTextField();
        buttonPanel.add(name);
        JButton submitButton = new JButton("提交");
        buttonPanel.add(submitButton);
        submitButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                String nameText = name.getText();
                labelPanel.add(new JLabel(nameText), -1);
                // 调用方法，防止不刷新
                jPanel.revalidate(); // 刷新JPanel
                jPanel.repaint(); // 重新绘制JPanel
            }
        });


        jPanel.add(labelPanel, BorderLayout.NORTH);
        jPanel.add(buttonPanel, BorderLayout.SOUTH);


    }

    public JComponent getContent() {
        return jPanel;
    }
}
