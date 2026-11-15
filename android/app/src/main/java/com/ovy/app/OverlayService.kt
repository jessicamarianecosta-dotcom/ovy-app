package com.ovy.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.res.Resources
import android.graphics.PixelFormat
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Serviço em primeiro plano que mantém um botão flutuante arrastável sobre
 * qualquer outro app (requer permissão "Exibir sobre outros apps"), grava o
 * microfone em blocos curtos e envia cada bloco para o mesmo endpoint da
 * extensão Chrome. Botão e painel são duas janelas separadas do WindowManager
 * (não um único container), para que o painel possa aparecer/desaparecer sem
 * deslocar a posição do botão.
 */
class OverlayService : Service() {

    private lateinit var windowManager: WindowManager

    private lateinit var fabView: View
    private lateinit var fabParams: WindowManager.LayoutParams
    private lateinit var fab: Button

    private lateinit var panelView: View
    private lateinit var panelParams: WindowManager.LayoutParams
    private lateinit var linesText: TextView

    private var recording = false
    private var recorder: MediaRecorder? = null

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var backoffUntil = 0L

    companion object {
        const val CHANNEL_ID = "ovy_overlay_channel"
        const val NOTIFICATION_ID = 1
        const val CHUNK_MS = 8000L
        const val FAB_SIZE_DP = 56
        const val PANEL_WIDTH_DP = 280
        const val PANEL_HEIGHT_ESTIMATE_DP = 220
    }

    override fun onCreate() {
        super.onCreate()
        startForegroundNotification()
        setupFab()
        setupPanel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onBind(intent: Intent?): IBinder? = null

    private fun dp(value: Int): Int = (value * Resources.getSystem().displayMetrics.density).toInt()

    private fun overlayType() =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            WindowManager.LayoutParams.TYPE_PHONE

    private fun startForegroundNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Ovy legenda flutuante", NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Ovy")
            .setContentText("Legenda flutuante ativa")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .build()
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun setupFab() {
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        fabView = LayoutInflater.from(this).inflate(R.layout.overlay_fab, null)
        fab = fabView.findViewById(R.id.fab)

        fabParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = dp(16)
            y = Resources.getSystem().displayMetrics.heightPixels - dp(220)
        }

        windowManager.addView(fabView, fabParams)
        setupDrag()
    }

    private fun setupPanel() {
        panelView = LayoutInflater.from(this).inflate(R.layout.overlay_panel, null)
        linesText = panelView.findViewById(R.id.linesText)
        val closeButton = panelView.findViewById<ImageButton>(R.id.closeButton)
        panelView.visibility = View.GONE

        panelParams = WindowManager.LayoutParams(
            dp(PANEL_WIDTH_DP),
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }

        windowManager.addView(panelView, panelParams)

        closeButton.setOnClickListener {
            stopRecordingLoop()
            panelView.visibility = View.GONE
        }
    }

    private fun setupDrag() {
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var moved = false

        fab.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = fabParams.x
                    initialY = fabParams.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    moved = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true
                    if (moved) {
                        fabParams.x = initialX + dx
                        fabParams.y = initialY + dy
                        windowManager.updateViewLayout(fabView, fabParams)
                        repositionPanel()
                    }
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (!moved) toggleRecording()
                    true
                }
                else -> false
            }
        }
    }

    private fun repositionPanel() {
        val metrics = Resources.getSystem().displayMetrics
        val panelHeightEstimate = dp(PANEL_HEIGHT_ESTIMATE_DP)
        val spaceAbove = fabParams.y
        panelParams.y = if (spaceAbove > panelHeightEstimate + dp(20)) {
            fabParams.y - panelHeightEstimate - dp(12)
        } else {
            fabParams.y + dp(FAB_SIZE_DP) + dp(12)
        }
        val maxLeft = (metrics.widthPixels - dp(PANEL_WIDTH_DP) - dp(12)).coerceAtLeast(dp(12))
        panelParams.x = (fabParams.x - dp(PANEL_WIDTH_DP) + dp(FAB_SIZE_DP)).coerceIn(dp(12), maxLeft)
        if (panelView.visibility == View.VISIBLE) {
            windowManager.updateViewLayout(panelView, panelParams)
        }
    }

    private fun toggleRecording() {
        if (recording) stopRecordingLoop() else startRecordingLoop()
    }

    private fun startRecordingLoop() {
        val apiKey = Prefs.getApiKey(this)
        if (apiKey.isNullOrBlank()) {
            showPanel()
            addLine("Nenhuma chave de API configurada. Abra o app Ovy e salve sua chave.", true)
            return
        }
        recording = true
        fab.setBackgroundResource(R.drawable.fab_background_active)
        showPanel()
        linesText.text = ""
        addLine("Ativando captura de áudio…")

        serviceScope.launch {
            while (recording) {
                if (System.currentTimeMillis() < backoffUntil) {
                    delay(backoffUntil - System.currentTimeMillis())
                }
                val file = recordChunk()
                if (file != null && recording) {
                    processChunk(file)
                } else {
                    file?.delete()
                }
            }
        }
    }

    private fun stopRecordingLoop() {
        recording = false
        fab.setBackgroundResource(R.drawable.fab_background)
        val activeRecorder = recorder
        recorder = null
        try {
            activeRecorder?.stop()
            activeRecorder?.release()
        } catch (e: Exception) {
            Log.w("OvyOverlay", "Erro ao parar gravação em andamento", e)
        }
    }

    private suspend fun recordChunk(): File? = withContext(Dispatchers.IO) {
        val file = File(cacheDir, "ovy_chunk_${System.currentTimeMillis()}.m4a")
        val mr = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) MediaRecorder(this@OverlayService) else MediaRecorder()
        try {
            mr.setAudioSource(MediaRecorder.AudioSource.MIC)
            mr.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            mr.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            mr.setOutputFile(file.absolutePath)
            mr.prepare()
            mr.start()
            recorder = mr
            delay(CHUNK_MS)
            if (recorder === mr) {
                mr.stop()
                mr.release()
                recorder = null
            }
            file
        } catch (e: Exception) {
            Log.e("OvyOverlay", "Erro ao gravar bloco", e)
            try {
                mr.release()
            } catch (_: Exception) {
            }
            if (recorder === mr) recorder = null
            null
        }
    }

    private suspend fun processChunk(file: File) {
        val apiKey = Prefs.getApiKey(this)
        if (apiKey.isNullOrBlank()) {
            file.delete()
            return
        }
        if (file.length() < 2000) {
            // bloco quase vazio (silêncio), ignora sem reportar erro
            file.delete()
            return
        }

        val result = withContext(Dispatchers.IO) { ApiClient.transcribeChunk(apiKey, file) }
        file.delete()

        withContext(Dispatchers.Main) {
            when (result) {
                is ApiClient.ChunkResult.Success -> {
                    if (result.text.isNotBlank()) addLine(result.text)
                }
                is ApiClient.ChunkResult.RateLimited -> {
                    backoffUntil = System.currentTimeMillis() + result.retryAfterSeconds * 1000L
                    addLine("${result.message} Pausando ${result.retryAfterSeconds}s…", true)
                }
                is ApiClient.ChunkResult.Error -> {
                    addLine(result.message, true)
                }
            }
        }
    }

    private fun showPanel() {
        repositionPanel()
        panelView.visibility = View.VISIBLE
        windowManager.updateViewLayout(panelView, panelParams)
    }

    private fun addLine(text: String, isError: Boolean = false) {
        val line = if (isError) "⚠ $text" else text
        val current = linesText.text?.toString().orEmpty()
        val prefix = if (current.isBlank()) "" else "$current\n"
        linesText.text = "$prefix$line"
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRecordingLoop()
        serviceScope.cancel()
        try {
            windowManager.removeView(fabView)
        } catch (e: Exception) {
            // já removida
        }
        try {
            windowManager.removeView(panelView)
        } catch (e: Exception) {
            // já removida
        }
    }
}
