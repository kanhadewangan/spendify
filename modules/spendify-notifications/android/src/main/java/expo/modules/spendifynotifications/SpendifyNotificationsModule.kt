package expo.modules.spendifynotifications

import android.content.ComponentName
import android.content.Intent
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.provider.Telephony
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

class SpendifyNotificationsModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("SpendifyNotifications")

    // onNotification: the listener queued a new money notification while JS is running.
    // onSms: the SMS inbox changed while JS is running (JS then reads anything new).
    Events("onNotification", "onSms")

    OnCreate {
      current = WeakReference(this@SpendifyNotificationsModule)
      context.contentResolver.registerContentObserver(Telephony.Sms.CONTENT_URI, true, smsObserver)
    }
    OnDestroy {
      current = null
      context.contentResolver.unregisterContentObserver(smsObserver)
    }

    Function("hasAccess") {
      NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
    }

    // Opens the system screen where the user turns on notification access for Spendify.
    Function("openAccessSettings") {
      val component = ComponentName(context, SpendifyNotificationListener::class.java)
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
        .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, component.flattenToString())
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        context.startActivity(intent)
      } catch (e: Exception) {
        context.startActivity(
          Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      }
    }

    Function("getPending") { NotificationQueue.all(context) }

    Function("clearPending") { keys: List<String> -> NotificationQueue.remove(context, keys.toSet()) }

    // READ_SMS itself is requested from JS with PermissionsAndroid.
    Function("hasSmsAccess") { SmsReader.hasAccess(context) }

    Function("readSms") { since: Double -> SmsReader.since(context, since.toLong()) }
  }

  private val smsObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
    override fun onChange(selfChange: Boolean) {
      sendEvent("onSms", emptyMap<String, Any>())
    }
  }

  companion object {
    private var current: WeakReference<SpendifyNotificationsModule>? = null

    fun notifyPosted() {
      current?.get()?.sendEvent("onNotification", emptyMap<String, Any>())
    }
  }
}
