package expo.modules.spendifynotifications

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

// Money-looking notifications captured by the listener, kept on-device until the app drains them.
// Survives the app being closed; capped so it can never grow without bound.
object NotificationQueue {
  private const val PREFS = "spendify_notifications"
  private const val KEY = "pending"
  private const val MAX = 200

  @Synchronized
  fun add(context: Context, item: JSONObject) {
    val list = read(context)
    for (i in 0 until list.length()) {
      if (list.getJSONObject(i).optString("key") == item.optString("key")) return
    }
    list.put(item)
    while (list.length() > MAX) list.remove(0)
    write(context, list)
  }

  @Synchronized
  fun all(context: Context): List<Map<String, Any?>> {
    val list = read(context)
    return (0 until list.length()).map { i ->
      val o = list.getJSONObject(i)
      o.keys().asSequence().associateWith { k -> o.get(k) }
    }
  }

  @Synchronized
  fun remove(context: Context, keys: Set<String>) {
    val list = read(context)
    val kept = JSONArray()
    for (i in 0 until list.length()) {
      val o = list.getJSONObject(i)
      if (o.optString("key") !in keys) kept.put(o)
    }
    write(context, kept)
  }

  private fun read(context: Context) =
    JSONArray(prefs(context).getString(KEY, "[]") ?: "[]")

  private fun write(context: Context, list: JSONArray) =
    prefs(context).edit().putString(KEY, list.toString()).apply()

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
