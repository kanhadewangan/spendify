package expo.modules.spendifynotifications

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONObject

// Reads every posted notification but keeps only the ones that mention a rupee amount.
// Nothing else is stored, and nothing leaves the device; parsing happens in JS.
class SpendifyNotificationListener : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (sbn.packageName == packageName) return
    val n = sbn.notification ?: return
    if (n.flags and Notification.FLAG_GROUP_SUMMARY != 0) return

    val extras = n.extras
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
    val text = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
      ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString().orEmpty()
    if (!MONEY.containsMatchIn("$title $text")) return

    val item = JSONObject()
      .put("key", "${sbn.key}|${sbn.postTime}")
      .put("packageName", sbn.packageName)
      .put("appName", appLabel(sbn.packageName))
      .put("title", title)
      .put("text", text)
      .put("postedAt", sbn.postTime.toDouble())

    NotificationQueue.add(applicationContext, item)
    SpendifyNotificationsModule.notifyPosted()
  }

  private fun appLabel(pkg: String): String = try {
    val pm = applicationContext.packageManager
    @Suppress("DEPRECATION") // The flags overload is API 33+; minSdk is lower.
    pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
  } catch (e: Exception) {
    pkg
  }
}
