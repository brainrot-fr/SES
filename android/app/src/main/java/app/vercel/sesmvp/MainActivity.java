package app.vercel.sesmvp;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(NotificationSettingsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}