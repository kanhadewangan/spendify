package expo.modules.spendifynotifications

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.Telephony
import androidx.core.content.ContextCompat

// "₹450", "Rs.450", "INR 450", or bank SMS wording like "debited by 85.0".
internal val MONEY = Regex("""(₹|\brs\.?|\binr)\s?\d|debited (by|for)\s?\d""", RegexOption.IGNORE_CASE)

// Reads the SMS inbox for money messages. Only rupee-amount SMS are returned; nothing is stored
// here and nothing leaves the device. Parsing happens in JS, same as captured notifications.
object SmsReader {
  private const val MAX = 500

  fun hasAccess(context: Context) =
    ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) ==
      PackageManager.PERMISSION_GRANTED

  // Inbox messages received after `since` (ms), oldest first, shaped like a captured notification.
  fun since(context: Context, since: Long): List<Map<String, Any?>> {
    if (!hasAccess(context)) return emptyList()
    val out = mutableListOf<Map<String, Any?>>()
    try {
      context.contentResolver.query(
        Telephony.Sms.Inbox.CONTENT_URI,
        arrayOf(Telephony.Sms._ID, Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE),
        "${Telephony.Sms.DATE} > ?",
        arrayOf(since.toString()),
        "${Telephony.Sms.DATE} ASC"
      )?.use { c ->
        val id = c.getColumnIndexOrThrow(Telephony.Sms._ID)
        val address = c.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
        val body = c.getColumnIndexOrThrow(Telephony.Sms.BODY)
        val date = c.getColumnIndexOrThrow(Telephony.Sms.DATE)
        while (c.moveToNext() && out.size < MAX) {
          val text = c.getString(body).orEmpty()
          if (!MONEY.containsMatchIn(text)) continue
          val sender = c.getString(address).orEmpty()
          out += mapOf(
            "key" to "sms:${c.getLong(id)}",
            "packageName" to "sms",
            "appName" to sender,
            "title" to sender,
            "text" to text,
            "postedAt" to c.getLong(date).toDouble(),
          )
        }
      }
    } catch (e: SecurityException) {
      return emptyList()
    }
    return out
  }
}
