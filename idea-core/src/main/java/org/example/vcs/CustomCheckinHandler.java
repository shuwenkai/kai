package org.example.vcs;

import com.intellij.openapi.vcs.CheckinProjectPanel;
import com.intellij.openapi.vcs.checkin.CheckinHandler;
import com.intellij.openapi.vcs.ui.RefreshableOnComponent;
import org.jetbrains.annotations.Nullable;

public class CustomCheckinHandler extends CheckinHandler {
    private CheckinProjectPanel cPanel;

    public CustomCheckinHandler(CheckinProjectPanel panel){
        cPanel = panel;
    }

    @Override
    public @Nullable RefreshableOnComponent getBeforeCheckinConfigurationPanel() {

        return new MyRefreshablePanel(cPanel);
    }
}
