package app.vercel.sesmvp;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationSettings")
public class NotificationSettingsPlugin extends Plugin {
    @PluginMethod
    public void getStatus(PluginCall call) {
        Context context = getContext();
        NotificationManager notificationManager =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        PowerManager powerManager =
            (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        AlarmManager alarmManager =
            (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        JSObject status = new JSObject();
        status.put(
            "notificationsEnabled",
            Build.VERSION.SDK_INT < Build.VERSION_CODES.N || notificationManager.areNotificationsEnabled()
        );
        status.put(
            "exactAlarmGranted",
            Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
        );
        status.put(
            "batteryOptimizationExempt",
            Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                || powerManager.isIgnoringBatteryOptimizations(context.getPackageName())
        );
        call.resolve(status);
    }

    @PluginMethod
    public void openBatteryOptimizationSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            call.resolve();
            return;
        }

        Intent intent = new Intent(
            Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
            Uri.parse("package:" + getContext().getPackageName())
        );
        try {
            getActivity().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException error) {
            call.reject("Battery optimization settings are unavailable.", error);
        }
    }
}
