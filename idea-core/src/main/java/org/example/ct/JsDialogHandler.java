package org.example.ct;

import org.cef.browser.CefBrowser;
import org.cef.callback.CefJSDialogCallback;
import org.cef.handler.CefJSDialogHandler;
import org.cef.misc.BoolRef;

public class JsDialogHandler implements CefJSDialogHandler {


    @Override
    public boolean onJSDialog(CefBrowser cefBrowser,
                              String s,
                              JSDialogType jsDialogType,
                              String s1,
                              String s2,
                              CefJSDialogCallback cefJSDialogCallback,
                              BoolRef boolRef) {
        boolRef.set(false);
        // 返回true，表明自行处理
        return false;
    }

    @Override
    public boolean onBeforeUnloadDialog(CefBrowser cefBrowser, String s, boolean b, CefJSDialogCallback cefJSDialogCallback) {
        return false;
    }

    @Override
    public void onResetDialogState(CefBrowser cefBrowser) {

    }

    @Override
    public void onDialogClosed(CefBrowser cefBrowser) {

    }
}
