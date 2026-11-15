package com.ovy.app

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import android.widget.Toast

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val apiKeyInput = findViewById<EditText>(R.id.apiKeyInput)
        Prefs.getApiKey(this)?.let { apiKeyInput.setText(it) }

        findViewById<Button>(R.id.saveKeyButton).setOnClickListener {
            val key = apiKeyInput.text.toString().trim()
            Prefs.setApiKey(this, key)
            Toast.makeText(this, "Chave salva.", Toast.LENGTH_SHORT).show()
        }
    }
}
