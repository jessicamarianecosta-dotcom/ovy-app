package com.ovy.app

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

/**
 * Tela só pra colar a chave de API pessoal, usada pela ShareActivity quando
 * você compartilha um áudio do WhatsApp pro Ovy. Separada da tela principal
 * (que agora é o próprio site) pra não poluir a experiência do dia a dia.
 */
class ApiKeySettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_api_key)

        val apiKeyInput = findViewById<EditText>(R.id.apiKeyInput)
        Prefs.getApiKey(this)?.let { apiKeyInput.setText(it) }

        findViewById<Button>(R.id.saveKeyButton).setOnClickListener {
            val key = apiKeyInput.text.toString().trim()
            Prefs.setApiKey(this, key)
            Toast.makeText(this, "Chave salva.", Toast.LENGTH_SHORT).show()
        }
    }
}
