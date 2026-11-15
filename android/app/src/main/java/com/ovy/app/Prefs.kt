package com.ovy.app

import android.content.Context

object Prefs {
    private const val PREFS_NAME = "ovy_prefs"
    private const val KEY_API_KEY = "api_key"

    fun getApiKey(context: Context): String? =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(KEY_API_KEY, null)

    fun setApiKey(context: Context, apiKey: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_API_KEY, apiKey)
            .apply()
    }
}
