package com.ovy.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var apiKeyInput: EditText
    private lateinit var statusText: TextView

    private val micPermissionCode = 100
    private val notificationPermissionCode = 101

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        apiKeyInput = findViewById(R.id.apiKeyInput)
        statusText = findViewById(R.id.statusText)

        Prefs.getApiKey(this)?.let { apiKeyInput.setText(it) }

        findViewById<Button>(R.id.saveKeyButton).setOnClickListener {
            val key = apiKeyInput.text.toString().trim()
            Prefs.setApiKey(this, key)
            Toast.makeText(this, "Chave salva.", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.overlayPermissionButton).setOnClickListener {
            requestOverlayPermission()
        }

        findViewById<Button>(R.id.micPermissionButton).setOnClickListener {
            requestMicPermission()
        }

        findViewById<Button>(R.id.toggleButton).setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                Toast.makeText(this, "Permita \"Exibir sobre outros apps\" primeiro.", Toast.LENGTH_LONG).show()
                requestOverlayPermission()
                return@setOnClickListener
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED
            ) {
                Toast.makeText(this, "Permita o microfone primeiro.", Toast.LENGTH_LONG).show()
                requestMicPermission()
                return@setOnClickListener
            }
            if (Prefs.getApiKey(this).isNullOrBlank()) {
                Toast.makeText(this, "Salve sua chave de API primeiro.", Toast.LENGTH_LONG).show()
                return@setOnClickListener
            }
            startService(Intent(this, OverlayService::class.java))
            Toast.makeText(
                this,
                "Botão flutuante ativado. Você já pode sair deste app.",
                Toast.LENGTH_LONG
            ).show()
        }

        findViewById<Button>(R.id.stopButton).setOnClickListener {
            stopService(Intent(this, OverlayService::class.java))
            Toast.makeText(this, "Botão flutuante desativado.", Toast.LENGTH_SHORT).show()
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), notificationPermissionCode
            )
        }

        updateStatus()
    }

    override fun onResume() {
        super.onResume()
        updateStatus()
    }

    private fun updateStatus() {
        val overlayOk = Settings.canDrawOverlays(this)
        val micOk = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
        statusText.text = buildString {
            append(if (overlayOk) "✅ Sobreposição permitida\n" else "❌ Sobreposição não permitida\n")
            append(if (micOk) "✅ Microfone permitido" else "❌ Microfone não permitido")
        }
    }

    private fun requestOverlayPermission() {
        val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
        startActivity(intent)
    }

    private fun requestMicPermission() {
        ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), micPermissionCode)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        updateStatus()
    }
}
