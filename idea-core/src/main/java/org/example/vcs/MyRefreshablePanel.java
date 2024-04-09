package org.example.vcs;

import com.intellij.openapi.vcs.CheckinProjectPanel;
import com.intellij.openapi.vcs.ui.RefreshableOnComponent;
import com.intellij.openapi.vfs.VirtualFile;

import javax.swing.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.List;

public class MyRefreshablePanel implements RefreshableOnComponent {
    private final JButton myButton;

    public MyRefreshablePanel(CheckinProjectPanel cPanel) {
        // 创建按钮并绑定事件
        JButton jButton = new JButton("获取信息并插入");

        jButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                // 这里获取变更，获取的虚拟文件
                List<VirtualFile> files = (List<VirtualFile>) cPanel.getVirtualFiles();
                // 获取的真实文件
                // List<File> files2 = (List<File>) cPanel.getFiles();

                for(VirtualFile file: files) {
                    // List<Change> changes = ChangeListManager.getInstance(cPanel.getProject()).getChange(file);
                }
                String message = "这是随便的提交信息";
                // 这里插入信息
                cPanel.setCommitMessage(message);
            }
        });
        myButton = jButton;
    }

    @Override
    public void saveState() {

    }

    @Override
    public void restoreState() {

    }

//    @Override
//    public JPanel getPanel() {
//        return null;
//    }

    public JComponent getComponent() {
        return myButton;
    }
}
